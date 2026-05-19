-- ============================================================
-- Fastlane — 심사위원 초대 링크 (Slack 스타일)
--
-- 주최자가 대회마다 invite link 를 만들어 공유하면, 받은 사람이 그 링크로
-- 로그인 → 자동으로 그 대회의 심사위원(competition_judges) 으로 등록된다.
-- 이메일·SMTP 의존 없이 링크 공유만으로 흐름이 완결되도록.
--
-- 의도적인 설계 트레이드오프:
--   - token (= primary key) 가 곧 secret. RLS 의 select 정책을 'true' 로 열어
--     누구나 token 매칭되는 row 를 단건 조회 가능. 안전성은 token 의 추측 불가능성
--     (32자 hex) 에 기댄다. 실 운영 시 access log 추가 권장.
--   - list 쿼리(어느 대회의 invitations) 는 API 라우트에서 competition_id 로
--     필터 + organizer 검증으로 보호.
-- ============================================================


create table if not exists competition_invitations (
  -- gen_random_uuid 의 하이픈을 빼서 URL 깔끔하게 (32자 hex).
  token           text primary key default replace(gen_random_uuid()::text, '-', ''),
  competition_id  uuid references competitions(id) on delete cascade not null,
  -- 발급자 추적 — denormalized name 으로 list 시 join 회피.
  invited_by      uuid references auth.users(id) on delete set null,
  invited_by_name text not null default '',
  -- MVP 는 'judge' 만. 추후 'lead_judge' 등 확장 여지.
  role            text not null default 'judge',
  -- 만료·횟수 제한 — null 이면 무제한 (슬랙 스타일 default).
  expires_at      timestamptz,
  max_uses        integer,
  used_count      integer not null default 0,
  -- 비활성화 — null 이면 활성.
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists competition_invitations_competition_idx
  on competition_invitations(competition_id);


alter table competition_invitations enable row level security;

-- ── RLS 정책 ─────────────────────────────────────────────────
--
-- 1) organizer 는 본인 대회 invitation 의 모든 라이프사이클 관리.
-- 2) 누구나 단건 select 는 통과 (token 이 secret). list 보호는 API 가 담당.

drop policy if exists "organizer manages own invitations" on competition_invitations;
create policy "organizer manages own invitations"
  on competition_invitations for all
  using (
    competition_id in (select id from competitions where user_id = auth.uid())
  )
  with check (
    competition_id in (select id from competitions where user_id = auth.uid())
  );

drop policy if exists "anyone reads invitation by token" on competition_invitations;
create policy "anyone reads invitation by token"
  on competition_invitations for select
  using (true);


-- ── 초대 수락 RPC ───────────────────────────────────────────
--
-- 로그인된 user 가 token 으로 invitation 을 수락하면:
--   1) invitation 유효성 검증 (활성 / 만료 안 됨 / 사용 한도 안 넘음)
--   2) competition_judges 에 user 등록 (이미 있으면 nothing — slack 식 멱등)
--   3) used_count + 1
-- 결과: 성공 시 competition_id 반환, 실패 시 null 반환 + reason 메시지.
--
-- security definer 로 RLS 우회 — 받은 사람이 organizer 가 아니어도 등록 가능.
-- 단 user 본인의 auth.uid() 를 사용해 다른 사람을 등록할 수 없게 강제.

create or replace function accept_competition_invitation(
  p_token text,
  p_judge_name text default null,
  p_affiliation text default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_inv competition_invitations%rowtype;
  v_user uuid := auth.uid();
  v_already boolean := false;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_inv from competition_invitations where token = p_token;
  if not found then
    raise exception 'INVITATION_NOT_FOUND';
  end if;
  if v_inv.revoked_at is not null then
    raise exception 'INVITATION_REVOKED';
  end if;
  if v_inv.expires_at is not null and v_inv.expires_at < now() then
    raise exception 'INVITATION_EXPIRED';
  end if;
  if v_inv.max_uses is not null and v_inv.used_count >= v_inv.max_uses then
    raise exception 'INVITATION_LIMIT_REACHED';
  end if;

  -- 이미 judge 인지 확인 — 멱등성. 두 번 수락해도 OK.
  -- RETURNS TABLE 의 column 이름(judge_id, competition_id)과 테이블 컬럼이
  -- 같아 ambiguous 에러가 나므로, 모든 컬럼 참조를 alias 로 명시.
  perform 1 from competition_judges cj
    where cj.competition_id = v_inv.competition_id
      and cj.judge_id = v_user;
  if found then
    v_already := true;
  end if;

  -- competition_judges 에 등록. 이름은 인자 > auth.users.email local-part.
  insert into competition_judges (
    competition_id, judge_id, judge_name, affiliation, scope
  ) values (
    v_inv.competition_id,
    v_user,
    coalesce(
      nullif(trim(p_judge_name), ''),
      (select split_part(email, '@', 1) from auth.users where id = v_user),
      '심사위원'
    ),
    nullif(trim(p_affiliation), ''),
    'all'
  )
  on conflict (competition_id, judge_id) do nothing;

  -- 사용 횟수 증가 — 이미 judge 였더라도 카운트는 올림 (감사 추적).
  update competition_invitations
    set used_count = used_count + 1
    where token = p_token;

  -- jsonb 반환 — RETURNS TABLE 의 OUT 컬럼이 함수 본문 SQL 의 컬럼명과
  -- 충돌해 ambiguous 에러가 계속 났던 문제를 통째로 회피한다.
  return jsonb_build_object(
    'competition_id', v_inv.competition_id,
    'judge_id', v_user,
    'was_already_judge', v_already
  );
end;
$$;

-- 누구나(로그인된 user) 이 함수 호출 가능 — 안에서 auth.uid() 로 본인만 등록.
grant execute on function accept_competition_invitation(text, text, text) to authenticated;
