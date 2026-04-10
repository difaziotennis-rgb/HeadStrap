import Link from "next/link";

import { PRESS_ITEMS } from "@/lib/art/press";

export function ArtPressStrip() {
  return (
    <div className="border-y border-mcm-cream-200/50 bg-[#faf8f4]/80">
      <div className="mx-auto max-w-6xl px-5 py-8 sm:py-10">
        <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-charcoal-700">Press & recognition</p>
        <ul className="mt-5 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-x-10 sm:gap-y-3">
          {PRESS_ITEMS.map((item) => (
            <li key={`${item.outlet}-${item.headline}`} className="text-[14px] leading-snug text-mcm-charcoal-800">
              <span className="font-normal text-mcm-charcoal-900">{item.outlet}</span>
              {item.year ? (
                <span className="text-mcm-charcoal-700"> · {item.year}</span>
              ) : null}
              <span className="mt-0.5 block text-[13px] font-light text-mcm-charcoal-800">{item.headline}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-[13px] font-light text-mcm-charcoal-800">
          <Link href="/art/about" className="border-b border-mcm-charcoal-500/15 pb-px transition hover:border-mcm-charcoal-500/35">
            Full credits &amp; statement
          </Link>
          {" · "}
          <a
            href="/api/art/cv"
            className="border-b border-mcm-charcoal-500/15 pb-px transition hover:border-mcm-charcoal-500/35"
          >
            Download CV (PDF)
          </a>
        </p>
      </div>
    </div>
  );
}
