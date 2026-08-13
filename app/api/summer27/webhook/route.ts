import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured, stripeSecretKey } from "@/lib/summer27/stripe-server";

export const runtime = "nodejs";

/**
 * Stripe webhook — ready for when live keys + endpoint secret are set.
 * Records successful payments; when Supabase is configured, upserts booking paid status.
 */
export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe is not configured." }, { status: 503 });
  }

  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } else {
      // Allow local testing without signature when secret is unset.
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      await markPaid({
        bookingId: session.metadata?.bookingId,
        paymentIntentId:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id,
        email: session.customer_email || session.customer_details?.email || undefined,
        amount: session.amount_total ? session.amount_total / 100 : undefined,
        source: "checkout",
      });
    }

    if (event.type === "payment_intent.succeeded") {
      const intent = event.data.object as Stripe.PaymentIntent;
      await markPaid({
        bookingId: intent.metadata?.bookingId,
        paymentIntentId: intent.id,
        email: intent.receipt_email || undefined,
        amount: intent.amount_received ? intent.amount_received / 100 : undefined,
        source: "payment_intent",
      });
    }
  } catch (err: unknown) {
    console.error("[summer27 webhook]", err);
    // Still 200 so Stripe doesn't hammer retries on app bugs; log for ops.
  }

  return NextResponse.json({ received: true, hasSecret: !!webhookSecret, keyHint: stripeSecretKey()?.slice(0, 8) });
}

async function markPaid(opts: {
  bookingId?: string;
  paymentIntentId?: string;
  email?: string;
  amount?: number;
  source: string;
}) {
  const bookingId = String(opts.bookingId || "").trim();
  if (!bookingId) return;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !serviceKey) {
    console.info("[summer27 webhook] paid (no DB yet)", opts);
    return;
  }

  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });
  await supabase.from("s27_payments").upsert(
    {
      booking_id: bookingId,
      payment_intent_id: opts.paymentIntentId || null,
      email: opts.email || null,
      amount: opts.amount ?? null,
      status: "paid",
      source: opts.source,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "booking_id" }
  );
}
