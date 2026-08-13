import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/summer27/stripe-server";

type Body = {
  email?: string;
  memberNumber?: string;
  name?: string;
  customerId?: string;
};

/**
 * Create (or reuse) a Stripe Customer and a SetupIntent so the member can save a card.
 * Charge happens later via /api/summer27/charge (immediate capture).
 */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }
    const body = (await request.json()) as Body;
    const email = String(body.email || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Email is required." }, { status: 400 });

    const stripe = getStripe();
    let customerId = String(body.customerId || "").trim();

    if (!customerId) {
      const existing = await stripe.customers.list({ email, limit: 1 });
      if (existing.data[0]) {
        customerId = existing.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email,
          name: body.name || undefined,
          metadata: {
            source: "summer27",
            memberNumber: String(body.memberNumber || ""),
          },
        });
        customerId = customer.id;
      }
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        source: "summer27",
        memberNumber: String(body.memberNumber || ""),
      },
    });

    return NextResponse.json({
      customerId,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to start card setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
