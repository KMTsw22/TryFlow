-- ============================================================
-- v3: Simplified tier system — Free / Plus / Pro (was Viewer/Submitter/Bundle)
--   * user_profiles: merge viewer_plan + submitter_plan → plan ('free' | 'plus' | 'pro')
--   * subscriptions: subscription_type CHECK → ('plus' | 'pro')
-- Supabase Dashboard > SQL Editor 에서 한 번에 실행
-- ============================================================

-- ┌─────────────────────────────────────────────────────────┐
-- │ 1. user_profiles: add `plan` column + backfill + drop old│
-- │    mapping:                                              │
-- │      viewer-only  → pro                                  │
-- │      submitter-only → plus                               │
-- │      bundle       → pro                                  │
-- │      both free    → free                                 │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'plus', 'pro'));

UPDATE user_profiles SET plan =
  CASE
    WHEN viewer_plan = 'pro'    THEN 'pro'
    WHEN submitter_plan = 'pro' THEN 'plus'
    ELSE 'free'
  END
WHERE plan = 'free';

ALTER TABLE user_profiles DROP COLUMN IF EXISTS viewer_plan;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS submitter_plan;


-- ┌─────────────────────────────────────────────────────────┐
-- │ 2. subscriptions: migrate subscription_type values       │
-- │      viewer | bundle → pro                               │
-- │      submitter       → plus                              │
-- │    then tighten the CHECK constraint                     │
-- └─────────────────────────────────────────────────────────┘

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_subscription_type_check;

UPDATE subscriptions
  SET subscription_type = CASE
    WHEN subscription_type IN ('viewer', 'bundle') THEN 'pro'
    WHEN subscription_type = 'submitter'           THEN 'plus'
    ELSE subscription_type
  END;

UPDATE subscriptions
  SET plan = subscription_type;

ALTER TABLE subscriptions
  ADD CONSTRAINT subscriptions_subscription_type_check
  CHECK (subscription_type IN ('plus', 'pro'));


-- ============================================================
-- Done. Webhook now writes plan directly to user_profiles.plan.
-- ============================================================
