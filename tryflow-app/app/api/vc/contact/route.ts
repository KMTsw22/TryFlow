import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 남의 아이디어 제출자에게 연락하는 건 Pro 전용
  const { data: viewerProfile } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", user.id)
    .maybeSingle();

  if (viewerProfile?.plan !== "pro") {
    return NextResponse.json({ error: "Pro subscription required" }, { status: 403 });
  }

  const { ideaId, subject, message } = await request.json();

  if (!ideaId) {
    return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
  }

  // 아이디어 조회 → 제출자 user_id 가져오기
  const { data: idea } = await supabase
    .from("idea_submissions")
    .select("id, category, user_id")
    .eq("id", ideaId)
    .maybeSingle();

  if (!idea?.user_id) {
    return NextResponse.json({ error: "Idea not found" }, { status: 404 });
  }

  // 제출자의 user_profiles 조회
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("contact_email, contact_phone, contact_linkedin, contact_other, allow_contact")
    .eq("id", idea.user_id)
    .maybeSingle();

  if (!profile?.allow_contact || !profile?.contact_email) {
    return NextResponse.json({ error: "This idea does not allow contact" }, { status: 400 });
  }

  // Gmail 작성 URL (이메일로 열기)
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm` +
    `&to=${encodeURIComponent(profile.contact_email)}` +
    `&su=${encodeURIComponent(subject ?? "")}` +
    `&body=${encodeURIComponent(message ?? "")}`;

  return NextResponse.json({
    gmailUrl,
    contactInfo: {
      email: profile.contact_email,
      phone: profile.contact_phone ?? null,
      linkedin: profile.contact_linkedin ?? null,
      other: profile.contact_other ?? null,
    },
  });
}
