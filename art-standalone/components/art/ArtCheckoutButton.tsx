"use client";

import { useMemo, useState } from "react";

import { formatUsd } from "@/lib/art/catalog";

type Props = {
  slug: string;
  priceUsd: number;
  disabled?: boolean;
};

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export function ArtCheckoutButton({ slug, priceUsd, disabled }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailOk = useMemo(() => isValidEmail(email), [email]);

  async function pay() {
    setError(null);
    if (!emailOk) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/art/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customerEmail: email.trim(),
        }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error || "Could not start checkout.");
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("No checkout URL returned.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-5">
      <label className="block text-[13px] text-mcm-charcoal-800">
        Email <span className="text-mcm-charcoal-600">(required)</span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full border border-mcm-cream-200/90 bg-white px-3 py-2.5 text-[14px] text-mcm-charcoal-800 placeholder:text-mcm-charcoal-500/50 focus:border-mcm-charcoal-500/35 focus:outline-none"
        />
      </label>
      <button
        type="button"
        onClick={pay}
        disabled={disabled || loading || !emailOk}
        className="w-full border border-mcm-charcoal-500/90 bg-mcm-charcoal-500 px-4 py-3 text-[13px] font-normal tracking-wide text-white transition hover:bg-mcm-charcoal-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "…" : `${formatUsd(priceUsd)} — card`}
      </button>
      {error && <p className="text-[13px] text-red-800/90">{error}</p>}
      <p className="text-[12px] leading-relaxed text-mcm-charcoal-700">
        Secure card checkout. Shipping is available upon request—we’ll follow up by email to arrange delivery or pickup.
      </p>
    </div>
  );
}
