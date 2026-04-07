-- insight_reports에 ai_description 컬럼 추가
ALTER TABLE insight_reports ADD COLUMN IF NOT EXISTS ai_description text;
