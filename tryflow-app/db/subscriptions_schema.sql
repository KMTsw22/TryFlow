-- ============================================================
-- subscriptions 테이블 생성
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id TEXT PRIMARY KEY,                              -- Stripe subscription ID
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT NOT NULL UNIQUE,
  subscription_type TEXT NOT NULL DEFAULT 'viewer'  -- 'viewer' | 'submitter' | 'bundle'
    CHECK (subscription_type IN ('viewer', 'submitter', 'bundle')),
  plan TEXT NOT NULL DEFAULT 'pro',                 -- legacy tier label (kept for history)
  status TEXT NOT NULL DEFAULT 'active',            -- 'active' | 'canceled' | 'past_due' | 'trialing'
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_type ON subscriptions(user_id, subscription_type);

-- RLS: 본인 것만 읽기 (webhook은 service-role key로 우회)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read_own_subscription"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
