-- Fastlane 제안서 평가에 markdown 상세 리포트 컬럼 추가.
-- evaluate 라우트가 OpenAI synthesizer 단계에서 생성한 한국어 MD 리포트를 저장.
-- competitions.sql 이후에 적용.

alter table proposals
  add column if not exists evaluation_report_md text;

-- 항목별 심층 분석(Phase 2) 결과도 jsonb 로 별도 저장 — 디버깅, 재합성, 부분 재평가에 유용.
-- 형식: { criterionId: { markdown: string, generatedAt: string } }
alter table proposals
  add column if not exists axis_reports jsonb;
