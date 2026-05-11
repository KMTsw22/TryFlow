// Service role 클라이언트. RLS 를 우회하므로 서버사이드 신뢰 가능한
// 백그라운드 잡(웹훅, AI 평가 등) 에서만 써야 한다. 절대 클라이언트
// 번들에 포함하면 안 됨 — 환경변수 SUPABASE_SERVICE_ROLE_KEY 가
// 없으면 명시적으로 throw 한다.

import { createClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  return createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
