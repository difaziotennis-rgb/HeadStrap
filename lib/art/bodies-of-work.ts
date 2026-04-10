/** Curated “bodies of work” for the collection (paintings + travel + media). */
export type BodyOfWorkSlug =
  | "all"
  | "marsh-tide"
  | "garden-light"
  | "italy-europe"
  | "commissions"
  | "photography"
  | "ceramics";

export type BodyOfWork = {
  slug: Exclude<BodyOfWorkSlug, "all">;
  title: string;
  shortTitle: string;
  blurb: string;
};

export const BODIES_OF_WORK: BodyOfWork[] = [
  {
    slug: "marsh-tide",
    title: "Marsh & tide",
    shortTitle: "Marsh",
    blurb: "Lowcountry marshes, dunes, rivers, and paths—where the land meets water and light.",
  },
  {
    slug: "garden-light",
    title: "Garden, flora & light",
    shortTitle: "Garden",
    blurb: "Botanicals, pampas, color studies, and quieter canvases where light leads the composition.",
  },
  {
    slug: "italy-europe",
    title: "Italy & Europe",
    shortTitle: "Europe",
    blurb: "Paintings from travel—Tuscany, Bolsena, Ireland, and the English countryside.",
  },
  {
    slug: "commissions",
    title: "Portraits & commissions",
    shortTitle: "Commissions",
    blurb: "Personal pieces, portraits, and studio commissions.",
  },
  {
    slug: "photography",
    title: "Photography",
    shortTitle: "Photo",
    blurb: "Small-format prints from Italy and the Lowcountry.",
  },
  {
    slug: "ceramics",
    title: "Ceramics",
    shortTitle: "Ceramics",
    blurb: "Hand-built studio ceramics.",
  },
];

/** Explicit map so every catalog piece resolves consistently. */
export const PIECE_BODY_BY_SLUG: Record<string, Exclude<BodyOfWorkSlug, "all">> = {
  "edge-of-sound": "garden-light",
  "where-light-rests": "garden-light",
  "serenity-in-blue-abstract-landscape-painting": "garden-light",
  "autumn-in-the-marsh": "marsh-tide",
  "morning-waves-in-marsh": "marsh-tide",
  "early-spring-marsh-1": "marsh-tide",
  "misty-morning": "marsh-tide",
  xc31bcqfe5yrolf6p5bte6d441nupt: "garden-light",
  "marsh-transformation": "marsh-tide",
  "small-pampas-1-and-2": "garden-light",
  "beyond-the-trees-tuscanny": "italy-europe",
  "marsh-view-4-": "marsh-tide",
  "may-river-inlet": "marsh-tide",
  "delicate-low-country-view": "marsh-tide",
  dstgbvjsr2slfcrd4mzccr47c9k8fh: "marsh-tide",
  i01kce5w5smyxxcf43reoxzxypvjg6: "garden-light",
  "hilton-head-pampas": "marsh-tide",
  "through-to-the-river": "marsh-tide",
  l470h1vzqnyzy6vgqnhlt4ui5aprkm: "garden-light",
  hqtt3v5p2paszs9raq1zyh7ejgrm29: "garden-light",
  "2tawyfdzaiitx5838hy4qj76yv29vb": "italy-europe",
  arju7nv7enzvemiwhpuo3svipm5pfk: "italy-europe",
  v82heknh8d95jcq1aaqokrvk8r1s7z: "garden-light",
  "marsh-view-2": "marsh-tide",
  c5lr6ati483g5wlnxpyekx335rom6k: "marsh-tide",
  "abstract-marsh": "marsh-tide",
  "julies-beach-path": "marsh-tide",
  "the-road-to-bolsena": "photography",
  "golden-blush-cup-clayk": "marsh-tide",
  "salt-sprout-2d4e7": "italy-europe",
  "for-christine": "commissions",
  "kims-irish-cottage-by-the-sea": "italy-europe",
  "landcaster-barn": "italy-europe",
  "miss-potter": "commissions",
  kobe: "commissions",
  "catherines-sparky": "commissions",
  "4sijvswc06l1k65sm7xt587ugog1nr": "photography",
  jgmjrxjx5214njra9nfa3a6c46ltba: "photography",
  q13z3ehsn7f9u9ss2d11g3dprd6ua8: "photography",
  djn0ah6k9lsks5nebfsbtr5wyj3aji: "photography",
  itwx1g0w12hn42ahy9rji0hbuaqi2s: "photography",
  n48coywsyqud00witrkn38huh40dtk: "photography",
  nass8vhydofw3e9t2p32ldqoialpg2: "photography",
  cjjz1kb0i5u8pjafehpo3dwf6ffexf: "photography",
  ngequ0rh2ltc1atxdfdsibmzg1dcbv: "photography",
  "1-cup-creamer": "ceramics",
};

export function getBodyOfWorkSlugForPieceSlug(slug: string): Exclude<BodyOfWorkSlug, "all"> {
  return PIECE_BODY_BY_SLUG[slug] ?? "garden-light";
}

export function getBodyOfWorkMeta(slug: Exclude<BodyOfWorkSlug, "all">): BodyOfWork {
  const b = BODIES_OF_WORK.find((x) => x.slug === slug);
  if (!b) throw new Error(`Unknown body: ${slug}`);
  return b;
}
