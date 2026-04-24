-- ============================================================
-- 2026-04: Axis-specific submission questions
-- 단일 description → category + target_user + 6 axis 별 질문 1개씩.
-- 기존 description 컬럼은 유지 (concat 으로 채움) — backwards compat.
--
-- Supabase Dashboard > SQL Editor 에서 실행.
-- ============================================================

ALTER TABLE idea_submissions
  ADD COLUMN IF NOT EXISTS axis_market           TEXT,
  ADD COLUMN IF NOT EXISTS axis_problem          TEXT,
  ADD COLUMN IF NOT EXISTS axis_timing           TEXT,
  ADD COLUMN IF NOT EXISTS axis_product          TEXT,
  ADD COLUMN IF NOT EXISTS axis_defensibility    TEXT,
  ADD COLUMN IF NOT EXISTS axis_business_model   TEXT;

-- 글자수 가드 (DB 안전망 — 클라이언트도 막지만 이중 방어)
DO $$ BEGIN
  ALTER TABLE idea_submissions ADD CONSTRAINT axis_length_check
    CHECK (
      (axis_market         IS NULL OR length(axis_market)         <= 500) AND
      (axis_problem        IS NULL OR length(axis_problem)        <= 500) AND
      (axis_timing         IS NULL OR length(axis_timing)         <= 500) AND
      (axis_product        IS NULL OR length(axis_product)        <= 500) AND
      (axis_defensibility  IS NULL OR length(axis_defensibility)  <= 500) AND
      (axis_business_model IS NULL OR length(axis_business_model) <= 500)
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
