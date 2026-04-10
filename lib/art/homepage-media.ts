/**
 * Imagery from Ellen’s live site (edifazioart.net) — studio, awards, and exhibitions.
 * URLs point at Squarespace CDN; swap for self-hosted assets when ready.
 */

export type HomePhoto = {
  src: string;
  /** Human-readable description for accessibility */
  alt: string;
  /** Short label for captions */
  caption: string;
};

/**
 * Full-bleed hero — single fixed image URL (do not rotate through piece.images[]).
 * Kept in sync with catalog piece `autumn-in-the-marsh` primary image.
 */
export const HERO_FULLBLEED_IMAGE_SRC =
  "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/ff136c02-5165-4540-8fd4-3ee7e1df2bd8/IMG_0559.jpeg" as const;

export const STUDIO_SPOTLIGHT: HomePhoto = {
  src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/98925608-c148-476f-99bb-221d43389090/IMG_4041.jpeg",
  alt: "Ellen DiFazio’s studio and gallery space at 62 Aarow Road, Studio 62 A, Hilton Head Island, South Carolina",
  caption: "Studio & gallery — 62 Aarow Road, Hilton Head Island, SC",
};

/** Second image in the “meet the artist” band (gallery site image; generic alt) */
export const STUDIO_SECOND: HomePhoto = {
  src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/1610679477998-5G2H6MYKH7XVMXY5WL9S/IMG_3694.JPG",
  alt: "Ellen DiFazio painting in her studio",
  caption: "At work in the studio",
};

export const AWARDS_AND_EXHIBITIONS: HomePhoto[] = [
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/1ecb7186-7010-4693-a172-d67ab084eec9/IMG_4437.jpeg",
    alt: "Second Place — National Biennial Art Competition and Exhibition 2025",
    caption: "Second Place — National Biennial Art Competition and Exhibition 2025",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/26603446-aad1-476f-9ebf-69452cf7b186/IMG_2783.jpeg",
    alt: "The Artists of Sea Pines Gallery exhibit on Hilton Head Island, South Carolina",
    caption: "The Artists of Sea Pines Gallery Exhibit — Hilton Head, South Carolina",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/77a627a4-6c3e-4c8d-91f2-3a706ab08afc/IMG_4509.jpeg",
    alt: "Exhibit at The Montage, Palmetto Bluff, with fellow artist Janet Scarborough",
    caption: "Exhibit at The Montage, Palmetto Bluff",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/9a60b15a-b983-4261-9b80-4ac124db4f8d/IMG_2214.jpeg",
    alt: "Roots of the Low Country exhibit at The Montage, Palmetto Bluff",
    caption: "Roots of the Low Country — The Montage, Palmetto Bluff",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/1610679139857-LAEMWBR0NVGN6OLB4XNL/IMG_4322.jpg",
    alt: "The Brick Art Studio, Stony Brook, New York",
    caption: "The Brick Art Studio — Stony Brook, New York",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/be5c30d2-c9ee-46dc-ad93-eee7af079a05/IMG_1682.jpeg",
    alt: "Featured Artist at The Octagon and the Montage Library exhibit",
    caption: "Featured Artist — The Octagon and the Montage Library Exhibit",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/a1c621ef-ea02-4c6c-a9b5-5e7e0ff5a044/IMG_6120.jpeg",
    alt: "Artwork featured in the Hilton Head Symphony program",
    caption: "Artwork in the Hilton Head Symphony Program",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/cdb6fada-f9f7-4d81-933c-063832f47396/IMG_2337.jpeg",
    alt: "Artwork at The Art Center of Coastal Carolina",
    caption: "The Art Center of Coastal Carolina",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/245754d1-90d2-4686-9530-f550f2d35c38/IMG_4648.jpeg",
    alt: "Solo exhibition Gestures in Nature: The Allure of the Landscape at The Art Center of Coastal Carolina",
    caption: "Gestures in Nature: The Allure of the Landscape — The Art Center of Coastal Carolina",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/1d5eb6ad-37f9-475d-bd5d-851ce91d3965/IMG_9447.jpeg",
    alt: "First Thursday Art Show at Sea Pines Center",
    caption: "First Thursday Art Show — Sea Pines Center",
  },
  {
    src: "https://images.squarespace-cdn.com/content/v1/5ffa5406fcd256339390c52e/8fa3da17-b97c-40ee-93db-d96d1a254e69/FullSizeRender.jpeg",
    alt: "Solo exhibit and demonstration at The Art Center of Coastal Carolina — lecture and demonstration",
    caption: "Solo exhibit and demonstration — The Art Center of Coastal Carolina",
  },
];

/** Shop pieces to feature on the home page (curated variety) */
export const FEATURED_SHOP_SLUGS = [
  "edge-of-sound",
  "marsh-view-4-",
  "through-to-the-river",
  "the-road-to-bolsena",
  "1-cup-creamer",
  "salt-sprout-2d4e7",
] as const;
