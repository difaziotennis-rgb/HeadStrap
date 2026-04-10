import type { BodyOfWorkSlug } from "./bodies-of-work";
import type { ArtCategory } from "./types";

export function buildArtShopHref(opts: {
  cat?: ArtCategory | "all";
  body?: BodyOfWorkSlug | "all";
}): string {
  const { cat = "all", body = "all" } = opts;
  const p = new URLSearchParams();
  if (cat !== "all") p.set("cat", cat);
  if (body !== "all") p.set("body", body);
  const q = p.toString();
  return `/art/shop${q ? `?${q}` : ""}`;
}
