import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/vc/contact
 *
 * VC → Founder 아이디어 intro 요청.
 *
 * 2026-04 업데이트:
 *   - 기존엔 Gmail compose URL 만 반환하고 트래킹 없었음
 *   - 지금은 contact_requests 에 INSERT 후 URL 반환 → founder 가 /inbox 에서 확인
 *   - Pro 전용 (middleware + API 이중 체크)
 *   - Subject/message 는 검증 + 저장
 */
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

  const body = await request.json();
  const ideaId = typeof body.ideaId === "string" ? body.ideaId : null;
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!ideaId) {
    return NextResponse.json({ error: "Missing ideaId" }, { status: 400 });
  }
  if (subject.length < 3 || subject.length > 160) {
    return NextResponse.json(
      { error: "Subject must be 3–160 characters." },
      { status: 400 }
    );
  }
  if (message.length < 20 || message.length > 4000) {
    return NextResponse.json(
      { error: "Message must be 20–4000 characters." },
      { status: 400 }
    );
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

  // 본인 아이디어 자기가 연락은 막음
  if (idea.user_id === user.id) {
    return NextResponse.json(
      { error: "Cannot contact yourself on your own idea." },
      { status: 400 }
    );
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

  // contact_requests 에 트래킹 INSERT — founder 의 /inbox 에 뜨도록
  const { data: inserted, error: insertErr } = await supabase
    .from("contact_requests")
    .insert({
      vc_user_id: user.id,
      founder_user_id: idea.user_id,
      submission_id: ideaId,
      subject,
      message,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("contact_requests insert failed:", insertErr);
    // INSERT 실패해도 Gmail URL 은 반환해서 VC가 최소한 수동 발송은 가능하게
  }

  // Gmail 작성 URL (이메일로 열기)
  const gmailUrl =
    `https://mail.google.com/mail/?view=cm` +
    `&to=${encodeURIComponent(profile.contact_email)}` +
    `&su=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(message)}`;

  return NextResponse.json({
    gmailUrl,
    contactRequestId: inserted?.id ?? null,
    contactInfo: {
      email: profile.contact_email,
      phone: profile.contact_phone ?? null,
      linkedin: profile.contact_linkedin ?? null,
      other: profile.contact_other ?? null,
    },
  });
}
