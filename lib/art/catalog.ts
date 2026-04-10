import type { ArtCategory, ArtPiece } from "./types";
import pieces from "./pieces.json";

export const artPieces = pieces as ArtPiece[];

export function getArtPieceBySlug(slug: string): ArtPiece | undefined {
  return artPieces.find((p) => p.slug === slug);
}

export function getArtPiecesFiltered(category: ArtCategory | "all"): ArtPiece[] {
  if (category === "all") return [...artPieces];
  return artPieces.filter((p) => p.category === category);
}

export function formatUsd(priceUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceUsd % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceUsd);
}
