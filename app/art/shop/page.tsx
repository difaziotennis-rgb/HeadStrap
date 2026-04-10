import Link from "next/link";

import { PieceCard } from "@/components/art/PieceCard";
import { BODIES_OF_WORK, type BodyOfWorkSlug } from "@/lib/art/bodies-of-work";
import { getArtPiecesFiltered } from "@/lib/art/catalog";
import { buildArtShopHref } from "@/lib/art/shop-url";
import type { ArtCategory } from "@/lib/art/types";

const CATEGORIES: { id: ArtCategory | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "paintings", label: "Paintings" },
  { id: "photography", label: "Photography" },
  { id: "ceramics", label: "Ceramics" },
];

function parseCat(raw: string | string[] | undefined): ArtCategory | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "paintings" || v === "photography" || v === "ceramics") return v;
  return "all";
}

function parseBody(raw: string | string[] | undefined): BodyOfWorkSlug | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  const ok = BODIES_OF_WORK.some((b) => b.slug === v);
  if (ok && v) return v as BodyOfWorkSlug;
  return "all";
}

function bodyChipHref(bodySlug: BodyOfWorkSlug): string {
  if (bodySlug === "photography") return buildArtShopHref({ cat: "photography", body: "photography" });
  if (bodySlug === "ceramics") return buildArtShopHref({ cat: "ceramics", body: "ceramics" });
  return buildArtShopHref({ cat: "paintings", body: bodySlug });
}

function categoryHref(
  catId: ArtCategory | "all",
  currentBody: BodyOfWorkSlug | "all"
): string {
  if (catId === "all") return buildArtShopHref({ cat: "all", body: "all" });
  if (catId === "photography") return buildArtShopHref({ cat: "photography", body: "photography" });
  if (catId === "ceramics") return buildArtShopHref({ cat: "ceramics", body: "ceramics" });
  if (
    currentBody !== "all" &&
    currentBody !== "photography" &&
    currentBody !== "ceramics"
  ) {
    return buildArtShopHref({ cat: "paintings", body: currentBody });
  }
  return buildArtShopHref({ cat: "paintings", body: "all" });
}

export default function ArtShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cat = parseCat(searchParams.cat);
  const body = parseBody(searchParams.body);
  const pieces = getArtPiecesFiltered(cat, body);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/45">Work</p>
        <h1 className="mt-4 text-3xl font-light tracking-tight text-mcm-charcoal-500 sm:text-4xl">Collection</h1>
        <p className="mt-5 text-[14px] leading-[1.8] text-mcm-brown-600/68">
          Browse by medium, or explore curated groups of paintings. Sold work stays listed for reference.
        </p>
      </div>

      <section className="mt-12 border-t border-mcm-cream-200/50 pt-10" aria-labelledby="bodies-heading">
        <h2 id="bodies-heading" className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/45">
          Bodies of work
        </h2>
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {BODIES_OF_WORK.map((b) => {
            const active = body === b.slug;
            return (
              <li key={b.slug}>
                <Link
                  href={bodyChipHref(b.slug)}
                  scroll={false}
                  className={`block border px-4 py-4 transition ${
                    active
                      ? "border-mcm-charcoal-500/35 bg-white shadow-sm"
                      : "border-mcm-cream-200/80 bg-white/60 hover:border-mcm-cream-300 hover:bg-white"
                  }`}
                >
                  <span className="font-normal text-[15px] text-mcm-charcoal-600">{b.title}</span>
                  <span className="mt-2 block text-[12px] font-light leading-relaxed text-mcm-brown-600/70">{b.blurb}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        {body !== "all" && (
          <p className="mt-4">
            <Link
              href="/art/shop"
              className="text-[12px] border-b border-mcm-charcoal-500/20 pb-px text-mcm-brown-600/80 transition hover:border-mcm-charcoal-500/40"
            >
              Clear body filter
            </Link>
          </p>
        )}
      </section>

      <div
        className="sticky top-0 z-10 -mx-5 mb-2 mt-12 border-b border-mcm-cream-200/60 bg-[#f7f4ef]/95 px-5 py-3 backdrop-blur-sm sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Filter by medium"
      >
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => {
            const active = c.id === cat;
            const href = categoryHref(c.id, body);
            return (
              <Link
                key={c.id}
                href={href}
                scroll={false}
                className={`px-3 py-1.5 text-[13px] tracking-wide transition ${
                  active
                    ? "border-b border-mcm-charcoal-500/60 text-mcm-charcoal-800"
                    : "border-b border-transparent text-mcm-charcoal-600/70 hover:border-mcm-cream-300"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {c.label}
              </Link>
            );
          })}
        </div>
      </div>

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece) => (
          <li key={piece.slug}>
            <PieceCard piece={piece} />
          </li>
        ))}
      </ul>

      {pieces.length === 0 && (
        <p className="mt-12 text-center text-[14px] text-mcm-brown-600/65">
          Nothing in this filter yet. Try another medium or{" "}
          <Link href="/art/shop" className="border-b border-mcm-charcoal-500/25 pb-px">
            view the full collection
          </Link>
          .
        </p>
      )}
    </main>
  );
}
