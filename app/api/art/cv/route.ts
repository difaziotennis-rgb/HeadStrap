import { NextResponse } from "next/server";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import { ART_SITE } from "@/lib/art/site";
import { EDUCATION_LIST, EXHIBITIONS_HIGHLIGHTS } from "@/lib/art/site";

export const dynamic = "force-dynamic";

function wrapLine(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxLen) cur = next;
    else {
      if (cur) lines.push(cur);
      cur = w.length > maxLen ? w.slice(0, maxLen) : w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

export async function GET() {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const pageW = 612;
  const pageH = 792;
  const margin = 54;
  const maxChars = 72;
  const fontSize = 9.5;
  const titleSize = 13;
  const sectionSize = 10;
  const lineH = 12;

  const lines: { text: string; bold?: boolean; size?: number; gap?: number }[] = [
    { text: "Ellen DiFazio", bold: true, size: titleSize, gap: 6 },
    { text: "Painter · Hilton Head Island, South Carolina", size: fontSize, gap: 4 },
    { text: `${ART_SITE.studioLine} · ${ART_SITE.studioCity}`, size: fontSize, gap: 2 },
    { text: ART_SITE.email, size: fontSize, gap: 14 },
    {
      text: "Semi-abstract landscapes in oil and acrylic, rooted in the Lowcountry—marsh, tide, garden, and coast.",
      size: fontSize,
      gap: 14,
    },
    { text: "Education & professional", bold: true, size: sectionSize, gap: 6 },
  ];

  for (const row of EDUCATION_LIST) {
    for (const ln of wrapLine(row, maxChars)) {
      lines.push({ text: `• ${ln}`, size: fontSize, gap: 2 });
    }
    lines.push({ text: "", gap: 4 });
  }

  lines.push({ text: "Selected exhibitions & recognition", bold: true, size: sectionSize, gap: 8 });

  for (const row of EXHIBITIONS_HIGHLIGHTS) {
    for (const ln of wrapLine(row, maxChars)) {
      lines.push({ text: `• ${ln}`, size: fontSize, gap: 2 });
    }
    lines.push({ text: "", gap: 4 });
  }

  lines.push({ text: `Portfolio: ${ART_SITE.publicBaseUrl}/art`, size: fontSize, gap: 8 });
  lines.push({
    text: `Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`,
    size: 8,
    gap: 0,
  });

  let page = pdf.addPage([pageW, pageH]);
  /** Baseline Y from bottom (pdf-lib coordinates). */
  let baseline = pageH - margin - 4;

  for (const item of lines) {
    const size = item.size ?? fontSize;
    const f = item.bold ? fontBold : font;
    const t = item.text;
    if (!t) {
      baseline -= item.gap ?? 0;
      continue;
    }
    if (baseline < margin + 24) {
      page = pdf.addPage([pageW, pageH]);
      baseline = pageH - margin - 4;
    }
    page.drawText(t, {
      x: margin,
      y: baseline,
      size,
      font: f,
      color: rgb(0.12, 0.13, 0.14),
    });
    baseline -= lineH + (item.gap ?? 0);
  }

  const bytes = await pdf.save();
  return new NextResponse(Buffer.from(bytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="Ellen-DiFazio-CV.pdf"',
      "Cache-Control": "private, max-age=3600",
    },
  });
}
