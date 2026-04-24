import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/contact-requests/[id]
 *
 * Founder 가 자기가 받은 contact request 의 상태 변경.
 * body: { status: "read" | "archived" }
 *
 * RLS 가 founder 본인만 UPDATE 가능하게 막아줌.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const status = body?.status;
  if (!["read", "archived", "unread"].includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const patch: Record<string, unknown> = { status };
  if (status === "read") patch.read_at = new Date().toISOString();
  if (status === "archived") patch.archived_at = new Date().toISOString();
  if (status === "unread") {
    patch.read_at = null;
    patch.archived_at = null;
  }

  const { error } = await supabase
    .from("contact_requests")
    .update(patch)
    .eq("id", id)
    .eq("founder_user_id", user.id);

  if (error) {
    console.error("PATCH contact-request:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
