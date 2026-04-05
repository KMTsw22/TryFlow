-- ============================================================
-- analysis_reports — 멀티에이전트 AI 분석 결과 저장 테이블
-- Supabase SQL Editor에서 실행
-- ============================================================

create table analysis_reports (
  id              text primary key default gen_random_uuid()::text,
  submission_id   text references idea_submissions(id) on delete cascade not null unique,
  viability_score integer not null,
  summary         text not null,
  analysis        jsonb not null default '{}',
  cross_agent_insights jsonb not null default '[]',
  opportunities   jsonb not null default '[]',
  risks           jsonb not null default '[]',
  next_steps      jsonb not null default '[]',
  agent_results   jsonb not null default '{}',
  created_at      timestamptz default now()
);

-- Row Level Security
alter table analysis_reports enable row level security;

-- 누구나 조회 가능 (URL 기반 비공개)
create policy "public select analysis"
  on analysis_reports for select
  using (true);

-- API(서버)에서만 insert (service_role key 또는 anon + RLS bypass)
create policy "public insert analysis"
  on analysis_reports for insert
  with check (true);
