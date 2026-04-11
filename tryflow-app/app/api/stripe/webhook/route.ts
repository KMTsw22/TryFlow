import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// Stripe API 버전에 따라 timestamp가 number(unix) 또는 string(ISO) 둘 다 올 수 있음
function toISO(val: number | string | null | undefined): string {
  if (!val) return new Date().toISOString();
  if (typeof val === "number") return new Date(val * 1000).toISOString();
  return new Date(val).toISOString();
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
        const plan = session.metadata?.plan ?? "pro";
        const subscriptionId = session.subscription as string;

        console.log("[webhook] checkout completed — userId:", userId, "subId:", subscriptionId);

        if (!userId || !subscriptionId) {
          console.error("[webhook] missing userId or subscriptionId");
          break;
        }

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
        const subAny = sub as any;

        // current_period_start/end: 신버전 API에서 위치가 바뀔 수 있어 item 레벨도 fallback
        const item = subAny.items?.data?.[0] as any;
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
          plan,
          status: sub.status === "trialing" ? "active" : sub.status,
          current_period_start: toISO(periodStart),
          current_period_end: toISO(periodEnd),
        };

        console.log("[webhook] upserting record:", record);
        const { error } = await supabase.from("subscriptions").upsert(record);
        if (error) console.error("[webhook] upsert error:", error);
        else console.log("[webhook] upsert OK");

        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        const sub = await stripe.subscriptions.retrieve(subscriptionId) as any;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "active",
            current_period_start: toISO(sub.current_period_start),
            current_period_end: toISO(sub.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        if (error) console.error("[webhook] invoice.paid update error:", error);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        const subscriptionId = invoice.subscription as string;
        if (!subscriptionId) break;

        await supabase
          .from("subscriptions")
          .update({ status: "past_due", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", subscriptionId);
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        await supabase
          .from("subscriptions")
          .update({
            status: sub.status === "trialing" ? "active" : sub.status,
            current_period_start: toISO(sub.current_period_start),
            current_period_end: toISO(sub.current_period_end),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({ status: "canceled", updated_at: new Date().toISOString() })
          .eq("stripe_subscription_id", sub.id);
        break;
      }
    }
  } catch (err) {
    console.error("[webhook] handler error:", err);
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
