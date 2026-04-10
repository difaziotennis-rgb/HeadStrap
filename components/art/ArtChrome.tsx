import Link from "next/link";

import { ART_SITE } from "@/lib/art/site";

const nav = [
  { href: "/art", label: "Home" },
  { href: "/art/shop", label: "Work" },
  { href: "/art/about", label: "About" },
] as const;

export function ArtChrome({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f4ef] text-mcm-charcoal-800">
      <header className="border-b border-mcm-cream-200/50 bg-[#fbf9f6]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-7 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/art" className="group block">
            <p className="font-light tracking-tight text-mcm-charcoal-500 transition-colors group-hover:text-mcm-charcoal-700">
              {ART_SITE.siteTitle}
            </p>
            <p className="mt-1 text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/55">
              Hilton Head Island
            </p>
          </Link>
          <nav className="flex flex-wrap items-center gap-6 sm:gap-8" aria-label="Primary">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-[13px] font-light tracking-wide text-mcm-charcoal-600/90 transition hover:text-mcm-charcoal-500"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      {children}
      <footer className="mt-24 border-t border-mcm-cream-200/40">
        <div className="mx-auto max-w-6xl px-5 py-14">
          <div className="grid gap-12 sm:grid-cols-2 sm:gap-16">
            <div>
              <p className="text-base font-light text-mcm-charcoal-500">{ART_SITE.artistName}</p>
              <p className="mt-3 max-w-xs text-[13px] leading-[1.7] text-mcm-brown-600/75">
                {ART_SITE.studioLine}
                <br />
                {ART_SITE.studioCity}
                <br />
                <span className="text-mcm-brown-600/60">By appointment.</span>
              </p>
            </div>
            <div className="text-[13px] leading-[1.85] text-mcm-brown-600/75">
              <p>
                <a
                  href={ART_SITE.emailHref}
                  className="border-b border-mcm-charcoal-500/20 pb-px transition hover:border-mcm-charcoal-500/50"
                >
                  {ART_SITE.email}
                </a>
              </p>
              <p className="mt-4">
                <a
                  href={ART_SITE.venmoHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-mcm-charcoal-500/20 pb-px transition hover:border-mcm-charcoal-500/50"
                >
                  {ART_SITE.venmoHandle}
                </a>
              </p>
              <p className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
                <a
                  href={ART_SITE.instagramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-mcm-charcoal-500/20 pb-px transition hover:border-mcm-charcoal-500/50"
                >
                  Instagram
                </a>
                <a
                  href={ART_SITE.facebookHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-b border-mcm-charcoal-500/20 pb-px transition hover:border-mcm-charcoal-500/50"
                >
                  Facebook
                </a>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
