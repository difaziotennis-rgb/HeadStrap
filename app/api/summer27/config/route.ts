import { NextResponse } from "next/server";
import { isStripeConfigured, stripePublishableKey } from "@/lib/summer27/stripe-server";

/** Public config so the client knows whether live payments are available. */
export async function GET() {
  const configured = isStripeConfigured();
  return NextResponse.json({
    configured,
    publishableKey: configured ? stripePublishableKey() : null,
    mode: "charge_immediately",
  });
}
