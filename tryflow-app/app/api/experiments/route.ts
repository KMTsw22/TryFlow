import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const EXPERIMENT_CREDIT_COST = 1000;
const EXPERIMENT_DURATION_DAYS = 7;

export async function GET() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("experiments")
    .select("*, waitlist_entries(count), click_events(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { productName, description, category, makerName, projectUrl, pricingTiers, features, heroTitle, heroSubtitle, ctaText, pricingMode, pricingSlider } = body;

  if (!productName) return NextResponse.json({ error: "Missing productName" }, { status: 400 });

  // 크레딧 차감 (1,000 크레딧) — 잔액 부족 시 실험실 등록 불가
  const { data: deducted, error: creditError } = await supabase.rpc("deduct_credits", {
    p_user_id: user.id,
    p_amount: EXPERIMENT_CREDIT_COST,
  });

  if (creditError) {
    return NextResponse.json({ error: "크레딧 처리 중 오류가 발생했습니다." }, { status: 500 });
  }

  if (!deducted) {
    return NextResponse.json(
      { error: `크레딧이 부족합니다. 실험실 등록에는 ${EXPERIMENT_CREDIT_COST.toLocaleString()} 크레딧이 필요합니다. 댓글을 달아 크레딧을 충전하세요.` },
      { status: 402 }
    );
  }

  // 슬러그 중복 확인 후 고유 슬러그 생성
  const baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  let slug = baseSlug;
  let attempt = 1;
  while (true) {
    const { data: existing } = await supabase
      .from("experiments")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!existing) break;
    attempt++;
    slug = `${baseSlug}-${attempt}`;
  }

  // 노출 기간: 7일
  const expiresAt = new Date(Date.now() + EXPERIMENT_DURATION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("experiments")
    .insert({
      user_id: user.id,
      slug,
      product_name: productName,
      description: description ?? "",
      status: "RUNNING",
      category: category ?? "Other",
      maker_name: makerName ?? "",
      project_url: projectUrl ?? "",
      pricing_tiers: pricingTiers ?? [],
      features: features ?? [],
      hero_title: heroTitle,
      hero_subtitle: heroSubtitle,
      cta_text: ctaText ?? "Join Waitlist",
      pricing_mode: pricingMode ?? "tiers",
      pricing_slider: pricingSlider ?? {},
      expires_at: expiresAt,
    })
    .select()
    .single();

  if (error) {
    // 실험 생성 실패 시 차감된 크레딧 환불
    await supabase.rpc("add_credits", {
      p_user_id: user.id,
      p_amount: EXPERIMENT_CREDIT_COST,
    });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
