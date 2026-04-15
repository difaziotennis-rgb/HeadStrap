import { NextResponse } from "next/server";
import Stripe from "stripe";

type Body = {
  bookingId?: string;
  amount?: number;
  currency?: string;
};

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const body = (await req.json()) as Body;
    const bookingId = String(body.bookingId || "").trim();
    const amount = Number(body.amount || 0);
    const currency = String(body.currency || "usd").toLowerCase();

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required." }, { status: 400 });
    }
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ error: "amount must be a positive number." }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-12-15.clover" });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        bookingId,
        source: "difazio-booking",
      },
    });

    return NextResponse.json({
      id: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create payment intent.", details: String(error) },
      { status: 500 }
    );
  }
}

