import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  try {
    const { name, email, phone } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create a Stripe Customer
    const customer = await stripe.customers.create({
      name,
      email,
      phone: phone || undefined,
      metadata: {
        source: "difazio-tennis-member-signup",
      },
    });

    // Create a Checkout Session in "setup" mode — saves card without charging
    const session = await stripe.checkout.sessions.create({
      mode: "setup",
      customer: customer.id,
      payment_method_types: ["card"],
      success_url: `${baseUrl}/api/member-callback?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/become-a-member?cancelled=true`,
      metadata: {
        customerName: name,
        customerEmail: email,
        customerPhone: phone || "",
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error: any) {
    console.error("Error creating member:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create member" },
      { status: 500 }
    );
  }
}
