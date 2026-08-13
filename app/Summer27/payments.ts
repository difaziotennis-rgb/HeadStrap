import type { S27MemberSession } from "./member-session";
import { KEYS, loadList, type S27PaymentProfile } from "./storage";
import type { S27PayMethod } from "./PayChooser";
import { getSummer27StripeConfig } from "./stripe-config";

export type { S27PayMethod };

export function getPaymentProfile(memberNumber?: string): S27PaymentProfile | null {
  if (!memberNumber || typeof window === "undefined") return null;
  const all = loadList<S27PaymentProfile>(KEYS.payment);
  return all.find((p) => p.memberNumber === memberNumber) || null;
}

/** Card on file is required for member one-click. */
export function canOneClick(session: S27MemberSession | null): S27PaymentProfile | null {
  if (!session) return null;
  const profile = getPaymentProfile(session.memberNumber);
  if (profile?.last4) return profile;
  return null;
}

export async function startStripeCheckout(opts: {
  amount: number;
  email: string;
  name?: string;
  description: string;
  successPath: string;
  cancelPath?: string;
  bookingId?: string;
  metadata?: Record<string, string>;
}): Promise<{ url?: string; error?: string }> {
  const cfg = await getSummer27StripeConfig();
  if (!cfg.configured) {
    return { error: "Stripe isn’t configured yet. Add keys in Vercel to take live payments." };
  }
  const res = await fetch("/api/summer27/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Checkout failed." };
  return { url: data.url };
}

/**
 * Charge immediately on the member’s saved card when Stripe is live.
 * In demo mode (no keys), accepts saved-card and records as paid locally.
 */
export async function startMemberPayment(opts: {
  method: S27PayMethod;
  amount: number;
  email: string;
  description: string;
  successPath: string;
  bookingId: string;
  metadata?: Record<string, string>;
  paymentProfile?: S27PaymentProfile | null;
}): Promise<
  | { kind: "saved-card"; paymentIntentId?: string }
  | { kind: "checkout"; url: string }
  | { kind: "error"; error: string }
> {
  if (opts.method === "checkout") {
    const checkout = await startStripeCheckout({
      amount: opts.amount,
      email: opts.email,
      description: opts.description,
      successPath: opts.successPath,
      bookingId: opts.bookingId,
      metadata: opts.metadata,
    });
    if (checkout.error || !checkout.url) return { kind: "error", error: checkout.error || "Checkout failed." };
    return { kind: "checkout", url: checkout.url };
  }

  if (opts.method !== "saved-card") {
    return { kind: "error", error: "Choose a payment method." };
  }

  const cfg = await getSummer27StripeConfig();
  const profile = opts.paymentProfile;

  if (!cfg.configured) {
    // Demo / pre-Stripe: local card-on-file only.
    if (!profile?.last4) return { kind: "error", error: "Card on file is required." };
    return { kind: "saved-card" };
  }

  if (!profile?.stripeCustomerId || !profile?.stripePaymentMethodId) {
    return {
      kind: "error",
      error: "Add a real card on file in My Account (Stripe) before booking.",
    };
  }

  const res = await fetch("/api/summer27/charge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: opts.amount,
      email: opts.email,
      description: opts.description,
      bookingId: opts.bookingId,
      customerId: profile.stripeCustomerId,
      paymentMethodId: profile.stripePaymentMethodId,
      metadata: opts.metadata,
    }),
  });
  const data = await res.json();
  if (!res.ok) return { kind: "error", error: data.error || "Charge failed." };
  return { kind: "saved-card", paymentIntentId: data.paymentIntentId };
}

export async function startGuestCheckout(opts: {
  amount: number;
  email: string;
  name: string;
  description: string;
  successPath: string;
  bookingId: string;
  metadata?: Record<string, string>;
}): Promise<{ kind: "checkout"; url: string } | { kind: "demo-paid" } | { kind: "error"; error: string }> {
  const cfg = await getSummer27StripeConfig();
  if (!cfg.configured) {
    // Pre-Stripe preview: allow guest “pay” so flows can be tested.
    return { kind: "demo-paid" };
  }
  const checkout = await startStripeCheckout(opts);
  if (checkout.error || !checkout.url) return { kind: "error", error: checkout.error || "Checkout failed." };
  return { kind: "checkout", url: checkout.url };
}

export async function refundStripePayment(opts: {
  paymentIntentId: string;
  amount?: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const cfg = await getSummer27StripeConfig();
  if (!cfg.configured) return { ok: true }; // demo: nothing to refund
  const res = await fetch("/api/summer27/refund", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) return { ok: false, error: data.error || "Refund failed." };
  return { ok: true };
}

export function storageMethodFor(method: S27PayMethod): "saved-card" | "stripe" {
  return method === "checkout" ? "stripe" : "saved-card";
}
