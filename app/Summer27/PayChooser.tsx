"use client";

import Link from "next/link";
import type { S27PaymentProfile } from "./storage";

export type S27PayMethod = "saved-card" | "checkout";

export function PayChooser({
  amount,
  savedCard,
  paying,
  disabled,
  onPay,
  primaryLabel,
  allowGuestCheckout,
  stripeReady,
}: {
  amount: number;
  savedCard?: S27PaymentProfile | null;
  paying?: boolean;
  disabled?: boolean;
  onPay: (method: S27PayMethod) => void | Promise<void>;
  /** Action verb only — amount is shown once above the methods. */
  primaryLabel?: string;
  /** Show Stripe Checkout for guests / no card */
  allowGuestCheckout?: boolean;
  /** When false, guest checkout label notes demo mode */
  stripeReady?: boolean;
}) {
  const action = primaryLabel || "Pay";
  const busy = disabled || paying;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Total</p>
        <p className="text-[20px] font-semibold tracking-tight tabular-nums text-[#1a1a1a]">${amount}</p>
      </div>

      {savedCard ? (
        <>
          <p className="text-[12px] leading-relaxed text-[#6b665e]">
            Charges {savedCard.brand} •••• {savedCard.last4} now.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onPay("saved-card")}
            className="w-full rounded-2xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {paying ? "Charging…" : `${action} · ${savedCard.brand} •••• ${savedCard.last4}`}
          </button>
        </>
      ) : allowGuestCheckout ? (
        <>
          <p className="text-[12px] leading-relaxed text-[#6b665e]">
            {stripeReady
              ? "Pay securely by card — no membership required."
              : "Stripe isn’t live yet — this will record a demo payment so you can test the flow."}
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => onPay("checkout")}
            className="w-full rounded-2xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40"
          >
            {paying ? "Starting…" : stripeReady ? `${action} with card` : `${action} (demo)`}
          </button>
          <p className="text-center text-[11px] text-[#8a8477]">
            Members can{" "}
            <Link href="/Summer27/member" className="text-[#1a1a1a] underline-offset-2 hover:underline">
              join / sign in
            </Link>{" "}
            to save a card.
          </p>
        </>
      ) : (
        <div className="rounded-2xl border border-[#ead9c2] bg-[#fbf6ee] px-4 py-3.5">
          <p className="text-[13px] leading-relaxed text-[#6b665e]">
            A card on file is required. Add one in My Account, then come back to pay.
          </p>
          <Link
            href="/Summer27/member/portal?tab=card"
            className="mt-3 inline-block text-[13px] font-medium text-[#1a1a1a] underline-offset-2 hover:underline"
          >
            Add card on file
          </Link>
        </div>
      )}
    </div>
  );
}
