import type { S27MemberSession } from "./member-session";
import { KEYS, loadList, type S27PaymentProfile } from "./storage";
import { PAYMENT_CONFIG, getVenmoHandle } from "@/lib/payment-config";
import type { S27PayMethod } from "./PayChooser";

export type { S27PayMethod };

export function getPaymentProfile(memberNumber?: string): S27PaymentProfile | null {
  if (!memberNumber || typeof window === "undefined") return null;
  const all = loadList<S27PaymentProfile>(KEYS.payment);
  return all.find((p) => p.memberNumber === memberNumber) || null;
}

export function canOneClick(session: S27MemberSession | null): S27PaymentProfile | null {
  if (!session) return null;
  const profile = getPaymentProfile(session.memberNumber);
  if (profile?.oneClick && profile.last4) return profile;
  return null;
}

export function buildPayPalUrl(amount: number): string {
  const username = (PAYMENT_CONFIG.paypalMeUsername || "").replace(/^@/, "").replace(/^paypal\.me\//i, "");
  if (username) {
    return `https://www.paypal.me/${username}/${amount.toFixed(2)}USD`;
  }
  const email = encodeURIComponent(PAYMENT_CONFIG.paypalEmail || "");
  return `https://www.paypal.com/send?amount=${amount.toFixed(2)}&currencyCode=USD&recipient=${email}`;
}

export function buildVenmoUrl(amount: number, note: string): string {
  const raw = getVenmoHandle() || PAYMENT_CONFIG.venmoHandle || "";
  const cleanHandle = raw.replace(/^@/, "").replace(/\s+/g, "").replace(/[()-]/g, "");
  const encodedNote = encodeURIComponent(note);
  const isPhone = /^\d+$/.test(cleanHandle);
  if (isPhone) {
    return `https://venmo.com/?txn=pay&recipients=${cleanHandle}&amount=${amount.toFixed(2)}&note=${encodedNote}`;
  }
  return `https://venmo.com/${cleanHandle}?txn=pay&amount=${amount.toFixed(2)}&note=${encodedNote}`;
}

export async function startStripeCheckout(opts: {
  amount: number;
  email: string;
  description: string;
  successPath: string;
  bookingId?: string;
  metadata?: Record<string, string>;
}): Promise<{ url?: string; error?: string }> {
  const res = await fetch("/api/summer27/create-checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  if (!res.ok) return { error: data.error || "Checkout failed." };
  return { url: data.url };
}

/** Start Stripe checkout, or open Venmo / PayPal. Returns how the booking should be treated. */
export async function startMemberPayment(opts: {
  method: S27PayMethod;
  amount: number;
  email: string;
  description: string;
  successPath: string;
  bookingId: string;
  metadata?: Record<string, string>;
}): Promise<
  | { kind: "saved-card" }
  | { kind: "redirect"; url: string }
  | { kind: "external"; method: "paypal" | "venmo" }
  | { kind: "error"; error: string }
> {
  if (opts.method === "saved-card") return { kind: "saved-card" };

  if (opts.method === "stripe") {
    const checkout = await startStripeCheckout(opts);
    if (checkout.url) return { kind: "redirect", url: checkout.url };
    return { kind: "error", error: checkout.error || "Could not start card checkout." };
  }

  if (opts.method === "paypal") {
    window.open(buildPayPalUrl(opts.amount), "_blank", "noopener,noreferrer");
    return { kind: "external", method: "paypal" };
  }

  window.open(buildVenmoUrl(opts.amount, opts.description), "_blank", "noopener,noreferrer");
  return { kind: "external", method: "venmo" };
}

export function storageMethodFor(method: S27PayMethod): "stripe" | "saved-card" | "manual" | "paypal" | "venmo" {
  if (method === "saved-card") return "saved-card";
  if (method === "stripe") return "stripe";
  if (method === "paypal") return "paypal";
  return "venmo";
}
