import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
    })
  : null;

export async function POST(request: Request) {
  try {
    const { bookingId, amount, date, hour, clientName, clientEmail } = await request.json();

    console.log("📝 Creating Stripe checkout session:", { bookingId, amount, date, hour });

    if (!stripe) {
      console.error("❌ Stripe not configured - missing STRIPE_SECRET_KEY");
      return NextResponse.json(
        { error: "Stripe is not configured. Please add STRIPE_SECRET_KEY to your environment variables." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const successUrl = `${baseUrl}/booking-success?id=${bookingId}&payment=success`;
    const cancelUrl = `${baseUrl}/book?payment=cancelled`;

    console.log("🔗 URLs:", { successUrl, cancelUrl });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Tennis Lesson",
              description: `Private lesson on ${date} at ${hour}:00`,
            },
            unit_amount: amount * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: clientEmail || undefined,
      metadata: {
        bookingId,
        date,
        hour: hour.toString(),
        clientName,
      },
    });

    console.log("✅ Stripe session created:", { sessionId: session.id, url: session.url });

    // Return both sessionId and url for flexibility
    return NextResponse.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error("❌ Error creating Stripe checkout session:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create checkout session" },
      { status: 500 }
    );
  }
}

