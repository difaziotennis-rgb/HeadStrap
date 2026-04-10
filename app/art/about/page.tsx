import Link from "next/link";

import { ARTIST_STATEMENT_SECTIONS, EDUCATION_LIST } from "@/lib/art/site";

export default function ArtAboutPage() {
  return (
    <main className="mx-auto max-w-3xl scroll-mt-28 px-5 py-14 sm:py-20">
      <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-charcoal-700">About</p>
      <h1 className="mt-4 text-3xl font-light tracking-tight text-mcm-charcoal-900 sm:text-4xl">Statement</h1>

      <p className="mt-8 text-[15px] leading-relaxed text-mcm-charcoal-800">
        <a
          href="/api/art/cv"
          className="border-b border-mcm-charcoal-500/25 pb-px text-mcm-charcoal-900 transition hover:border-mcm-charcoal-500/45"
        >
          Download CV (PDF)
        </a>
        <span className="text-mcm-charcoal-700"> — exhibitions, education, and selected recognition.</span>
      </p>

      <div className="mt-12 space-y-14">
        {ARTIST_STATEMENT_SECTIONS.map((section) => (
          <section key={section.heading || "intro"}>
            {section.heading && (
              <h2 className="text-2xl font-light text-mcm-charcoal-900">{section.heading}</h2>
            )}
            <div className={section.heading ? "mt-6 space-y-5" : "space-y-5"}>
              {section.paragraphs.map((p, i) => (
                <p key={`${section.heading || "s"}-${i}`} className="text-[15px] leading-[1.85] text-mcm-charcoal-800">
                  {p}
                </p>
              ))}
            </div>
          </section>
        ))}
      </div>

      <section className="mt-16 border-t border-mcm-cream-200/60 pt-14">
        <h2 className="text-xl font-light text-mcm-charcoal-900">Credits</h2>
        <ul className="mt-6 space-y-3 text-[14px] leading-relaxed text-mcm-charcoal-800">
          {EDUCATION_LIST.map((item) => (
            <li key={item} className="flex gap-3">
              <span className="mt-2 h-px w-2 shrink-0 bg-mcm-charcoal-600/35" aria-hidden />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-14">
        <Link
          href="/art/shop"
          className="text-[13px] border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/35"
        >
          Work
        </Link>
      </p>
    </main>
  );
}
