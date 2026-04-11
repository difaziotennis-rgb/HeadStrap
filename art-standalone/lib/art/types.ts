export type ArtCategory = "paintings" | "photography" | "ceramics";

export type ArtAvailability = "available" | "sold";

export type ArtPiece = {
  slug: string;
  title: string;
  /** USD, e.g. 2800 for $2,800 */
  priceUsd: number;
  category: ArtCategory;
  availability: ArtAvailability;
  /** Squarespace CDN URLs (hotlinked until migrated to your own storage) */
  images: string[];
};
