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
