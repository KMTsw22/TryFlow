-- ============================================================
-- 2026-05: Profile self-introduction video
--
-- 1) user_profiles 에 영상 메타 컬럼 추가
-- 2) Supabase Storage 버킷 'user-intro-videos' 생성 + RLS
--
-- Supabase Dashboard > SQL Editor 에서 실행.
-- ============================================================

-- ── 1. Columns ──────────────────────────────────────────────
ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS intro_video_url              TEXT,
  ADD COLUMN IF NOT EXISTS intro_video_duration_seconds INT;

-- 길이 가드: 100초까지만 허용 (UI 와 동일한 한도, 우회 방어)
DO $$ BEGIN
  ALTER TABLE user_profiles ADD CONSTRAINT intro_video_duration_check
    CHECK (
      intro_video_duration_seconds IS NULL
      OR (intro_video_duration_seconds > 0 AND intro_video_duration_seconds <= 100)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── 2. Storage bucket ──────────────────────────────────────
-- public = true 로 두면 서명 없이 직접 재생 가능. 100MB 한도.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-intro-videos',
  'user-intro-videos',
  true,
  104857600, -- 100 MiB
  ARRAY['video/mp4', 'video/quicktime', 'video/webm']
)
ON CONFLICT (id) DO UPDATE
  SET public             = EXCLUDED.public,
      file_size_limit    = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ── 3. Storage RLS ─────────────────────────────────────────
-- 경로 컨벤션: '<user_id>/<filename>'  → 첫 폴더 세그먼트가 본인 uid 일 때만 쓰기 허용.
-- 읽기는 누구나 (public bucket).

DROP POLICY IF EXISTS "intro_videos_read"   ON storage.objects;
DROP POLICY IF EXISTS "intro_videos_insert" ON storage.objects;
DROP POLICY IF EXISTS "intro_videos_update" ON storage.objects;
DROP POLICY IF EXISTS "intro_videos_delete" ON storage.objects;

CREATE POLICY "intro_videos_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'user-intro-videos');

CREATE POLICY "intro_videos_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'user-intro-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "intro_videos_update"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'user-intro-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "intro_videos_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'user-intro-videos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
