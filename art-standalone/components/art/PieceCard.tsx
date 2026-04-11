import Link from "next/link";

import { ArtPieceCardImage } from "@/components/art/ArtPieceCardImage";
import type { ArtPiece } from "@/lib/art/types";
import { formatUsd } from "@/lib/art/catalog";

export function PieceCard({ piece }: { piece: ArtPiece }) {
  const sold = piece.availability === "sold";

  return (
    <Link
      href={`/shop/${piece.slug}`}
      className="group flex flex-col overflow-hidden border border-mcm-cream-200/70 bg-white/80 transition hover:border-mcm-cream-300"
    >
      <div className="relative">
        <ArtPieceCardImage piece={piece} />
        {sold && (
          <span className="pointer-events-none absolute left-2 top-2 z-[2] border border-white/40 bg-mcm-charcoal-500/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white">
            Sold
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <h2 className="text-base font-light leading-snug text-mcm-charcoal-700 group-hover:text-mcm-charcoal-900">
          {piece.title}
        </h2>
        <p className="mt-2 text-[13px] text-mcm-charcoal-700/90">
          <span className="capitalize">{piece.category}</span>
          <span className="mx-1.5 text-mcm-cream-300">·</span>
          {sold ? <span className="line-through opacity-60">{formatUsd(piece.priceUsd)}</span> : formatUsd(piece.priceUsd)}
        </p>
      </div>
    </Link>
  );
}
