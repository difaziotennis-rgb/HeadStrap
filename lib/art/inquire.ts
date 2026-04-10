import { ART_SITE } from "./site";

function pieceUrl(slug: string): string {
  return `${ART_SITE.publicBaseUrl}/art/shop/${slug}`;
}

export function buildInquireMailto(opts: { subject: string; body?: string }): string {
  const { subject, body = "" } = opts;
  const params = new URLSearchParams();
  params.set("subject", subject);
  if (body) params.set("body", body);
  return `${ART_SITE.emailHref}?${params.toString()}`;
}

/** Inquiry about a specific artwork (available or sold). */
export function inquireAboutPieceMailto(pieceTitle: string, slug: string): string {
  return buildInquireMailto({
    subject: `Inquiry: ${pieceTitle}`,
    body: `Hello,\n\nI'm writing about "${pieceTitle}"\n${pieceUrl(slug)}\n\n`,
  });
}

/** General studio inquiry (commissions, shipping, studio visits). */
export function inquireStudioMailto(): string {
  return buildInquireMailto({
    subject: "Studio inquiry — E. DiFazio Art",
    body: "Hello,\n\nI'd like to ask about:\n\n",
  });
}
