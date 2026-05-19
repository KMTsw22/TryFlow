-- ── fix: judge 가 본인 배정 대회의 proposals 를 select 할 수 있도록 RLS 확장 ──
--
-- 배경:
--   db/competitions.sql 에 정의된 proposals select 정책은 submitter / organizer
--   두 역할만 허용했다. 이후 add_judge_review_model.sql 로 competition_judges
--   테이블이 추가됐지만, proposals 자체 RLS 에는 judge 정책을 추가하지 않아서
--   심사위원이 자기 배정 대회의 출품을 조회할 수 없었음.
--
--   증상: /judge 에서 헤더에는 본인 이름이 뜨는데 ("심사위원 워크스페이스 · 김…")
--         "아직 평가할 출품이 없습니다" 가 표시됨. competition_judges 행은 select
--         되지만, 이어서 호출하는 proposals.select(...).in("competition_id", compIds)
--         가 RLS 에 막혀 빈 배열을 반환.
--
-- 적용:
--   Supabase SQL 에디터에 그대로 실행. 멱등(idempotent) — 여러 번 실행해도 안전.
--   PostgreSQL RLS 는 같은 테이블의 같은 명령(select)에 대한 여러 정책을 OR 로
--   결합하므로, 기존 "owner or submitter read proposals" 정책은 그대로 유지하고
--   judge 용 정책을 추가만 한다.

drop policy if exists "judges read proposals of assigned competitions" on proposals;
create policy "judges read proposals of assigned competitions"
  on proposals for select
  using (
    competition_id in (
      select competition_id from competition_judges where judge_id = auth.uid()
    )
  );
