-- ── 분쟁 결정 RLS 정책 확장 ──────────────────────────────────────
--
-- 기존 정책 "organizer manages disputes" 는 organizer 본인만 쓰기 허용했음.
-- 그러나 분쟁 결정 UI 는 "심사 작업" 섹션 안에 있어 심사위원도 결정 버튼을
-- 보게 되고, 누르면 RLS 위반 에러:
--   "new row violates row-level security policy for table
--    proposal_dispute_resolutions"
--
-- Fastlane 컨셉(분쟁만 사람 = 심사위원이 검토·결정) 에 맞춰 정책을 확장:
-- organizer 또는 해당 대회의 등록된 심사위원이면 분쟁 결정 가능.
--
-- 실행 방법:
--   1) Supabase 대시보드 → SQL Editor
--   2) 아래 SQL 전체 붙여넣기 → Run

drop policy if exists "organizer manages disputes" on proposal_dispute_resolutions;
drop policy if exists "organizer or judge manages disputes" on proposal_dispute_resolutions;

create policy "organizer or judge manages disputes"
  on proposal_dispute_resolutions for all
  using (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select id from competitions where user_id = auth.uid()
        union
        select competition_id from competition_judges where judge_id = auth.uid()
      )
    )
  )
  with check (
    proposal_id in (
      select p.id from proposals p
      where p.competition_id in (
        select id from competitions where user_id = auth.uid()
        union
        select competition_id from competition_judges where judge_id = auth.uid()
      )
    )
  );

-- 끝. judge 의 "select" 정책은 기존 그대로 유지.
