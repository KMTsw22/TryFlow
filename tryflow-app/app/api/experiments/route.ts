import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const { productName, description, category, makerName, projectUrl, pricingTiers, features, heroTitle, heroSubtitle, ctaText } = body;

  if (!productName) return NextResponse.json({ error: "Missing productName" }, { status: 400 });

  const baseSlug = productName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Find a unique slug: try base, then base-2, base-3, ...
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
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
