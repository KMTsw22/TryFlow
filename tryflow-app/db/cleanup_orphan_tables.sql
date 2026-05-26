-- ─────────────────────────────────────────────────────────────
-- 고아 테이블 정리 (코드 참조 0 — 구버전 잔재)
--
-- 코드/SQL/문서 전체에서 참조가 전혀 없는 테이블:
--   evaluation_runs    → proposal_reviews + proposals 평가 컬럼으로 대체됨
--   idea_evaluations   → insight_reports / analysis_reports 로 대체됨
--   organizer_rubrics  → 정적 rubric(fastlane/prompts) + competitions.criteria(JSON) 로 대체됨
--
-- ⚠️ DROP 은 되돌릴 수 없습니다. 아래 STEP 1 로 데이터가 있는지 먼저 확인하세요.
-- ─────────────────────────────────────────────────────────────

-- STEP 1 — 먼저 실행: 남은 데이터(행 수) 확인. 0 이거나 버려도 되는 값인지 검토.
SELECT 'evaluation_runs'   AS table_name, count(*) AS rows FROM evaluation_runs
UNION ALL SELECT 'idea_evaluations',  count(*) FROM idea_evaluations
UNION ALL SELECT 'organizer_rubrics', count(*) FROM organizer_rubrics;

-- STEP 2 — 검토 후 실행: 테이블 삭제.
--
-- 의존성(실행하며 확인됨) — 이 3개 안에서만 얽힌 3단 체인:
--   idea_evaluations.run_id   → evaluation_runs   (FK: idea_evaluations_run_id_fkey)
--   evaluation_runs.rubric_id → organizer_rubrics (FK: evaluation_runs_rubric_id_fkey)
--   (+ policy own_evaluations on idea_evaluations — 테이블 DROP 시 함께 사라짐)
--
-- 가장 자식(idea_evaluations)부터 부모(organizer_rubrics) 순으로 지운다.
-- 마지막 CASCADE 는 혹시 다른 잔여 FK 가 있어도 정리되게 하는 안전 보강.
DROP TABLE IF EXISTS idea_evaluations;            -- evaluation_runs 를 참조 → 가장 먼저
DROP TABLE IF EXISTS evaluation_runs;             -- organizer_rubrics 를 참조 → 다음
DROP TABLE IF EXISTS organizer_rubrics CASCADE;   -- 부모 → 마지막


-- ─────────────────────────────────────────────────────────────
-- 레거시 "AI 아이디어 분석" 기능 폐기 (앱이 대회 심사로 피벗 — 해당 UI 진입점 없음)
--
-- 관련 코드(페이지/API/컴포넌트/prompts)는 레포 루트 /old 로 이동 완료.
-- 아래 5개 테이블이 이 기능 전용이며 KEPT 테이블이 참조하지 않음.
--   idea_submissions   ← 부모 (제출된 아이디어)
--   insight_reports    → idea_submissions (FK, on delete cascade)
--   analysis_reports   → idea_submissions (FK, on delete cascade)
--   saved_ideas        → idea_submissions (FK, on delete cascade)
--   contact_requests   → idea_submissions (FK, on delete cascade)  [VC→작성자 연락/inbox]
-- ─────────────────────────────────────────────────────────────

-- STEP 3 — 먼저 실행: 행 수 확인.
SELECT 'idea_submissions' AS table_name, count(*) AS rows FROM idea_submissions
UNION ALL SELECT 'insight_reports',  count(*) FROM insight_reports
UNION ALL SELECT 'analysis_reports', count(*) FROM analysis_reports
UNION ALL SELECT 'saved_ideas',      count(*) FROM saved_ideas
UNION ALL SELECT 'contact_requests', count(*) FROM contact_requests;

-- STEP 4 — 검토 후 실행: 자식 테이블 먼저 → 부모(idea_submissions) 나중.
DROP TABLE IF EXISTS insight_reports;
DROP TABLE IF EXISTS analysis_reports;
DROP TABLE IF EXISTS saved_ideas;
DROP TABLE IF EXISTS contact_requests;
DROP TABLE IF EXISTS idea_submissions CASCADE;    -- 부모 마지막, CASCADE 는 안전 보강
