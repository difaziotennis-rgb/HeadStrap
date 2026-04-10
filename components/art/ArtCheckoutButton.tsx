"use client";

import { useState } from "react";

import { formatUsd } from "@/lib/art/catalog";

type Props = {
  slug: string;
  priceUsd: number;
  disabled?: boolean;
};

export function ArtCheckoutButton({ slug, priceUsd, disabled }: Props) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/art/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          customerEmail: email.trim() || undefined,
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
      <label className="block text-[13px] text-mcm-brown-600/65">
        Email (optional)
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder=""
          className="mt-2 w-full border border-mcm-cream-200/90 bg-white px-3 py-2.5 text-[14px] text-mcm-charcoal-600 placeholder:text-mcm-brown-600/35 focus:border-mcm-charcoal-500/25 focus:outline-none"
        />
      </label>
      <button
        type="button"
        onClick={pay}
        disabled={disabled || loading}
        className="w-full border border-mcm-charcoal-500/90 bg-mcm-charcoal-500 px-4 py-3 text-[13px] font-normal tracking-wide text-white transition hover:bg-mcm-charcoal-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "…" : `${formatUsd(priceUsd)} — card`}
      </button>
      {error && <p className="text-[13px] text-red-800/90">{error}</p>}
      <p className="text-[11px] leading-relaxed text-mcm-brown-600/55">
        Card processing. Fulfillment by arrangement after purchase.
      </p>
    </div>
  );
}
