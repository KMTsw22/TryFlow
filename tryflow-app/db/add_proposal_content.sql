-- Fastlane — 출품 원문 전체 저장 컬럼.
-- competitions.sql 이후에 적용.
--
-- summary 는 업로드 시 AI 가 생성한 human-facing 요약(유지 — 목록/상세 표시용).
-- content 는 업로드된 파일의 본문 원문 전체로, AI 채점(evaluate 파이프라인)이
-- 실제로 판단하는 텍스트다. 즉 "요약본"이 아니라 "원문"으로 점수를 매긴다.
-- content 가 비어있으면(직접 입력 / 마이그레이션 전 레거시) 채점은 summary 로 fallback.

alter table proposals
  add column if not exists content text not null default '';
