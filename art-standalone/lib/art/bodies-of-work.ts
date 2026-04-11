/** Three collection focuses (aligned with Ellen’s categories). */
export type BodyOfWorkSlug = "all" | "marsh-tide" | "photography" | "ceramics";

export type BodyOfWork = {
  slug: Exclude<BodyOfWorkSlug, "all">;
  title: string;
  shortTitle: string;
  blurb: string;
};

export const BODIES_OF_WORK: BodyOfWork[] = [
  {
    slug: "marsh-tide",
    title: "Marsh, Lowcountry & tide",
    shortTitle: "Marsh, Lowcountry & tide",
    blurb: "Oil and acrylic paintings—marshes, dunes, coast, gardens, portraits, and studio work.",
  },
  {
    slug: "photography",
    title: "Photography",
    shortTitle: "Photography",
    blurb: "Prints from Italy and the Lowcountry.",
  },
  {
    slug: "ceramics",
    title: "Ceramics",
    shortTitle: "Ceramics",
    blurb: "Hand-built studio ceramics.",
  },
];

export function getBodyOfWorkMeta(slug: Exclude<BodyOfWorkSlug, "all">): BodyOfWork {
  const b = BODIES_OF_WORK.find((x) => x.slug === slug);
  if (!b) throw new Error(`Unknown body: ${slug}`);
  return b;
}
