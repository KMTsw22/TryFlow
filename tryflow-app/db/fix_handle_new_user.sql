-- ============================================================
-- 2026-04: handle_new_user() 트리거 안정화
--
-- 증상:
--   /login?error=auth_failed#error_description=Database+error+saving+new+user
--   신규 가입 시 auth.users insert 트랜잭션이 트리거 실패로 롤백.
--
-- 원인:
--   1) SECURITY DEFINER 함수에 search_path 미설정 → 일부 환경에서 schema 해석 실패
--   2) EXCEPTION handler 없음 → 프로필 INSERT 실패가 회원가입 자체를 막음
--   3) 향후 user_profiles 에 NOT NULL 컬럼 추가될 때마다 트리거 깨질 위험
--
-- Supabase Dashboard > SQL Editor 에서 실행.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, avatar_url, contact_email)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 프로필 생성 실패는 회원가입을 막지 않음. 누락된 row 는 앱 첫 진입 시 보강.
    RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- 트리거 재바인딩 (혹시 이전 함수 OID 캐시 문제 대비)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 트리거 실패로 user_profiles row 가 안 만들어진 기존 유저들 백필
INSERT INTO public.user_profiles (id, email, full_name, avatar_url, contact_email)
SELECT
  u.id,
  COALESCE(u.email, ''),
  u.raw_user_meta_data->>'full_name',
  u.raw_user_meta_data->>'avatar_url',
  u.email
FROM auth.users u
LEFT JOIN public.user_profiles p ON p.id = u.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
