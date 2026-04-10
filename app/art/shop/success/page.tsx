import Link from "next/link";

export default function ArtCheckoutSuccessPage() {
  return (
    <main className="mx-auto max-w-md px-5 py-24 text-center">
      <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/45">Thank you</p>
      <h1 className="mt-5 text-2xl font-light text-mcm-charcoal-500">Received</h1>
      <p className="mt-6 text-[14px] leading-[1.8] text-mcm-brown-600/72">
        A receipt will follow by email. Ellen will be in touch regarding delivery or pickup.
      </p>
      <p className="mt-12">
        <Link
          href="/art/shop"
          className="text-[13px] border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/35"
        >
          Collection
        </Link>
      </p>
    </main>
  );
}
