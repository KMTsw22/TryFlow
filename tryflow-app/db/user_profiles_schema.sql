-- ============================================================
-- user_profiles 테이블 + Google 로그인 자동 생성 트리거
-- Supabase Dashboard > SQL Editor 에서 실행
-- ============================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  -- 연락 수단 (제출자가 설정)
  contact_email TEXT,       -- 연락받을 이메일 (기본: 로그인 이메일)
  contact_phone TEXT,       -- 전화번호 (선택)
  contact_linkedin TEXT,    -- LinkedIn URL (선택)
  contact_other TEXT,       -- 기타 연락처 (선택)
  allow_contact BOOLEAN NOT NULL DEFAULT false,  -- 연락 허용 여부
  -- 구독 캐시 (webhook이 subscriptions 테이블과 동기화)
  --   free : 아이디어 제출만 (public 강제, 분석/비교 없음)
  --   plus : 자기 아이디어 private 업로드 + 정밀 분석 + 자기 아이디어끼리 비교
  --   pro  : plus + 남의 public 아이디어 열람/연락/비교 (전체)
  plan TEXT NOT NULL DEFAULT 'free'
    CHECK (plan IN ('free', 'plus', 'pro')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (VC가 제출자 프로필 조회 시 필요)
CREATE POLICY "read_profiles"
  ON user_profiles FOR SELECT USING (true);

-- 본인만 수정 가능
CREATE POLICY "update_own_profile"
  ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- 본인만 삽입 가능 (트리거에서 SECURITY DEFINER로 우회)
CREATE POLICY "insert_own_profile"
  ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Google 로그인 시 자동으로 user_profiles 생성
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, avatar_url, contact_email)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email  -- contact_email 기본값을 로그인 이메일로 설정
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 트리거가 있으면 삭제 후 재생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 기존 유저들의 user_profiles 백필 (이미 가입한 유저)
-- ============================================================
INSERT INTO user_profiles (id, email, full_name, avatar_url, contact_email)
SELECT
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url',
  email
FROM auth.users
WHERE id NOT IN (SELECT id FROM user_profiles)
ON CONFLICT (id) DO NOTHING;
