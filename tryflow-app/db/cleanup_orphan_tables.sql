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
-- 의존성(STEP 2 1차 실행에서 확인됨):
--   evaluation_runs.rubric_id → organizer_rubrics (FK: evaluation_runs_rubric_id_fkey)
--   → 셋 다 삭제 대상이며, 의존이 이 3개 안에서만 얽힘(외부 활성 테이블 아님).
--
-- 참조하는 쪽(evaluation_runs)을 먼저 지운 뒤 organizer_rubrics 를 지운다.
-- 마지막 CASCADE 는 혹시 다른 잔여 FK 가 있어도 정리되게 하는 안전 보강.
DROP TABLE IF EXISTS evaluation_runs;             -- organizer_rubrics 를 참조 → 먼저 삭제
DROP TABLE IF EXISTS idea_evaluations;
DROP TABLE IF EXISTS organizer_rubrics CASCADE;   -- 위에서 evaluation_runs 가 사라졌으므로 안전
