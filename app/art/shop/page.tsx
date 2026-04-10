import Link from "next/link";

import { PieceCard } from "@/components/art/PieceCard";
import { getArtPiecesFiltered } from "@/lib/art/catalog";
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

export default function ArtShopPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const cat = parseCat(searchParams.cat);
  const pieces = getArtPiecesFiltered(cat);

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 sm:py-16">
      <div className="max-w-lg">
        <p className="text-[10px] font-normal uppercase tracking-[0.32em] text-mcm-brown-600/45">Work</p>
        <h1 className="mt-4 text-3xl font-light tracking-tight text-mcm-charcoal-500 sm:text-4xl">Collection</h1>
        <p className="mt-5 text-[14px] leading-[1.8] text-mcm-brown-600/68">
          Current list. Sold work remains for reference.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap gap-2" role="tablist" aria-label="Filter by category">
        {CATEGORIES.map((c) => {
          const active = c.id === cat;
          const href = c.id === "all" ? "/art/shop" : `/art/shop?cat=${c.id}`;
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

      <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {pieces.map((piece) => (
          <li key={piece.slug}>
            <PieceCard piece={piece} />
          </li>
        ))}
      </ul>
    </main>
  );
}
