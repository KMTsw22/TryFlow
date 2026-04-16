import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

type PlanKey = "plus" | "pro";

function getPriceMap(): Record<PlanKey, string | undefined> {
  return {
    plus: process.env.STRIPE_PLUS_PRICE_ID,
    pro: process.env.STRIPE_PRO_PRICE_ID,
  };
}

function normalizePlan(raw: string): PlanKey | null {
  if (raw === "plus") return "plus";
  if (raw === "pro") return "pro";
  return null;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = normalizePlan((body.plan as string) ?? "");
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const priceId = getPriceMap()[plan];
  if (!priceId) {
    return NextResponse.json({ error: "Price not configured" }, { status: 400 });
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  // Plus는 내 아이디어 관리가 메인 → /dashboard, Pro는 탐색이 메인 → /explore
  const successPath = plan === "plus" ? "/dashboard?subscribed=1" : "/explore?subscribed=1";

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
