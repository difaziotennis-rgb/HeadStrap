import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/summer27/stripe-server";

type Body = {
  amount?: number;
  email?: string;
  description?: string;
  bookingId?: string;
  customerId?: string;
  paymentMethodId?: string;
  metadata?: Record<string, string>;
};

/** Charge immediately (capture right away) using a saved PaymentMethod. */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }
    const body = (await request.json()) as Body;
    const amount = Number(body.amount || 0);
    const customerId = String(body.customerId || "").trim();
    const paymentMethodId = String(body.paymentMethodId || "").trim();
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }
    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "Saved card is required." }, { status: 400 });
    }

    const stripe = getStripe();
    const intent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: customerId,
      payment_method: paymentMethodId,
      off_session: true,
      confirm: true,
      description: body.description || "DiFazio Tennis Summer ’27",
      receipt_email: body.email || undefined,
      metadata: {
        source: "summer27",
        bookingId: String(body.bookingId || ""),
        capture: "immediate",
        ...(body.metadata || {}),
      },
    });

    if (intent.status !== "succeeded") {
      return NextResponse.json(
        { error: `Payment status: ${intent.status}. Try another card.` },
        { status: 402 }
      );
    }

    return NextResponse.json({
      paymentIntentId: intent.id,
      status: intent.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Charge failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
