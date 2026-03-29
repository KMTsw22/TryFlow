-- ============================================================
-- TryFlow — Supabase Schema
-- Supabase SQL Editor에서 순서대로 실행
-- ============================================================

-- ── 테이블 ────────────────────────────────────────────────

create table experiments (
  id            text primary key default gen_random_uuid()::text,
  user_id       uuid references auth.users(id) on delete cascade not null,
  slug          text unique not null,
  product_name  text not null,
  description   text not null default '',
  status        text not null default 'DRAFT', -- DRAFT | RUNNING | PAUSED | ENDED
  pricing_tiers jsonb not null default '[]',
  features      jsonb not null default '[]',
  hero_title    text,
  hero_subtitle text,
  cta_text      text not null default 'Join Waitlist',
  total_visitors integer not null default 0,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create table waitlist_entries (
  id            text primary key default gen_random_uuid()::text,
  experiment_id text references experiments(id) on delete cascade not null,
  email         text not null,
  created_at    timestamptz default now(),
  unique(experiment_id, email)
);

create table click_events (
  id            text primary key default gen_random_uuid()::text,
  experiment_id text references experiments(id) on delete cascade not null,
  event_type    text not null, -- pricing_click | feature_vote | waitlist_submit
  metadata      jsonb not null default '{}',
  created_at    timestamptz default now()
);

-- ── updated_at 자동 갱신 트리거 ───────────────────────────

create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at
  before update on experiments
  for each row execute function handle_updated_at();

-- ── Row Level Security ────────────────────────────────────

alter table experiments      enable row level security;
alter table waitlist_entries enable row level security;
alter table click_events     enable row level security;

-- experiments: 본인 실험 INSERT (with check 명시)
create policy "insert own experiments"
  on experiments for insert
  with check (auth.uid() = user_id);

-- experiments: 본인 실험 SELECT / UPDATE / DELETE
create policy "manage own experiments"
  on experiments for select
  using (auth.uid() = user_id);

create policy "update own experiments"
  on experiments for update
  using (auth.uid() = user_id);

create policy "delete own experiments"
  on experiments for delete
  using (auth.uid() = user_id);

-- experiments: RUNNING 상태는 모든 유저가 조회 가능 (explore 페이지)
create policy "public read running experiments"
  on experiments for select
  using (status = 'RUNNING');

-- waitlist_entries: 공개 삽입 (랜딩 페이지 방문자)
create policy "public insert waitlist"
  on waitlist_entries for insert
  with check (true);

-- waitlist_entries: 실험 소유자만 조회
create policy "owner select waitlist"
  on waitlist_entries for select
  using (
    exists (
      select 1 from experiments
      where experiments.id = waitlist_entries.experiment_id
        and experiments.user_id = auth.uid()
    )
  );

-- click_events: 공개 삽입 (랜딩 페이지 방문자)
create policy "public insert events"
  on click_events for insert
  with check (true);

-- click_events: 실험 소유자만 조회
create policy "owner select events"
  on click_events for select
  using (
    exists (
      select 1 from experiments
      where experiments.id = click_events.experiment_id
        and experiments.user_id = auth.uid()
    )
  );
