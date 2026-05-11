-- Fastlane — 대회 테마 + rubric 자동 생성 상태 컬럼 추가.
-- competitions.sql 이후에 적용.
--
-- theme: 도메인/주제 (예: "농업·스마트팜") — rubric 생성에 컨텍스트로 사용.
-- rubric_status: 평가 항목별 rubric 자동 생성 상태.
--   pending    — 아직 시작 전
--   generating — 백그라운드에서 생성 중
--   ready      — 모든 항목의 rubric 이 template.criteria[].rubric_md 에 저장됨
--   failed     — 생성 중 오류
-- rubric_error: 실패 시 메시지.

alter table competitions
  add column if not exists theme text not null default '';

alter table competitions
  add column if not exists rubric_status text not null default 'pending';

alter table competitions
  add column if not exists rubric_error text;

-- rubric_status 값을 enum 처럼 제한.
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'competitions_rubric_status_chk'
  ) then
    alter table competitions
      add constraint competitions_rubric_status_chk
      check (rubric_status in ('pending', 'generating', 'ready', 'failed'));
  end if;
end $$;
