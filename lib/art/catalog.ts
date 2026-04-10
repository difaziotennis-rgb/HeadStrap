import type { BodyOfWorkSlug } from "./bodies-of-work";
import { getBodyOfWorkSlugForPieceSlug } from "./bodies-of-work";
import type { ArtCategory, ArtPiece } from "./types";
import pieces from "./pieces.json";

export const artPieces = pieces as ArtPiece[];

export function getArtPieceBySlug(slug: string): ArtPiece | undefined {
  return artPieces.find((p) => p.slug === slug);
}

export function getArtPiecesFiltered(
  category: ArtCategory | "all",
  body: BodyOfWorkSlug | "all" = "all"
): ArtPiece[] {
  let list = [...artPieces];
  if (category !== "all") {
    list = list.filter((p) => p.category === category);
  }
  if (body !== "all") {
    list = list.filter((p) => getBodyOfWorkSlugForPieceSlug(p.slug) === body);
  }
  return list;
}

export function formatUsd(priceUsd: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceUsd % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(priceUsd);
}
