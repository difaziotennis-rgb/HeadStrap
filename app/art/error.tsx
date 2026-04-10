"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ArtError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/45">E. DiFazio Art</p>
      <h1 className="mt-4 text-2xl font-light text-mcm-charcoal-500">Something went wrong</h1>
      <p className="mt-4 text-[14px] leading-relaxed text-mcm-brown-600/75">
        This page could not be loaded. You can try again or return home.
      </p>
      <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-[13px]">
        <button
          type="button"
          onClick={() => reset()}
          className="border-b border-mcm-charcoal-500/30 pb-px text-mcm-charcoal-600 transition hover:border-mcm-charcoal-500/60"
        >
          Try again
        </button>
        <Link href="/art" className="border-b border-mcm-charcoal-500/30 pb-px text-mcm-charcoal-600 transition hover:border-mcm-charcoal-500/60">
          Home
        </Link>
      </div>
    </main>
  );
}
