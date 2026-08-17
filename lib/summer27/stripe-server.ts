import Stripe from "stripe";

export function stripeSecretKey(): string | null {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  return key || null;
}

export function stripePublishableKey(): string | null {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim();
  return key || null;
}

export function isStripeConfigured(): boolean {
  return !!(stripeSecretKey() && stripePublishableKey());
}

/** Live Stripe keys — not test. Used to decide when the club is actually open for real money/mail. */
export function isStripeLive(): boolean {
  return (stripeSecretKey() || "").startsWith("sk_live_");
}

/**
 * Member email only goes out after we go live.
 * Override with S27_SEND_EMAIL=1 (force on) or S27_SEND_EMAIL=0 (force off).
 */
export function canSendS27MemberEmail(): boolean {
  const flag = process.env.S27_SEND_EMAIL?.trim().toLowerCase();
  if (flag === "0" || flag === "false" || flag === "off") return false;
  if (flag === "1" || flag === "true" || flag === "on") return true;
  return isStripeLive();
}

export function getStripe(): Stripe {
  const key = stripeSecretKey();
  if (!key) throw new Error("Stripe is not configured.");
  return new Stripe(key, { apiVersion: "2025-12-15.clover" });
}

export function summer27BaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000").replace(/\/$/, "");
}

export function brandFromStripe(brand?: string | null): "Visa" | "Mastercard" | "Amex" {
  const b = (brand || "").toLowerCase();
  if (b === "amex" || b === "american_express") return "Amex";
  if (b === "mastercard") return "Mastercard";
  return "Visa";
}
