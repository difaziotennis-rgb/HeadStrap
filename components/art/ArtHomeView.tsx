import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

import { ArtHeroParallax } from "@/components/art/ArtHeroParallax";
import { ArtPieceCardImage } from "@/components/art/ArtPieceCardImage";
import { ArtPressStrip } from "@/components/art/ArtPressStrip";
import { formatUsd, getArtPieceBySlug } from "@/lib/art/catalog";
import {
  AWARDS_AND_EXHIBITIONS,
  FEATURED_SHOP_SLUGS,
  HERO_FULLBLEED_IMAGE_SRC,
  STUDIO_SECOND,
  STUDIO_SPOTLIGHT,
} from "@/lib/art/homepage-media";
import { ART_SITE } from "@/lib/art/site";

import { artHeroFont } from "@/app/art/fonts";

/** Light shadow so copy stays legible on busy photos; hero uses Poppins + scrim (see below). */
const heroTitleShadow: CSSProperties = {
  textShadow: "0 1px 3px rgba(0,0,0,0.65), 0 2px 14px rgba(0,0,0,0.35)",
};

function HeroFullBleedBackground() {
  return (
    <ArtHeroParallax className="pointer-events-none absolute inset-0 overflow-hidden bg-[#f7f4ef]">
      <img
        src={HERO_FULLBLEED_IMAGE_SRC}
        alt=""
        className="h-[118%] min-h-full w-full max-w-none object-cover object-[center_42%] sm:object-center"
        decoding="async"
        fetchPriority="high"
      />
    </ArtHeroParallax>
  );
}

export function ArtHomeView() {
  const featured = FEATURED_SHOP_SLUGS.map((slug) => getArtPieceBySlug(slug)).filter(
    (p): p is NonNullable<ReturnType<typeof getArtPieceBySlug>> => Boolean(p)
  );
  return (
    <main className="overflow-x-hidden bg-[#f7f4ef]">
      <section
        id="top"
        className="relative min-h-[min(88vh,820px)] scroll-mt-28 overflow-hidden"
      >
        <HeroFullBleedBackground />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col px-5 pb-14 pt-12 sm:pb-16 sm:pt-14 md:min-h-[min(84vh,800px)] md:justify-center md:pb-20 md:pt-0">
          <div
            className={`mx-auto w-full max-w-[42rem] text-center antialiased ${artHeroFont.className}`}
          >
            {/* Scrim matches Squarespace readability: clear type without relying only on shadow. */}
            <div className="rounded-sm bg-black/32 px-6 py-8 shadow-[0_12px_40px_rgba(0,0,0,0.28)] backdrop-blur-[2px] sm:px-9 sm:py-10">
              <p className="text-[12px] font-medium uppercase tracking-[0.28em] text-white/95 sm:text-[13px]">
                {ART_SITE.siteTitle}
              </p>
              <h1
                className="mt-5 text-balance text-center font-light leading-[1.28] tracking-[-0.02em] text-white text-[1.85rem] sm:mt-6 sm:text-[2.35rem] md:text-[2.5rem]"
                style={heroTitleShadow}
              >
                {ART_SITE.tagline}
              </h1>
              <p className="mt-6 text-center text-[16px] font-normal leading-[1.75] text-white/95 sm:mt-7 sm:text-[17px] md:text-[18px]">
                Oil and acrylic; the Lowcountry—marsh, tide, garden, coast—recurs as subject. Studio: Hilton Head Island.
              </p>
              <p className="mt-3 text-center text-[15px] font-normal leading-[1.75] text-white/92 sm:mt-4 sm:text-[16px]">
                Visits by arrangement.
              </p>
              <nav
                className="mt-8 flex flex-wrap items-center justify-center gap-x-10 gap-y-2 text-[15px] font-medium tracking-[0.02em] text-white sm:mt-9 sm:text-[16px]"
                aria-label="Primary actions"
              >
                <Link
                  href="/art/shop"
                  className="border-b border-white/90 pb-0.5 text-white transition hover:border-white hover:text-white"
                >
                  Work
                </Link>
                <Link
                  href="/art/about"
                  className="border-b border-white/90 pb-0.5 text-white transition hover:border-white hover:text-white"
                >
                  Statement
                </Link>
              </nav>
            </div>
          </div>
        </div>
      </section>

      <ArtPressStrip />

      <section id="studio" className="scroll-mt-28 border-t border-mcm-cream-200/40 bg-[#f7f4ef]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-12">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <figure className="overflow-hidden border border-mcm-cream-200/70 bg-white transition-shadow duration-500 hover:shadow-mcm">
                <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                  <Image
                    src={STUDIO_SPOTLIGHT.src}
                    alt={STUDIO_SPOTLIGHT.alt}
                    fill
                    className="object-cover object-center transition duration-700 ease-out hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 50vw, 40vw"
                    unoptimized
                  />
                </div>
                <figcaption className="border-t border-mcm-cream-100/90 px-3 py-2 text-[11px] font-light text-mcm-brown-600/55">
                  {STUDIO_SPOTLIGHT.caption}
                </figcaption>
              </figure>
              <figure className="overflow-hidden border border-mcm-cream-200/70 bg-white transition-shadow duration-500 hover:shadow-mcm">
                <div className="relative aspect-[3/4] w-full sm:aspect-[4/5]">
                  <Image
                    src={STUDIO_SECOND.src}
                    alt={STUDIO_SECOND.alt}
                    fill
                    className="object-cover object-center transition duration-700 ease-out hover:scale-[1.02]"
                    sizes="(max-width: 1024px) 50vw, 40vw"
                    unoptimized
                  />
                </div>
                <figcaption className="border-t border-mcm-cream-100/90 px-3 py-2 text-[11px] font-light text-mcm-brown-600/55">
                  {STUDIO_SECOND.caption}
                </figcaption>
              </figure>
            </div>
            <div>
              <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/40">Ellen DiFazio</p>
              <h2 className="mt-3 font-light text-xl tracking-tight text-mcm-charcoal-500 sm:text-2xl">Studio</h2>
              <p className="mt-5 text-[14px] font-light leading-[1.87] text-mcm-brown-600/72">
                Long Island–born; taught in New York schools for three decades. Painting full-time from a studio on
                Hilton Head—the same coast and marsh that surface in the work.
              </p>
              <p className="mt-4 text-[13px] font-light text-mcm-brown-600/55">
                <a
                  href={ART_SITE.emailHref}
                  className="border-b border-mcm-charcoal-500/15 pb-px transition hover:border-mcm-charcoal-500/35"
                >
                  {ART_SITE.email}
                </a>
              </p>
              <Link
                href="/art/about"
                className="mt-6 inline-block text-[13px] border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/85 transition hover:border-mcm-charcoal-500/35"
              >
                Statement
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section id="exhibitions" className="scroll-mt-28 border-t border-mcm-cream-200/40 bg-[#faf8f4]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="max-w-md">
            <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/40">Exhibitions</p>
            <h2 className="mt-3 font-light text-xl tracking-tight text-mcm-charcoal-500 sm:text-2xl">Selected venues</h2>
            <p className="mt-3 text-[14px] font-light leading-[1.87] text-mcm-brown-600/65">
              Awards, group and solo shows, print features.
            </p>
          </div>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {AWARDS_AND_EXHIBITIONS.map((photo) => (
              <li key={photo.src} className="flex flex-col overflow-hidden border border-mcm-cream-200/60 bg-white/70">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100/80">
                  <Image
                    src={photo.src}
                    alt={photo.alt}
                    fill
                    className="object-cover object-center transition duration-700 ease-out hover:scale-[1.03]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    unoptimized
                  />
                </div>
                <p className="border-t border-mcm-cream-100/80 px-3 py-2 text-left text-[11px] font-light leading-snug text-mcm-brown-600/68">
                  {photo.caption}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="selected" className="scroll-mt-28 border-t border-mcm-cream-200/40 bg-[#f7f4ef]">
        <div className="mx-auto max-w-6xl px-5 py-10 sm:py-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
            <div>
              <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/40">Inventory</p>
              <h2 className="mt-2 font-light text-xl tracking-tight text-mcm-charcoal-500 sm:text-2xl">Selected</h2>
            </div>
            <Link
              href="/art/shop"
              className="text-[13px] border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/85 transition hover:border-mcm-charcoal-500/35 sm:shrink-0"
            >
              Full list
            </Link>
          </div>
          <ul className="mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden">
            {featured.map((piece) => (
              <li
                key={piece.slug}
                className="w-[min(100%,280px)] shrink-0 snap-start sm:w-auto sm:min-w-0 sm:snap-none sm:shrink"
              >
                <Link
                  href={`/art/shop/${piece.slug}`}
                  className="group flex flex-col overflow-hidden border border-mcm-cream-200/70 bg-white/80 transition hover:border-mcm-cream-300"
                >
                  <div className="relative">
                    <ArtPieceCardImage piece={piece} />
                    {piece.availability === "sold" && (
                      <span className="pointer-events-none absolute left-2 top-2 z-[2] border border-white/30 bg-mcm-charcoal-500/80 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white">
                        Sold
                      </span>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col border-t border-mcm-cream-100/80 p-3 pt-2.5">
                    <span className="font-normal text-[15px] text-mcm-charcoal-500 group-hover:text-mcm-charcoal-700">
                      {piece.title}
                    </span>
                    <span className="mt-1.5 text-[13px] font-light text-mcm-brown-600/65">
                      <span className="capitalize">{piece.category}</span>
                      <span className="mx-1.5 text-mcm-cream-300">·</span>
                      {piece.availability === "available" ? formatUsd(piece.priceUsd) : "Sold"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contact" className="scroll-mt-28 border-t border-mcm-cream-200/40 bg-[#faf8f4]">
        <div className="mx-auto max-w-sm px-5 py-10 text-center sm:py-12">
          <p className="text-[14px] font-light leading-[1.87] text-mcm-brown-600/72">
            {ART_SITE.studioLine}
            <br />
            {ART_SITE.studioCity}
          </p>
          <p className="mt-5 text-[13px]">
            <a
              href={ART_SITE.emailHref}
              className="border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/35"
            >
              {ART_SITE.email}
            </a>
          </p>
          <p className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px]">
            <a
              href={ART_SITE.instagramHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/35"
            >
              Instagram
            </a>
            <a
              href={ART_SITE.facebookHref}
              target="_blank"
              rel="noopener noreferrer"
              className="border-b border-mcm-charcoal-500/15 pb-px text-mcm-charcoal-600/90 transition hover:border-mcm-charcoal-500/35"
            >
              Facebook
            </a>
          </p>
        </div>
      </section>
    </main>
  );
}
