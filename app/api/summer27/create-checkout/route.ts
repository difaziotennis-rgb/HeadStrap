import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured, summer27BaseUrl, canSendS27MemberEmail } from "@/lib/summer27/stripe-server";

type CheckoutBody = {
  amount?: number;
  email?: string;
  name?: string;
  description?: string;
  bookingId?: string;
  successPath?: string;
  cancelPath?: string;
  metadata?: Record<string, string>;
};

/**
 * Guest (and optional member) one-time payment via Stripe Checkout.
 * Money is captured immediately on successful payment.
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }

    const body = (await request.json()) as CheckoutBody;
    const amount = Number(body.amount || 0);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    const baseUrl = summer27BaseUrl();
    const successPath = body.successPath || "/Summer27";
    const cancelPath = body.cancelPath || successPath;
    const bookingIdParam = body.bookingId ? `&bookingId=${encodeURIComponent(body.bookingId)}` : "";
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "link"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: body.description || "DiFazio Tennis Summer ’27",
              description: "Summer 2027 booking",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}${successPath}?payment=success${bookingIdParam}`,
      cancel_url: `${baseUrl}${cancelPath}?payment=cancelled${bookingIdParam}`,
      customer_email: body.email || undefined,
      metadata: {
        source: "summer27",
        bookingId: String(body.bookingId || ""),
        capture: "immediate",
        guestName: String(body.name || ""),
        ...(body.metadata || {}),
      },
      payment_intent_data: {
        ...(canSendS27MemberEmail() && body.email ? { receipt_email: body.email } : {}),
        metadata: {
          source: "summer27",
          bookingId: String(body.bookingId || ""),
          capture: "immediate",
          ...(body.metadata || {}),
        },
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
