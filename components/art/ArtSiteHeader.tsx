import Link from "next/link";

import { ART_SITE } from "@/lib/art/site";

const nav = [
  { href: "/art", label: "Home" },
  { href: "/art/shop", label: "Work" },
  { href: "/art/about", label: "About" },
] as const;

/**
 * Server-only header — scrolls with the page (not fixed/sticky).
 */
export function ArtSiteHeader() {
  return (
    <header className="border-b border-mcm-cream-200/50 bg-[#fbf9f6] py-5 sm:py-7">
      <div className="mx-auto flex max-w-6xl items-start justify-between gap-4 px-5 sm:items-center">
        <Link href="/art" className="group block min-w-0 flex-1 pr-1">
          <p className="font-light tracking-tight text-mcm-charcoal-500 transition-colors group-hover:text-mcm-charcoal-700">
            {ART_SITE.siteTitle}
          </p>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/55">
            Hilton Head Island
          </p>
        </Link>
        <nav
          className="flex shrink-0 flex-col items-end gap-1.5 sm:flex-row sm:items-center sm:gap-8"
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative whitespace-nowrap text-[13px] font-light tracking-wide text-mcm-charcoal-600/90 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-mcm-charcoal-500/45 after:transition-[width] after:duration-300 hover:text-mcm-charcoal-500 hover:after:w-full"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
