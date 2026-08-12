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
  /** Action verb only — amount is shown once above the methods. */
  primaryLabel?: string;
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
        <button
          type="button"
          disabled={busy}
          onClick={() => onPay("saved-card")}
          className="w-full rounded-2xl bg-[#1a1a1a] py-3.5 text-[14px] font-medium text-white disabled:opacity-40"
        >
          {paying ? "Working…" : `${action} · ${savedCard.brand} •••• ${savedCard.last4}`}
        </button>
      ) : null}

      <div className="grid grid-cols-3 gap-2">
        <PayMethodButton
          label="Venmo"
          hint="App"
          disabled={busy}
          onClick={() => onPay("venmo")}
          className="border-[#b8d4ea] bg-[#eef6fb] text-[#0b3d5c] hover:bg-[#e4f0f8]"
        />
        <PayMethodButton
          label="PayPal"
          hint="Account"
          disabled={busy}
          onClick={() => onPay("paypal")}
          className="border-[#c5d4e8] bg-[#f0f5fb] text-[#003087] hover:bg-[#e7eef8]"
        />
        <PayMethodButton
          label="Card"
          hint="Stripe"
          disabled={busy}
          onClick={() => onPay("stripe")}
          className="border-[#ddd8e8] bg-[#f6f4fa] text-[#2a2140] hover:bg-[#efeaf6]"
        />
      </div>

      <p className="text-center text-[11px] leading-relaxed text-[#8a8477]">
        {savedCard ? "Or pay another way." : "No card on file needed."}
      </p>
    </div>
  );
}

function PayMethodButton({
  label,
  hint,
  disabled,
  onClick,
  className,
}: {
  label: string;
  hint: string;
  disabled?: boolean;
  onClick: () => void;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex min-h-[4.25rem] flex-col items-center justify-center rounded-2xl border px-2 py-3 text-center transition disabled:opacity-40 ${className}`}
    >
      <span className="text-[13px] font-semibold tracking-tight">{label}</span>
      <span className="mt-0.5 text-[10px] opacity-70">{hint}</span>
    </button>
  );
}
