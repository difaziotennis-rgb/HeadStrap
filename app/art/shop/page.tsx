import Link from "next/link";

import { PieceCard } from "@/components/art/PieceCard";
import { BODIES_OF_WORK, type BodyOfWorkSlug } from "@/lib/art/bodies-of-work";
import { getArtPiecesFiltered } from "@/lib/art/catalog";
import { buildArtShopHref } from "@/lib/art/shop-url";
import type { ArtCategory } from "@/lib/art/types";

const VALID_BODIES = new Set<BodyOfWorkSlug>(["marsh-tide", "photography", "ceramics"]);

type CollectionTab = "all" | "marsh-tide" | "photography" | "ceramics";

function parseCat(raw: string | string[] | undefined): ArtCategory | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v === "paintings" || v === "photography" || v === "ceramics") return v;
  return "all";
}

function parseBody(raw: string | string[] | undefined): BodyOfWorkSlug | "all" {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && VALID_BODIES.has(v as BodyOfWorkSlug)) return v as BodyOfWorkSlug;
  return "all";
}

function tabFromFilters(cat: ArtCategory | "all", body: BodyOfWorkSlug | "all"): CollectionTab {
  if (body === "photography" && cat === "photography") return "photography";
  if (body === "ceramics" && cat === "ceramics") return "ceramics";
  if (body === "marsh-tide" && cat === "paintings") return "marsh-tide";
  if (cat === "photography") return "photography";
  if (cat === "ceramics") return "ceramics";
  if (cat === "paintings") return "marsh-tide";
  return "all";
}

function hrefForTab(tab: CollectionTab): string {
  switch (tab) {
    case "all":
      return "/art/shop";
    case "marsh-tide":
      return buildArtShopHref({ cat: "paintings", body: "marsh-tide" });
    case "photography":
      return buildArtShopHref({ cat: "photography", body: "photography" });
    case "ceramics":
      return buildArtShopHref({ cat: "ceramics", body: "ceramics" });
  }
}

export default function ArtShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cat = parseCat(searchParams.cat);
  const body = parseBody(searchParams.body);
  const pieces = getArtPiecesFiltered(cat, body);
  const activeTab = tabFromFilters(cat, body);

  const tabs: { id: CollectionTab; label: string }[] = [
    { id: "all", label: "All" },
    ...BODIES_OF_WORK.map((b) => ({ id: b.slug as CollectionTab, label: b.title })),
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-700/80">Work</p>
        <h1 className="mt-4 text-3xl font-light tracking-tight text-mcm-charcoal-800 sm:text-4xl">Collection</h1>
        <p className="mt-5 text-[15px] leading-[1.8] text-mcm-charcoal-700">
          Browse by category below. Each name is a link. Sold work stays listed for reference.
        </p>
      </div>

      <div
        className="sticky top-0 z-10 -mx-5 mb-2 mt-10 border-b border-mcm-cream-200/60 bg-[#f7f4ef]/95 px-5 py-3 backdrop-blur-sm sm:mx-0 sm:px-0"
        role="tablist"
        aria-label="Collection categories"
      >
        <div className="flex flex-wrap gap-x-1 gap-y-2 sm:gap-x-2">
          {tabs.map((t) => {
            const active = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={hrefForTab(t.id)}
                scroll={false}
                className={`rounded-sm px-3 py-2 text-[13px] tracking-wide transition sm:px-4 sm:text-[14px] ${
                  active
                    ? "bg-mcm-charcoal-800 text-white"
                    : "border border-mcm-cream-300/90 bg-white/90 text-mcm-charcoal-800 hover:border-mcm-charcoal-500/25"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {t.label}
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
        <p className="mt-12 text-center text-[15px] text-mcm-charcoal-700">
          Nothing in this filter yet. Try another category or{" "}
          <Link href="/art/shop" className="border-b border-mcm-charcoal-500/35 pb-px">
            view the full collection
          </Link>
          .
        </p>
      )}
    </main>
  );
}
