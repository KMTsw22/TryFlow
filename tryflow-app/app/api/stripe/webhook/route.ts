import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Use service-role client so we can write to subscriptions table bypassing RLS
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = session.metadata?.user_id;
      const plan = session.metadata?.plan ?? "pro";
      const subscriptionId = session.subscription as string;

      if (!userId || !subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase.from("subscriptions").upsert({
        id: subscriptionId,
        user_id: userId,
        stripe_customer_id: sub.customer as string,
        stripe_subscription_id: subscriptionId,
        plan,
        status: sub.status === "trialing" ? "active" : sub.status,
        current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
        current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
      });

      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string;
      if (!subscriptionId) break;

      const sub = await stripe.subscriptions.retrieve(subscriptionId);

      await supabase
        .from("subscriptions")
        .update({
          status: "active",
          current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", subscriptionId);

      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = (invoice as any).subscription as string;
      if (!subscriptionId) break;

      await supabase
        .from("subscriptions")
        .update({ status: "past_due", updated_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscriptionId);

      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;

      await supabase
        .from("subscriptions")
        .update({
          status: sub.status === "trialing" ? "active" : sub.status,
          current_period_start: new Date((sub as any).current_period_start * 1000).toISOString(),
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
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

  return NextResponse.json({ received: true });
}
