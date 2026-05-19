-- ============================================================
-- Fastlane — 심사위원 모델 + 분쟁 결정 + 검토 종료
--
-- 2026-05 senior pass 피드백 대응:
--   AI 1차 점수만 보여주면 사람 책임이 빠진다. 심사위원이 평가하고,
--   분쟁을 결정하고, 검토를 종료하는 흐름이 데이터에 박혀야 함.
--
-- 이 마이그레이션은 4가지를 추가한다:
--   1) proposals.review_closed_at  (컬럼 추가)
--   2) competition_judges          (대회별 심사위원 배정)
--   3) proposal_reviews            (심사위원이 한 출품에 단 평가)
--   4) proposal_dispute_resolutions (분쟁 axis 의 결정 기록)
--
-- 실행 순서: db/competitions.sql 이후. Supabase SQL Editor 에서 한 번에 실행.
-- ============================================================


-- ── 1) proposals 에 review_closed_at 컬럼 추가 ──────────────
--
-- 모든 분쟁 결정이 끝난 후 심사위원장이 "검토 종료" 를 명시적으로 누르면 채워짐.
-- 채워진 proposal 은 /competitions/pending 리스트에서 자동으로 빠진다.

alter table proposals
  add column if not exists review_closed_at timestamptz,
  add column if not exists review_closed_by uuid references auth.users(id) on delete set null;

create index if not exists proposals_review_closed_at_idx on proposals(review_closed_at);


-- ── 2) competition_judges — 대회별 심사위원 배정 ────────────
--
-- 한 사용자가 여러 대회의 심사위원일 수 있고, 한 대회에 여러 심사위원 배정.
-- judge_name / affiliation 은 denormalized — 리스트/카드 렌더 시 join 안 하기 위함.
-- (실 운영 시엔 user_profiles 와 sync 하는 trigger 를 따로 만드는 것이 정석.)

create table if not exists competition_judges (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid references competitions(id) on delete cascade not null,
  judge_id        uuid references auth.users(id) on delete cascade not null,
  judge_name      text not null default '',
  affiliation     text,
  -- 평가 범위. MVP 는 'all' 만 사용. 추후 'subset' + proposal_ids[] 확장 가능.
  scope           text not null default 'all',
  invited_at      timestamptz not null default now(),
  unique (competition_id, judge_id)
);

create index if not exists competition_judges_competition_idx on competition_judges(competition_id);
create index if not exists competition_judges_judge_idx on competition_judges(judge_id);

alter table competition_judges enable row level security;

-- organizer 는 본인 대회의 judge 목록 조회/관리.
-- judge 본인은 자기 배정 row 만 조회 (다른 사람 배정은 못 봄).

drop policy if exists "organizer manages own competition judges" on competition_judges;
create policy "organizer manages own competition judges"
  on competition_judges for all
  using (
    competition_id in (select id from competitions where user_id = auth.uid())
  )
  with check (
    competition_id in (select id from competitions where user_id = auth.uid())
  );

drop policy if exists "judge reads own assignments" on competition_judges;
create policy "judge reads own assignments"
  on competition_judges for select
  using (judge_id = auth.uid());


-- ── 3) proposal_reviews — 심사위원이 출품에 단 평가 ──────────
--
-- 한 (proposal, judge) 쌍 당 하나의 row. judge 가 draft 로 저장하다 submit 로 전환.
-- axes 는 AxisReview[] (lib/fastlane/types.ts) 의 jsonb 직렬화.
--   [{ criterionId, acceptedAiScore, overrideScore?, comment? }]

create table if not exists proposal_reviews (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid references proposals(id) on delete cascade not null,
  judge_id        uuid references auth.users(id) on delete cascade not null,
  judge_name      text not null default '',
  affiliation     text,
  axes            jsonb not null default '[]'::jsonb,
  overall_comment text,
  status          text not null default 'submitted', -- draft | submitted
  submitted_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (proposal_id, judge_id)
);

create index if not exists proposal_reviews_proposal_idx on proposal_reviews(proposal_id);
create index if not exists proposal_reviews_judge_idx on proposal_reviews(judge_id);

drop trigger if exists proposal_reviews_updated_at on proposal_reviews;
create trigger proposal_reviews_updated_at
  before update on proposal_reviews
  for each row execute function handle_updated_at();

alter table proposal_reviews enable row level security;

-- 읽기: organizer (본인 대회의 모든 review) + judge (본인 배정된 대회의 모든 review,
--       합의 시각화에 필요).
-- 쓰기: 본인 review 만.

drop policy if exists "read reviews of accessible proposals" on proposal_reviews;
create policy "read reviews of accessible proposals"
  on proposal_reviews for select
  using (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select id from competitions where user_id = auth.uid()
      )
      or p.competition_id in (
        select competition_id from competition_judges where judge_id = auth.uid()
      )
    )
  );

drop policy if exists "judges write own reviews" on proposal_reviews;
create policy "judges write own reviews"
  on proposal_reviews for insert
  with check (judge_id = auth.uid());

drop policy if exists "judges update own reviews" on proposal_reviews;
create policy "judges update own reviews"
  on proposal_reviews for update
  using (judge_id = auth.uid());


-- ── 4) proposal_dispute_resolutions — 분쟁 결정 ──────────────
--
-- 한 (proposal, criterion) 당 0~1개 row. 재결정 시 upsert.
-- action: accept_ai | accept_human_avg | manual_override | request_rereview
-- request_rereview 일 때만 final_score 가 null 가능.

create table if not exists proposal_dispute_resolutions (
  id              uuid primary key default gen_random_uuid(),
  proposal_id     uuid references proposals(id) on delete cascade not null,
  criterion_id    text not null,
  action          text not null,
  final_score     numeric,
  decided_by      uuid references auth.users(id) on delete set null,
  decided_by_name text not null default '',
  decided_at      timestamptz not null default now(),
  reason          text,
  unique (proposal_id, criterion_id)
);

create index if not exists proposal_disputes_proposal_idx on proposal_dispute_resolutions(proposal_id);

alter table proposal_dispute_resolutions enable row level security;

-- organizer 만 본인 대회 분쟁 결정 가능. (실 운영에서 심사위원장 역할은 organizer
-- 라는 가정. 추후 'lead_judge' role 분리 가능.)

drop policy if exists "organizer manages disputes" on proposal_dispute_resolutions;
create policy "organizer manages disputes"
  on proposal_dispute_resolutions for all
  using (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select id from competitions where user_id = auth.uid()
      )
    )
  )
  with check (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select id from competitions where user_id = auth.uid()
      )
    )
  );

-- judge 도 분쟁 결정 결과는 조회 가능 (자기가 평가한 출품의 최종 결정).
drop policy if exists "judges read disputes of accessible proposals" on proposal_dispute_resolutions;
create policy "judges read disputes of accessible proposals"
  on proposal_dispute_resolutions for select
  using (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select competition_id from competition_judges where judge_id = auth.uid()
      )
    )
  );


-- ── 5) 데모 편의 — 본인이 만든 대회에 본인을 judge 로 자동 등록 ──────────
--
-- 발표 시연 시 organizer/judge 가 같은 사용자라도 양쪽 시각을 다 보여줄 수 있게.
-- 실 운영에선 이 trigger 를 제거하고 명시적 초대 흐름으로 대체.

create or replace function auto_assign_owner_as_judge()
returns trigger
language plpgsql
security definer
as $$
declare
  v_name text;
begin
  -- email 의 local-part 만 사용 — user_profiles 스키마는 프로젝트마다 달라 의존 X.
  -- 실 운영에서 더 친절한 이름을 쓰고 싶으면 본인 user_profiles 의 컬럼명에 맞춰
  -- 이 함수만 따로 다시 교체하면 됨.
  select split_part(email, '@', 1) into v_name from auth.users where id = new.user_id;

  insert into competition_judges (competition_id, judge_id, judge_name, scope)
  values (new.id, new.user_id, coalesce(v_name, '나'), 'all')
  on conflict (competition_id, judge_id) do nothing;
  return new;
end;
$$;

drop trigger if exists competitions_auto_assign_owner_judge on competitions;
create trigger competitions_auto_assign_owner_judge
  after insert on competitions
  for each row execute function auto_assign_owner_as_judge();

-- 이미 존재하는 대회들에도 소급 적용. (CREATE TABLE / ON CONFLICT 가 모두
-- idempotent 라 전체 SQL 을 재실행해도 안전.)
insert into competition_judges (competition_id, judge_id, judge_name, scope)
select
  c.id,
  c.user_id,
  coalesce(
    split_part((select email from auth.users where id = c.user_id), '@', 1),
    '나'
  ),
  'all'
from competitions c
on conflict (competition_id, judge_id) do nothing;
