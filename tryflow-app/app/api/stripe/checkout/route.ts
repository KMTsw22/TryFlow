import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { stripe } from "@/lib/stripe";

const PRICE_MAP: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const plan = (body.plan as string) ?? "pro";
  const priceId = PRICE_MAP[plan];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/explore?subscribed=1`,
    cancel_url: `${origin}/pricing?canceled=1`,
    customer_email: user.email,
    subscription_data: {
      trial_period_days: 7,
      metadata: { user_id: user.id },
    },
    metadata: { user_id: user.id, plan },
  });

  return NextResponse.json({ url: session.url });
}
