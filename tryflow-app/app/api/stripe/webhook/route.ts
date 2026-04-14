import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

type SubscriptionType = "viewer" | "submitter" | "bundle";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function toISO(val: number | string | null | undefined): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "number") return new Date(val * 1000).toISOString();
  return new Date(val).toISOString();
}

// price.id → subscription_type 매핑. 환경변수에서 읽어서 런타임에 구성.
function getPriceTypeMap(): Record<string, SubscriptionType> {
  const map: Record<string, SubscriptionType> = {};
  const viewer = process.env.STRIPE_VIEWER_PRICE_ID;
  const submitter = process.env.STRIPE_SUBMITTER_PRICE_ID;
  const bundle = process.env.STRIPE_BUNDLE_PRICE_ID;
  if (viewer) map[viewer] = "viewer";
  if (submitter) map[submitter] = "submitter";
  if (bundle) map[bundle] = "bundle";
  // Legacy: 기존 pro_price는 Viewer(원래 /explore 접근용)로 매핑
  const legacyPro = process.env.STRIPE_PRO_PRICE_ID;
  if (legacyPro && !map[legacyPro]) map[legacyPro] = "viewer";
  return map;
}

function resolveSubscriptionType(sub: Stripe.Subscription): SubscriptionType | null {
  const priceId = sub.items?.data?.[0]?.price?.id;
  if (!priceId) return null;
  return getPriceTypeMap()[priceId] ?? null;
}

// user_profiles.viewer_plan / submitter_plan 캐시를 현재 active 구독 기준으로 재계산
async function syncUserProfilePlans(
  supabase: ReturnType<typeof getServiceClient>,
  userId: string
) {
  const { data: rows, error } = await supabase
    .from("subscriptions")
    .select("subscription_type, status")
    .eq("user_id", userId);

  if (error) {
    console.error("[webhook] failed to load user subscriptions:", error);
    return;
  }

  const activeTypes = new Set(
    (rows ?? [])
      .filter((r) => r.status === "active" || r.status === "trialing")
      .map((r) => r.subscription_type as SubscriptionType)
  );

  const viewerPro = activeTypes.has("viewer") || activeTypes.has("bundle");
  const submitterPro = activeTypes.has("submitter") || activeTypes.has("bundle");

  const { error: updErr } = await supabase
    .from("user_profiles")
    .update({
      viewer_plan: viewerPro ? "pro" : "free",
      submitter_plan: submitterPro ? "pro" : "free",
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (updErr) console.error("[webhook] user_profiles sync error:", updErr);
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[webhook] signature error:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[webhook] received:", event.type);
  const supabase = getServiceClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode !== "subscription") break;

        const userId = session.metadata?.user_id;
        const subscriptionId = session.subscription as string;

        if (!userId || !subscriptionId) {
          console.error("[webhook] missing userId or subscriptionId");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const subscriptionType = resolveSubscriptionType(sub);
        if (!subscriptionType) {
          console.error("[webhook] unknown price.id, cannot resolve subscription_type");
          break;
        }

        // period fallback: 신버전 API에서 위치가 바뀔 수 있어 item 레벨도 fallback
        const subAny = sub as unknown as {
          current_period_start?: number;
          current_period_end?: number;
          items?: { data?: { current_period_start?: number; current_period_end?: number }[] };
        };
        const item = subAny.items?.data?.[0];
        const periodStart =
          subAny.current_period_start ??
          item?.current_period_start ??
          Math.floor(Date.now() / 1000);
        const periodEnd =
          subAny.current_period_end ??
          item?.current_period_end ??
          Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;

        const record = {
          id: subscriptionId,
          user_id: userId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: subscriptionId,
          subscription_type: subscriptionType,
          plan: subscriptionType,
          status: sub.status === "trialing" ? "active" : sub.status,
          current_period_start: toISO(periodStart),
          current_period_end: toISO(periodEnd),
        };

        const { error } = await supabase.from("subscriptions").upsert(record);
        if (error) {
          console.error("[webhook] upsert error:", error);
          break;
        }

        await syncUserProfilePlans(supabase, userId);
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as unknown as { subscription?: string };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const subAny = sub as unknown as {
          current_period_start?: number;
          current_period_end?: number;
        };

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: toISO(subAny.current_period_start),
            current_period_end: toISO(subAny.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        if (error) console.error("[webhook] invoice.paid update error:", error);

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        if (row?.user_id) await syncUserProfilePlans(supabase, row.user_id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as unknown as { subscription?: string };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscriptionId)
          .maybeSingle();
        if (row?.user_id) await syncUserProfilePlans(supabase, row.user_id);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const subAny = sub as unknown as {
          current_period_start?: number;
          current_period_end?: number;
        };

        const subscriptionType = resolveSubscriptionType(sub);

        const updatePayload: Record<string, unknown> = {
          status: sub.status === "trialing" ? "active" : sub.status,
          current_period_start: toISO(subAny.current_period_start),
          current_period_end: toISO(subAny.current_period_end),
          updated_at: new Date().toISOString(),
        };
        if (subscriptionType) {
          updatePayload.subscription_type = subscriptionType;
          updatePayload.plan = subscriptionType;
        }

        await supabase
          .from("subscriptions")
          .update(updatePayload)
          .eq("stripe_subscription_id", sub.id);

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();
        if (row?.user_id) await syncUserProfilePlans(supabase, row.user_id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);

        const { data: row } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", sub.id)
          .maybeSingle();
        if (row?.user_id) await syncUserProfilePlans(supabase, row.user_id);
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
