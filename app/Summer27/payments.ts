import type { S27MemberSession } from "./member-session";
import { KEYS, loadList, type S27PaymentProfile } from "./storage";
import type { S27PayMethod } from "./PayChooser";

export type { S27PayMethod };

export function getPaymentProfile(memberNumber?: string): S27PaymentProfile | null {
  if (!memberNumber || typeof window === "undefined") return null;
  const all = loadList<S27PaymentProfile>(KEYS.payment);
  return all.find((p) => p.memberNumber === memberNumber) || null;
}

/** Card on file is the only payment path — any saved card with last4 qualifies. */
export function canOneClick(session: S27MemberSession | null): S27PaymentProfile | null {
  if (!session) return null;
  const profile = getPaymentProfile(session.memberNumber);
  if (profile?.last4) return profile;
  return null;
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

/** Charge the member’s card on file. Other methods are no longer offered. */
export async function startMemberPayment(opts: {
  method: S27PayMethod;
  amount: number;
  email: string;
  description: string;
  successPath: string;
  bookingId: string;
  metadata?: Record<string, string>;
}): Promise<{ kind: "saved-card" } | { kind: "error"; error: string }> {
  if (opts.method === "saved-card") return { kind: "saved-card" };
  return { kind: "error", error: "Card on file is required." };
}

export function storageMethodFor(_method: S27PayMethod): "saved-card" {
  return "saved-card";
}
