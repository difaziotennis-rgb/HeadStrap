import Link from "next/link";

import { ART_SITE } from "@/lib/art/site";

const nav = [
  { href: "/", label: "Home" },
  { href: "/shop", label: "Work" },
  { href: "/about", label: "About" },
] as const;

/**
 * Server-only header — scrolls with the page (not fixed/sticky).
 */
export function ArtSiteHeader() {
  return (
    <header className="border-b border-mcm-cream-200/50 bg-[#fbf9f6] py-5 sm:py-7">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5">
        <Link href="/" className="group block min-w-0 flex-1 pr-1">
          <p className="font-light tracking-tight text-mcm-charcoal-900 transition-colors group-hover:text-mcm-charcoal-800">
            {ART_SITE.siteTitle}
          </p>
          <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-charcoal-700">
            Hilton Head Island
          </p>
        </Link>
        <nav
          className="flex shrink-0 flex-row items-center justify-end gap-x-2.5 sm:gap-8"
          aria-label="Primary"
        >
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="relative whitespace-nowrap text-[12px] font-light tracking-wide text-mcm-charcoal-900 transition-colors after:absolute after:bottom-0 after:left-0 after:h-px after:w-0 after:bg-mcm-charcoal-500/45 after:transition-[width] after:duration-300 hover:text-mcm-charcoal-800 hover:after:w-full sm:text-[13px]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
