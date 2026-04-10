/** Press & publications — short list for homepage / about strip. */
export type PressItem = {
  outlet: string;
  headline: string;
  /** Optional year or span */
  year?: string;
  href?: string;
};

export const PRESS_ITEMS: PressItem[] = [
  {
    outlet: "National Biennial Art Competition",
    headline: "Second Place — 2025",
    year: "2025",
  },
  {
    outlet: "CH2 Magazine",
    headline: "Feature coverage",
    year: "—",
  },
  {
    outlet: "Hilton Head Symphony",
    headline: "Annual publication — artwork selected (2022, 2023)",
    year: "2022–23",
  },
  {
    outlet: "Hilton Head Art League Gallery",
    headline: "Featured Artist — Shelter Cove",
    year: "2024",
  },
  {
    outlet: "The Art Center of Coastal Carolina",
    headline: "Solo: Gestures in Nature — The Allure of the Landscape",
    year: "—",
  },
];
