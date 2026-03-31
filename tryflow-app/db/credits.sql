-- ============================================================
-- TryFlow — 크레딧 시스템
-- 이전 마이그레이션(add_reply.sql, add_project_url.sql) 이후에 실행
-- ============================================================

-- ── user_credits 테이블 ────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_credits (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance    integer NOT NULL DEFAULT 2000 CHECK (balance >= 0),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- 본인 크레딧만 조회 가능
CREATE POLICY "select own credits"
  ON user_credits FOR SELECT
  USING (auth.uid() = user_id);

-- ── 신규 가입 시 크레딧 10,000 자동 지급 트리거 ─────────────

CREATE OR REPLACE FUNCTION handle_new_user_credits()
RETURNS trigger AS $$
BEGIN
  INSERT INTO user_credits (user_id, balance)
  VALUES (NEW.id, 2000)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_credits
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_credits();

-- ── 크레딧 차감 함수 (원자적, 잔액 부족 시 false 반환) ────────

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

-- ── 크레딧 적립 함수 ──────────────────────────────────────────

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

-- ── experiments에 expires_at 추가 (실험실 1주일 노출 기간) ───

ALTER TABLE experiments
  ADD COLUMN IF NOT EXISTS expires_at timestamptz;

-- ── comments에 user_id 추가 (크레딧 지급 대상 식별) ──────────

ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- ── 기존 사용자에게 크레딧 소급 지급 (이미 가입된 유저) ────────
-- 새로 가입한 유저는 트리거로 자동 지급, 기존 유저는 아래 구문으로 수동 지급

INSERT INTO user_credits (user_id, balance)
SELECT id, 2000
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
