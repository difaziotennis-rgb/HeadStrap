import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/summer27/stripe-server";

type Body = {
  paymentIntentId?: string;
  amount?: number;
  reason?: "duplicate" | "fraudulent" | "requested_by_customer";
};

/** Refund a charge (full or partial) — used when a paid booking is cancelled. */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }
    const body = (await request.json()) as Body;
    const paymentIntentId = String(body.paymentIntentId || "").trim();
    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId is required." }, { status: 400 });
    }

    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: body.amount ? Math.round(Number(body.amount) * 100) : undefined,
      reason: body.reason || "requested_by_customer",
    });

    return NextResponse.json({ refundId: refund.id, status: refund.status });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Refund failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
