import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { error } = await supabase
    .from("experiments")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Status-only update (pause / resume / end)
  if (body.status !== undefined && Object.keys(body).length === 1) {
    const { data, error } = await supabase
      .from("experiments")
      .update({ status: body.status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // Full field update
  const { productName, description, category, makerName, projectUrl, heroTitle, heroSubtitle, ctaText, pricingTiers } = body;

  const { data, error } = await supabase
    .from("experiments")
    .update({
      product_name:  productName,
      description:   description ?? "",
      category:      category ?? "Other",
      maker_name:    makerName ?? "",
      project_url:   projectUrl ?? "",
      hero_title:    heroTitle ?? null,
      hero_subtitle: heroSubtitle ?? null,
      cta_text:      ctaText ?? "Join Waitlist",
      ...(pricingTiers !== undefined && { pricing_tiers: pricingTiers }),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
