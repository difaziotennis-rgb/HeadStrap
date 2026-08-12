"use client";

import Link from "next/link";

export default function Summer27Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-16 text-center">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">DiFazio Tennis</p>
      <h2 className="mt-2 text-xl font-medium">Something went wrong</h2>
      <p className="mt-2 text-[14px] text-[#6b665e]">Try again, or return home.</p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white"
        >
          Try again
        </button>
        <Link
          href="/Summer27"
          className="rounded-lg border border-[#e8e5df] bg-white px-4 py-2 text-[13px] text-[#4a4a4a]"
        >
          Home
        </Link>
      </div>
    </main>
  );
}
