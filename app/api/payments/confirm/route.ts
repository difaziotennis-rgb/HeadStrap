import { NextResponse } from "next/server";
import Stripe from "stripe";

type Body = {
  paymentIntentId?: string;
  paymentMethodId?: string;
};

export async function POST(req: Request) {
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY?.trim();
    if (!stripeKey) {
      return NextResponse.json({ error: "Stripe is not configured." }, { status: 500 });
    }

    const body = (await req.json()) as Body;
    const paymentIntentId = String(body.paymentIntentId || "").trim();
    const paymentMethodId = String(body.paymentMethodId || "").trim();

    if (!paymentIntentId) {
      return NextResponse.json({ error: "paymentIntentId is required." }, { status: 400 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-12-15.clover" });
    const paymentIntent = paymentMethodId
      ? await stripe.paymentIntents.confirm(paymentIntentId, { payment_method: paymentMethodId })
      : await stripe.paymentIntents.retrieve(paymentIntentId);

    return NextResponse.json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to confirm payment.", details: String(error) },
      { status: 500 }
    );
  }
}

