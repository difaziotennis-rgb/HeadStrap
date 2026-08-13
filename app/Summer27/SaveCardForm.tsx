"use client";

import { useEffect, useMemo, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { getSummer27StripeConfig } from "./stripe-config";

type Saved = {
  customerId: string;
  paymentMethodId: string;
  brand: "Visa" | "Mastercard" | "Amex";
  last4: string;
  expMonth: string;
  expYear: string;
};

function InnerForm({
  customerId,
  onSaved,
  onError,
}: {
  customerId: string;
  onSaved: (saved: Saved) => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    const { error, setupIntent } = await stripe.confirmSetup({
      elements,
      redirect: "if_required",
    });
    if (error) {
      setBusy(false);
      onError(error.message || "Card setup failed.");
      return;
    }
    const pm =
      typeof setupIntent?.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent?.payment_method?.id;
    if (!pm) {
      setBusy(false);
      onError("No payment method returned.");
      return;
    }
    const res = await fetch("/api/summer27/save-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, paymentMethodId: pm }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      onError(data.error || "Could not save card.");
      return;
    }
    onSaved({
      customerId: data.customerId,
      paymentMethodId: data.paymentMethodId,
      brand: data.brand,
      last4: data.last4,
      expMonth: data.expMonth,
      expYear: data.expYear,
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || busy}
        className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white disabled:opacity-40"
      >
        {busy ? "Saving…" : "Save card"}
      </button>
    </form>
  );
}

export function SaveCardForm({
  email,
  name,
  memberNumber,
  existingCustomerId,
  onSaved,
}: {
  email: string;
  name: string;
  memberNumber: string;
  existingCustomerId?: string;
  onSaved: (saved: Saved) => void;
}) {
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState(existingCustomerId || "");
  const [error, setError] = useState<string | null>(null);
  const [demo, setDemo] = useState(false);
  const [brand, setBrand] = useState<"Visa" | "Mastercard" | "Amex">("Visa");
  const [last4, setLast4] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const cfg = await getSummer27StripeConfig();
      if (cancelled) return;
      if (!cfg.configured || !cfg.publishableKey) {
        setDemo(true);
        return;
      }
      setStripePromise(loadStripe(cfg.publishableKey));
      const res = await fetch("/api/summer27/setup-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          name,
          memberNumber,
          customerId: existingCustomerId || undefined,
        }),
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setError(data.error || "Could not start card setup.");
        return;
      }
      setClientSecret(data.clientSecret);
      setCustomerId(data.customerId);
    })();
    return () => {
      cancelled = true;
    };
  }, [email, name, memberNumber, existingCustomerId]);

  const options = useMemo(
    () => (clientSecret ? { clientSecret, appearance: { theme: "stripe" as const } } : undefined),
    [clientSecret]
  );

  if (demo) {
    return (
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (last4.trim().length !== 4) {
            setError("Enter the last 4 digits (demo mode until Stripe keys are set).");
            return;
          }
          onSaved({
            customerId: "",
            paymentMethodId: "",
            brand,
            last4: last4.trim(),
            expMonth: "",
            expYear: "",
          });
        }}
      >
        <p className="rounded-xl border border-[#ead9c2] bg-[#fbf6ee] px-3 py-2 text-[12px] text-[#6b665e]">
          Stripe keys aren’t set yet — demo card on file (last 4 only). Real card entry appears automatically once you add keys.
        </p>
        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value as typeof brand)}
          className="w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]"
        >
          <option>Visa</option>
          <option>Mastercard</option>
          <option>Amex</option>
        </select>
        <input
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="Last 4"
          className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />
        {error && <p className="text-[12px] text-[#991b1b]">{error}</p>}
        <button type="submit" className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white">
          Save demo card
        </button>
      </form>
    );
  }

  if (error && !clientSecret) {
    return <p className="text-[13px] text-[#991b1b]">{error}</p>;
  }

  if (!stripePromise || !clientSecret || !options || !customerId) {
    return <p className="text-[13px] text-[#8a8477]">Loading secure card form…</p>;
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-[12px] text-[#991b1b]">{error}</p>}
      <Elements stripe={stripePromise} options={options}>
        <InnerForm customerId={customerId} onSaved={onSaved} onError={setError} />
      </Elements>
    </div>
  );
}
