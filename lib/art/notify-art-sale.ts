import { sendEmail } from "@/lib/send-email";
import { ART_SITE } from "@/lib/art/site";

import { formatUsd } from "./catalog";

/**
 * Emails the artist when a card purchase completes (via Stripe webhook).
 * Configure Gmail SMTP (GMAIL_USER, GMAIL_APP_PASSWORD) and optional ART_SALE_NOTIFY_EMAIL.
 */
export async function notifyArtSaleEmail(opts: {
  pieceTitle: string;
  pieceSlug: string;
  amountUsd: number;
  customerEmail: string;
  customerName?: string | null;
  sessionId: string;
  paymentIntentId?: string | null;
}): Promise<void> {
  const to = process.env.ART_SALE_NOTIFY_EMAIL?.trim() || ART_SITE.email;
  const subject = `New art sale: ${opts.pieceTitle}`;
  const lines = [
    `A piece sold on ${ART_SITE.siteTitle}.`,
    ``,
    `Work: ${opts.pieceTitle}`,
    `Slug: ${opts.pieceSlug}`,
    `Amount: ${formatUsd(opts.amountUsd)}`,
    `Buyer email: ${opts.customerEmail || "(none provided)"}`,
    opts.customerName ? `Buyer name: ${opts.customerName}` : null,
    `Stripe Checkout session: ${opts.sessionId}`,
    opts.paymentIntentId ? `Payment intent: ${opts.paymentIntentId}` : null,
    ``,
    `Follow up for shipping (shipping is arranged separately).`,
  ].filter(Boolean) as string[];

  const text = lines.join("\n");
  const html = `<p style="font-family:Georgia,serif;font-size:15px;line-height:1.6;color:#1a1a1a;">${lines
    .map((l) => (l === "" ? "<br/>" : `<div>${escapeHtml(l)}</div>`))
    .join("")}</p>`;

  const result = await sendEmail({
    to,
    subject,
    html,
    text,
    replyTo: opts.customerEmail || undefined,
  });

  if (!result.success) {
    console.error("[art sale notify]", result.error);
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
