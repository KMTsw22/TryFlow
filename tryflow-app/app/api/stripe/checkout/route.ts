import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

type PlanKey = "viewer" | "submitter" | "bundle";

function getPriceMap(): Record<PlanKey, string | undefined> {
  return {
    viewer: process.env.STRIPE_VIEWER_PRICE_ID ?? process.env.STRIPE_PRO_PRICE_ID,
    submitter: process.env.STRIPE_SUBMITTER_PRICE_ID,
    bundle: process.env.STRIPE_BUNDLE_PRICE_ID,
  };
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const rawPlan = (body.plan as string) ?? "viewer";
  // Legacy alias: 기존 코드/링크의 'pro'는 Viewer로 매핑
  const plan: PlanKey =
    rawPlan === "pro" ? "viewer" : (rawPlan as PlanKey);

  const priceId = getPriceMap()[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  // 성공 URL: viewer/bundle은 /explore로, submitter-solo는 /dashboard로
  const successPath = plan === "submitter" ? "/dashboard?subscribed=1" : "/explore?subscribed=1";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${successPath}`,
    cancel_url: `${origin}/pricing?canceled=1`,
    customer_email: user.email,
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: user.id, plan },
    },
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
