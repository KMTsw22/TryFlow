import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/inbox
 *
 * 현재 사용자의 받은 intro 요청 목록. Founder 관점 — VC 가 보낸 요청들.
 * 선택 쿼리:
 *   ?status=unread|read|archived  (기본: unread + read)
 *   ?limit=N  (기본 50)
 *
 * RLS 가 auth.uid() = founder_user_id 로 자동 필터링하므로 별도 체크 불필요.
 */
export async function GET(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

  let query = supabase
    .from("contact_requests")
    .select(`
      id, vc_user_id, submission_id, subject, message, status,
      created_at, read_at, archived_at
    `)
    .eq("founder_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && ["unread", "read", "archived"].includes(status)) {
    query = query.eq("status", status);
  } else {
    // 기본: archived 제외
    query = query.neq("status", "archived");
  }

  const { data, error } = await query;
  if (error) {
    console.error("GET /api/inbox:", error);
    return NextResponse.json({ error: "Failed to load inbox" }, { status: 500 });
  }

  return NextResponse.json({ requests: data ?? [] });
}
