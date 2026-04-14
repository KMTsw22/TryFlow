-- ============================================================
-- v2: Subscription 2-axis split (Viewer / Submitter / Bundle)
--     + idea_submissions.is_private
-- Supabase Dashboard > SQL Editor 에서 한 번에 실행
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. subscriptions: subscription_type 컬럼 추가              │
-- │    - 'viewer' | 'submitter' | 'bundle'                   │
-- │    - 한 유저가 여러 row 가질 수 있음 (solo+solo 조합 허용) │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS subscription_type TEXT NOT NULL DEFAULT 'viewer'
    CHECK (subscription_type IN ('viewer', 'submitter', 'bundle'));

-- 기존 row들은 legacy pro = Viewer로 백필 (v2 이전 구독자는 모두 /explore 접근용)
UPDATE subscriptions
  SET subscription_type = 'viewer'
  WHERE subscription_type IS NULL OR subscription_type = 'viewer';

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type
  ON subscriptions(user_id, subscription_type);


-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. user_profiles: viewer_plan / submitter_plan 캐시 추가  │
-- │    webhook이 여기에 동기화해 middleware에서 1회 조회로 해결│
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS viewer_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (viewer_plan IN ('free', 'pro'));

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS submitter_plan TEXT NOT NULL DEFAULT 'free'
    CHECK (submitter_plan IN ('free', 'pro'));

-- 기존 active 구독자 백필: legacy pro → viewer_plan='pro'
UPDATE user_profiles p
  SET viewer_plan = 'pro'
  FROM subscriptions s
  WHERE s.user_id = p.id
    AND s.status = 'active'
    AND s.subscription_type IN ('viewer', 'bundle');

UPDATE user_profiles p
  SET submitter_plan = 'pro'
  FROM subscriptions s
  WHERE s.user_id = p.id
    AND s.status = 'active'
    AND s.subscription_type IN ('submitter', 'bundle');


-- ┌─────────────────────────────────────────────────────────┐
-- │ 3. idea_submissions.is_private                           │
-- │    Submitter Pro만 true로 올릴 수 있음 (앱 레벨 enforce)  │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE idea_submissions
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN NOT NULL DEFAULT false;

-- /explore 리스트에서 private 제외를 효율화
CREATE INDEX IF NOT EXISTS idx_idea_submissions_is_private
  ON idea_submissions(is_private);


-- ============================================================
-- 완료! webhook이 price.id → subscription_type을 판별해
-- subscriptions와 user_profiles를 동시에 동기화합니다.
-- ============================================================
