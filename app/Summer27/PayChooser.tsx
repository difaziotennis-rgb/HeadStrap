"use client";

import type { S27PaymentProfile } from "./storage";

export type S27PayMethod = "saved-card" | "stripe" | "paypal" | "venmo";

export function PayChooser({
  amount,
  savedCard,
  paying,
  disabled,
  onPay,
  primaryLabel,
}: {
  amount: number;
  savedCard?: S27PaymentProfile | null;
  paying?: boolean;
  disabled?: boolean;
  onPay: (method: S27PayMethod) => void | Promise<void>;
  primaryLabel?: string;
}) {
  const label = primaryLabel || `Pay · $${amount}`;

  return (
    <div className="space-y-2">
      {savedCard ? (
        <button
          type="button"
          disabled={disabled || paying}
          onClick={() => onPay("saved-card")}
          className="w-full rounded-xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40"
        >
          {paying ? "Working…" : `${label} · ${savedCard.brand} •••• ${savedCard.last4}`}
        </button>
      ) : null}

      <div className={`grid gap-2 ${savedCard ? "sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-3"}`}>
        <button
          type="button"
          disabled={disabled || paying}
          onClick={() => onPay("venmo")}
          className="rounded-xl border border-[#cfe3f2] bg-[#f3f9fd] px-3 py-3 text-left disabled:opacity-40"
        >
          <p className="text-[13px] font-medium text-[#1a1a1a]">Venmo</p>
          <p className="mt-0.5 text-[11px] text-[#6b665e]">${amount}</p>
        </button>
        <button
          type="button"
          disabled={disabled || paying}
          onClick={() => onPay("paypal")}
          className="rounded-xl border border-[#c9dcef] bg-[#f4f8fc] px-3 py-3 text-left disabled:opacity-40"
        >
          <p className="text-[13px] font-medium text-[#1a1a1a]">PayPal</p>
          <p className="mt-0.5 text-[11px] text-[#6b665e]">${amount}</p>
        </button>
        <button
          type="button"
          disabled={disabled || paying}
          onClick={() => onPay("stripe")}
          className="rounded-xl border border-[#ddd9f5] bg-[#f7f6fd] px-3 py-3 text-left disabled:opacity-40"
        >
          <p className="text-[13px] font-medium text-[#1a1a1a]">Card</p>
          <p className="mt-0.5 text-[11px] text-[#6b665e]">Stripe · ${amount}</p>
        </button>
      </div>

      {!savedCard ? (
        <p className="text-[11px] leading-relaxed text-[#8a8477]">
          No card on file needed. Choose Venmo, PayPal, or card to finish.
        </p>
      ) : (
        <p className="text-[11px] text-[#8a8477]">Or pay another way above.</p>
      )}
    </div>
  );
}
