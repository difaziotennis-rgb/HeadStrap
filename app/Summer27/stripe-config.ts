"use client";

let cached: { configured: boolean; publishableKey: string | null } | null = null;

export async function getSummer27StripeConfig(): Promise<{
  configured: boolean;
  publishableKey: string | null;
}> {
  if (cached) return cached;
  try {
    const res = await fetch("/api/summer27/config");
    const data = await res.json();
    cached = {
      configured: !!data.configured,
      publishableKey: data.publishableKey || null,
    };
  } catch {
    cached = { configured: false, publishableKey: null };
  }
  return cached;
}

export function isSummer27DemoPayments(): boolean {
  return !cached?.configured;
}

/** Skip seeding fake bookings when explicitly live, or when Stripe is configured. */
export function shouldSeedSummer27Mocks(): boolean {
  if (typeof window === "undefined") return false;
  if (process.env.NEXT_PUBLIC_S27_LIVE === "1") return false;
  if (cached?.configured) return false;
  return true;
}
