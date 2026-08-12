import { NextResponse } from "next/server";
import Stripe from "stripe";

type CheckoutBody = {
  amount?: number;
  email?: string;
  description?: string;
  bookingId?: string;
  successPath?: string;
  metadata?: Record<string, string>;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CheckoutBody;
    const amount = Number(body.amount || 0);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid payment amount." }, { status: 400 });
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const successPath = body.successPath || "/Summer27/member/portal";
    const bookingIdParam = body.bookingId ? `&bookingId=${encodeURIComponent(body.bookingId)}` : "";
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

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
      cancel_url: `${baseUrl}${successPath}?payment=cancelled${bookingIdParam}`,
      customer_email: body.email || undefined,
      metadata: { source: "summer27", ...(body.metadata || {}) },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create checkout session.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
