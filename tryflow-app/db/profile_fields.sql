-- ============================================================
-- 2026-04: Public profile fields
-- 기존 user_profiles 에 공개 프로필용 컬럼 추가.
-- contact_linkedin 은 그대로 두고 (연락처 + 공개 프로필 양쪽에서 재사용)
-- bio + Twitter / GitHub / Website + 공개 여부 토글만 신설.
--
-- Supabase Dashboard > SQL Editor 에서 실행.
-- ============================================================

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS bio          TEXT,
  ADD COLUMN IF NOT EXISTS twitter_url  TEXT,
  ADD COLUMN IF NOT EXISTS github_url   TEXT,
  ADD COLUMN IF NOT EXISTS website_url  TEXT,
  -- 기본값 true = "익명 유지". 사용자가 명시적으로 끌 때만 공개 프로필 노출.
  ADD COLUMN IF NOT EXISTS profile_anonymous BOOLEAN NOT NULL DEFAULT true;

-- 글자수 가드 (DB 레벨에도 안전망)
DO $$ BEGIN
  ALTER TABLE user_profiles ADD CONSTRAINT bio_length_check
    CHECK (bio IS NULL OR length(bio) <= 200);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE user_profiles ADD CONSTRAINT url_length_check
    CHECK (
      (twitter_url IS NULL OR length(twitter_url) <= 300) AND
      (github_url  IS NULL OR length(github_url)  <= 300) AND
      (website_url IS NULL OR length(website_url) <= 300)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
