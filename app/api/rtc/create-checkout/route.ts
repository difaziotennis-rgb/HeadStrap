import { NextResponse } from "next/server";
import Stripe from "stripe";

type CheckoutBody = {
  amount?: number;
  clientEmail?: string;
  description?: string;
  bookingId?: string;
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
    const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });

    const bookingIdParam = body.bookingId
      ? `&bookingId=${encodeURIComponent(body.bookingId)}`
      : "";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Rhinebeck Tennis Club Court Booking",
              description: body.description || "Court booking payment",
            },
            unit_amount: Math.round(amount * 100),
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${baseUrl}/RTC/book?payment=success${bookingIdParam}`,
      cancel_url: `${baseUrl}/RTC/book?payment=cancelled${bookingIdParam}`,
      customer_email: body.clientEmail || undefined,
      metadata: body.metadata || {},
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
