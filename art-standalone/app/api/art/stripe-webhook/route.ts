import { NextResponse } from "next/server";
import Stripe from "stripe";

import { notifyArtSaleEmail } from "@/lib/art/notify-art-sale";

export const runtime = "nodejs";

const API_VERSION = "2026-02-25.clover" as const;

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET_ART?.trim() || process.env.STRIPE_WEBHOOK_SECRET?.trim();
  const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret || !stripeKey) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature." }, { status: 400 });
  }

  const rawBody = Buffer.from(await request.arrayBuffer());
  const stripe = new Stripe(stripeKey, { apiVersion: API_VERSION });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, secret);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.metadata?.source !== "e-difazio-art") {
      return NextResponse.json({ received: true });
    }

    const slug = session.metadata?.art_slug ?? "";
    const title = session.metadata?.art_title ?? "Unknown work";
    const amountUsd = (session.amount_total ?? 0) / 100;
    const customerEmail =
      session.customer_details?.email?.trim() || session.customer_email?.trim() || "";
    const customerName = session.customer_details?.name ?? null;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    await notifyArtSaleEmail({
      pieceTitle: title,
      pieceSlug: slug,
      amountUsd,
      customerEmail,
      customerName,
      sessionId: session.id,
      paymentIntentId,
    });
  }

  return NextResponse.json({ received: true });
}
