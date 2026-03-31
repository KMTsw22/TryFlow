-- ============================================================
-- TryFlow — 전체 DB 스키마 (한 번에 실행용)
-- Supabase SQL Editor에 전체 붙여넣기 후 실행
-- 순서: 테이블 → RLS → 트리거/함수 → 마이그레이션 → 크레딧 시스템
-- ============================================================


-- ════════════════════════════════════════════════════════════
-- 1. 핵심 테이블
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS experiments (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id       uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  slug          text UNIQUE NOT NULL,
  product_name  text NOT NULL,
  description   text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'DRAFT', -- DRAFT | RUNNING | PAUSED | ENDED
  pricing_tiers jsonb NOT NULL DEFAULT '[]',
  features      jsonb NOT NULL DEFAULT '[]',
  hero_title    text,
  hero_subtitle text,
  cta_text      text NOT NULL DEFAULT 'Join Waitlist',
  total_visitors integer NOT NULL DEFAULT 0,
  category      text NOT NULL DEFAULT 'Other',
  maker_name    text NOT NULL DEFAULT '',
  project_url   text NOT NULL DEFAULT '',
  expires_at    timestamptz,
  created_at    timestamptz DEFAULT now(),
  updated_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist_entries (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  experiment_id text REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  email         text NOT NULL,
  created_at    timestamptz DEFAULT now(),
  UNIQUE(experiment_id, email)
);

CREATE TABLE IF NOT EXISTS click_events (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  experiment_id text REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  event_type    text NOT NULL, -- page_view | pricing_vote | feature_vote | waitlist_submit
  metadata      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id            text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  experiment_id text REFERENCES experiments(id) ON DELETE CASCADE NOT NULL,
  author_name   text NOT NULL,
  content       text NOT NULL,
  parent_id     text REFERENCES comments(id) ON DELETE CASCADE,
  user_id       uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS user_credits (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    integer NOT NULL DEFAULT 10000 CHECK (balance >= 0),
  updated_at timestamptz DEFAULT now()
);


-- ════════════════════════════════════════════════════════════
-- 2. updated_at 자동 갱신 트리거
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON experiments;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();


-- ════════════════════════════════════════════════════════════
-- 3. Row Level Security 활성화
-- ════════════════════════════════════════════════════════════

ALTER TABLE experiments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE click_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits     ENABLE ROW LEVEL SECURITY;


-- ════════════════════════════════════════════════════════════
-- 4. RLS 정책
-- ════════════════════════════════════════════════════════════

-- ── experiments ──────────────────────────────────────────────

DROP POLICY IF EXISTS "insert own experiments"       ON experiments;
DROP POLICY IF EXISTS "manage own experiments"       ON experiments;
DROP POLICY IF EXISTS "update own experiments"       ON experiments;
DROP POLICY IF EXISTS "delete own experiments"       ON experiments;
DROP POLICY IF EXISTS "public read running experiments" ON experiments;
DROP POLICY IF EXISTS "own experiments"              ON experiments;

CREATE POLICY "insert own experiments"
  ON experiments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "manage own experiments"
  ON experiments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "update own experiments"
  ON experiments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "delete own experiments"
  ON experiments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "public read running experiments"
  ON experiments FOR SELECT
  USING (status = 'RUNNING');

-- ── waitlist_entries ──────────────────────────────────────────

DROP POLICY IF EXISTS "public insert waitlist" ON waitlist_entries;
DROP POLICY IF EXISTS "owner select waitlist"  ON waitlist_entries;

CREATE POLICY "public insert waitlist"
  ON waitlist_entries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "owner select waitlist"
  ON waitlist_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = waitlist_entries.experiment_id
        AND experiments.user_id = auth.uid()
    )
  );

-- ── click_events ──────────────────────────────────────────────

DROP POLICY IF EXISTS "public insert events" ON click_events;
DROP POLICY IF EXISTS "owner select events"  ON click_events;

CREATE POLICY "public insert events"
  ON click_events FOR INSERT
  WITH CHECK (true);

CREATE POLICY "owner select events"
  ON click_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = click_events.experiment_id
        AND experiments.user_id = auth.uid()
    )
  );

-- ── comments ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "public insert comments"   ON comments;
DROP POLICY IF EXISTS "public read comments"     ON comments;
DROP POLICY IF EXISTS "owner read all comments"  ON comments;

CREATE POLICY "public insert comments"
  ON comments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "public read comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = comments.experiment_id
        AND experiments.status = 'RUNNING'
    )
  );

CREATE POLICY "owner read all comments"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM experiments
      WHERE experiments.id = comments.experiment_id
        AND experiments.user_id = auth.uid()
    )
  );

-- ── user_credits ──────────────────────────────────────────────

DROP POLICY IF EXISTS "select own credits" ON user_credits;

CREATE POLICY "select own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

 
-- ════════════════════════════════════════════════════════════
-- 5. 크레딧 함수
-- ════════════════════════════════════════════════════════════

-- 신규 가입 시 10,000 크레딧 자동 지급
CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 10000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_credits ON auth.users;
CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();

-- 크레딧 차감 (원자적, 잔액 부족 시 false 반환)
CREATE OR REPLACE FUNCTION deduct_credits(p_user_id uuid, p_amount integer)
RETURNS boolean AS $$
DECLARE
  current_balance integer;
BEGIN
  SELECT balance INTO current_balance
  FROM user_credits
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF current_balance IS NULL OR current_balance < p_amount THEN
    RETURN FALSE;
  END IF;

  UPDATE user_credits
  SET balance = balance - p_amount, updated_at = now()
  WHERE user_id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 크레딧 적립
CREATE OR REPLACE FUNCTION add_credits(p_user_id uuid, p_amount integer)
RETURNS void AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (user_id) DO UPDATE
    SET balance = user_credits.balance + p_amount,
        updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ════════════════════════════════════════════════════════════
-- 6. 카테고리 마이그레이션 (구버전 이름 → 신버전 이름)
-- ════════════════════════════════════════════════════════════

UPDATE experiments SET category = 'Health'      WHERE category = 'HealthTech';
UPDATE experiments SET category = 'Education'   WHERE category = 'EdTech';
UPDATE experiments SET category = 'Marketplace' WHERE category = 'FoodTech';
UPDATE experiments SET category = 'Social'      WHERE category = 'Community';
UPDATE experiments SET category = 'SaaS'        WHERE category = 'Tech';
UPDATE experiments SET category = 'Other'
  WHERE category NOT IN (
    'SaaS', 'Marketplace', 'Consumer', 'Dev Tools',
    'Health', 'Education', 'Social', 'Other'
  );


-- ════════════════════════════════════════════════════════════
-- 7. 기존 유저 크레딧 소급 지급
-- ════════════════════════════════════════════════════════════

INSERT INTO user_credits (user_id, balance)
SELECT id, 10000
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
