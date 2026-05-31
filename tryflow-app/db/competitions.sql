-- ============================================================
-- Fastlane — Competitions & Proposals
-- 주최자가 평가표(criteria template)를 정의한 대회를 운영하고,
-- 제안서를 받아 AI가 N회 실행 후 평균/표준편차로 채점한다.
-- Supabase SQL Editor 에서 실행. schema.sql 이후에 적용.
-- ============================================================

-- ── 테이블 ────────────────────────────────────────────────

create table if not exists competitions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references auth.users(id) on delete cascade not null,
  name            text not null,
  organizer       text not null default '',
  deadline        timestamptz not null,
  -- CriteriaTemplate (lib/fastlane/types.ts) 를 그대로 직렬화.
  -- { id, name, isBuiltin, criteria: [{ id, name, weight, description }] }
  template        jsonb not null,
  status          text not null default 'open', -- open | closed | archived
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists competitions_user_id_idx on competitions(user_id);
create index if not exists competitions_status_idx on competitions(status);

create table if not exists proposals (
  id              uuid primary key default gen_random_uuid(),
  competition_id  uuid references competitions(id) on delete cascade not null,
  -- 익명 제출 허용. 로그인한 사용자가 낸 경우만 채워짐.
  submitter_id    uuid references auth.users(id) on delete set null,
  title           text not null,
  team            text not null default '',
  -- summary: 업로드 시 AI 가 생성한 human-facing 요약(목록/상세 표시용).
  -- content: 업로드 파일의 원문 전체 — AI 채점이 실제로 판단하는 텍스트.
  --          비어있으면(직접 입력/레거시) 채점은 summary 로 fallback.
  summary         text not null default '',
  content         text not null default '',
  -- 평가 결과 — ProposalScore (lib/fastlane/types.ts) 직렬화.
  -- { proposalId, composite, runs, axes: [{ criterionId, mean, stddev, needsReview, reasoning? }] }
  -- AI 평가 전엔 null.
  score           jsonb,
  evaluation_status text not null default 'pending', -- pending | running | done | failed
  evaluation_error  text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists proposals_competition_id_idx on proposals(competition_id);
create index if not exists proposals_submitter_id_idx on proposals(submitter_id);

-- ── updated_at 자동 갱신 ──────────────────────────────────

-- handle_updated_at 함수는 schema.sql 에서 이미 정의됨.
drop trigger if exists set_competitions_updated_at on competitions;
create trigger set_competitions_updated_at
  before update on competitions
  for each row execute function handle_updated_at();

drop trigger if exists set_proposals_updated_at on proposals;
create trigger set_proposals_updated_at
  before update on proposals
  for each row execute function handle_updated_at();

-- ── Row Level Security ────────────────────────────────────

alter table competitions enable row level security;
alter table proposals    enable row level security;

-- competitions: 누구나 read (대회는 공개 정보)
drop policy if exists "public read competitions" on competitions;
create policy "public read competitions"
  on competitions for select
  using (true);

-- competitions: 본인만 insert/update/delete
drop policy if exists "owner insert competitions" on competitions;
create policy "owner insert competitions"
  on competitions for insert
  with check (auth.uid() = user_id);

drop policy if exists "owner update competitions" on competitions;
create policy "owner update competitions"
  on competitions for update
  using (auth.uid() = user_id);

drop policy if exists "owner delete competitions" on competitions;
create policy "owner delete competitions"
  on competitions for delete
  using (auth.uid() = user_id);

-- proposals: 대회 주최자는 모두 read, 제출자 본인도 read
drop policy if exists "owner or submitter read proposals" on proposals;
create policy "owner or submitter read proposals"
  on proposals for select
  using (
    auth.uid() = submitter_id
    or exists (
      select 1 from competitions
      where competitions.id = proposals.competition_id
        and competitions.user_id = auth.uid()
    )
  );

-- proposals: 누구나 제출 가능 (익명 포함). submitter_id 가 채워질 경우 본인 것만.
drop policy if exists "public insert proposals" on proposals;
create policy "public insert proposals"
  on proposals for insert
  with check (
    submitter_id is null or auth.uid() = submitter_id
  );

-- proposals: 대회 주최자만 update (평가 트리거, 상태 변경 등)
drop policy if exists "owner update proposals" on proposals;
create policy "owner update proposals"
  on proposals for update
  using (
    exists (
      select 1 from competitions
      where competitions.id = proposals.competition_id
        and competitions.user_id = auth.uid()
    )
  );

-- proposals: 대회 주최자 또는 제출자 본인만 delete
drop policy if exists "owner or submitter delete proposals" on proposals;
create policy "owner or submitter delete proposals"
  on proposals for delete
  using (
    auth.uid() = submitter_id
    or exists (
      select 1 from competitions
      where competitions.id = proposals.competition_id
        and competitions.user_id = auth.uid()
    )
  );
