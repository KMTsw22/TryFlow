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

function successPathFor(plan: PlanKey, tag: string): string {
  // Plus는 내 아이디어 관리가 메인, Pro는 탐색이 메인
  return plan === "plus" ? `/dashboard?${tag}=1` : `/explore?${tag}=1`;
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

  // ── 기존 active 구독이 있으면 신규 생성 대신 in-place update (proration) ─────
  //    같은 subscription item을 새 price로 swap → Stripe가 남은 기간 차액만 자동 청구.
  //    빌링 앵커(다음 결제일)는 변하지 않고, 이전 plan은 자동 해제된다.
  const { data: existing } = await supabase
    .from("subscriptions")
    .select("stripe_subscription_id, subscription_type, status")
    .eq("user_id", user.id)
    .in("status", ["active", "trialing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing?.stripe_subscription_id) {
    if (existing.subscription_type === plan) {
      return NextResponse.json(
        { error: "You are already subscribed to this plan." },
        { status: 400 }
      );
    }

    try {
      const sub = await stripe.subscriptions.retrieve(existing.stripe_subscription_id);
      const itemId = sub.items?.data?.[0]?.id;
      if (!itemId) {
        return NextResponse.json({ error: "Existing subscription is malformed" }, { status: 500 });
      }

      // always_invoice: 즉시 prorate된 차액을 invoice로 발행하고 저장된 카드에서 청구.
      // 예: Plus 결제 다음날 Pro 업그레이드 → (Pro $20 − Plus $10) × 남은기간/30일 만큼만 청구.
      await stripe.subscriptions.update(existing.stripe_subscription_id, {
        items: [{ id: itemId, price: priceId }],
        proration_behavior: "always_invoice",
        metadata: { user_id: user.id, plan },
      });

      return NextResponse.json({
        url: `${origin}${successPathFor(plan, "upgraded")}`,
      });
    } catch (err) {
      console.error("[checkout] subscription update failed:", err);
      return NextResponse.json(
        { error: "Failed to change plan. Please try again." },
        { status: 500 }
      );
    }
  }

  // ── 신규 구독자 → Stripe Checkout 세션 ─────────────────────────────────────
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}${successPathFor(plan, "subscribed")}`,
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
