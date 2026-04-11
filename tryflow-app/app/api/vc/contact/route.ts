import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 구독 확인
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, plan")
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  if (!subscription) {
    return NextResponse.json({ error: "Active subscription required" }, { status: 403 });
  }

  const { ideaId, subject, message } = await request.json();

  if (!ideaId) {
    return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
  }

  // 아이디어 조회 (allow_contact=true인 것만)
  const { data: idea } = await supabase
    .from("idea_submissions")
    .select("id, category, contact_email, allow_contact")
    .eq("id", ideaId)
    .eq("allow_contact", true)
    .maybeSingle();

  if (!idea?.contact_email) {
    return NextResponse.json({ error: "This idea does not allow contact" }, { status: 400 });
  }

  // 이력 저장 (실제 발송은 VC가 Gmail에서 직접)
  await supabase.from("contact_requests").insert({
    id: crypto.randomUUID(),
    sender_id: user.id,
    idea_id: ideaId,
    recipient_email: idea.contact_email,
    subject: subject ?? "",
    message: message ?? "",
    status: "opened",
  });

  // Gmail 작성 URL 생성
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm` +
    `&to=${encodeURIComponent(idea.contact_email)}` +
    `&su=${encodeURIComponent(subject ?? "")}` +
    `&body=${encodeURIComponent(message ?? "")}`;

  return NextResponse.json({ gmailUrl });
}
