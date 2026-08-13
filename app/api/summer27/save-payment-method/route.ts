import { NextResponse } from "next/server";
import { brandFromStripe, getStripe, isStripeConfigured } from "@/lib/summer27/stripe-server";

type Body = {
  customerId?: string;
  paymentMethodId?: string;
};

/** Attach a PaymentMethod from SetupIntent and set it as the customer's default. */
export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json({ error: "Stripe is not configured yet." }, { status: 503 });
    }
    const body = (await request.json()) as Body;
    const customerId = String(body.customerId || "").trim();
    const paymentMethodId = String(body.paymentMethodId || "").trim();
    if (!customerId || !paymentMethodId) {
      return NextResponse.json({ error: "Customer and payment method are required." }, { status: 400 });
    }

    const stripe = getStripe();
    const pm = await stripe.paymentMethods.attach(paymentMethodId, { customer: customerId });
    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    const card = pm.card;
    return NextResponse.json({
      customerId,
      paymentMethodId: pm.id,
      brand: brandFromStripe(card?.brand),
      last4: card?.last4 || "",
      expMonth: String(card?.exp_month || ""),
      expYear: String(card?.exp_year || ""),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to save card.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
