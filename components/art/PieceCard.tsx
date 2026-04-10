import Image from "next/image";
import Link from "next/link";

import { getBodyOfWorkMeta, getBodyOfWorkSlugForPieceSlug } from "@/lib/art/bodies-of-work";
import type { ArtPiece } from "@/lib/art/types";
import { formatUsd } from "@/lib/art/catalog";

export function PieceCard({ piece }: { piece: ArtPiece }) {
  const img = piece.images[0];
  const sold = piece.availability === "sold";

  return (
    <Link
      href={`/art/shop/${piece.slug}`}
      className="group flex flex-col overflow-hidden border border-mcm-cream-200/70 bg-white/80 transition hover:border-mcm-cream-300"
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-mcm-cream-100">
        {img ? (
          <Image
            src={img}
            alt={piece.title}
            fill
            className="object-cover transition duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            unoptimized
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-mcm-brown-600/50">No image</div>
        )}
        {sold && (
          <span className="absolute left-2 top-2 border border-white/40 bg-mcm-charcoal-500/85 px-2 py-0.5 text-[9px] font-medium uppercase tracking-[0.14em] text-white">
            Sold
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3">
        <h2 className="text-base font-light leading-snug text-mcm-charcoal-500 group-hover:text-mcm-charcoal-700">
          {piece.title}
        </h2>
        {piece.category === "paintings" && (
          <p className="mt-1 text-[11px] font-light tracking-wide text-mcm-brown-600/45">
            {getBodyOfWorkMeta(getBodyOfWorkSlugForPieceSlug(piece.slug)).shortTitle}
          </p>
        )}
        <p className="mt-2 text-[13px] text-mcm-brown-600/70">
          <span className="capitalize">{piece.category}</span>
          <span className="mx-1.5 text-mcm-cream-300">·</span>
          {sold ? <span className="line-through opacity-60">{formatUsd(piece.priceUsd)}</span> : formatUsd(piece.priceUsd)}
        </p>
      </div>
    </Link>
  );
}
