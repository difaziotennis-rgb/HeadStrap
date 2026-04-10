/**
 * Hostnames that should serve the art microsite at the URL root (no /art prefix in the browser).
 * Set ART_SITE_HOSTS in Vercel (comma-separated), e.g. edifazioart.net,www.edifazioart.net
 */
export function parseArtSiteHosts(): Set<string> {
  const raw =
    process.env.ART_SITE_HOSTS ||
    "edifazioart.net,www.edifazioart.net";
  return new Set(
    raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isArtSiteHost(hostHeader: string | null): boolean {
  if (!hostHeader) return false;
  const host = hostHeader.split(":")[0]?.toLowerCase() ?? "";
  return parseArtSiteHosts().has(host);
}

/** Main tennis site for redirects when someone hits a non-art path on the art domain. */
export function primarySiteOrigin(): string {
  const u = process.env.NEXT_PUBLIC_PRIMARY_URL?.replace(/\/$/, "") || "https://difaziotennis.com";
  return u;
}
