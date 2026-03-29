-- 기존 정책 제거 후 재생성 (이미 테이블이 있을 때 실행)

drop policy if exists "own experiments" on experiments;

create policy "insert own experiments"
  on experiments for insert
  with check (auth.uid() = user_id);

create policy "manage own experiments"
  on experiments for select
  using (auth.uid() = user_id);

create policy "update own experiments"
  on experiments for update
  using (auth.uid() = user_id);

create policy "delete own experiments"
  on experiments for delete
  using (auth.uid() = user_id);

-- RUNNING 실험은 모든 로그인 유저가 explore 페이지에서 볼 수 있음
create policy "public read running experiments"
  on experiments for select
  using (status = 'RUNNING');
