import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/send-email";

type Item = { kind?: string; label?: string; amount?: number };

type Body = {
  email?: string;
  name?: string;
  date?: string;
  windowLabel?: string;
  items?: Item[];
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = (body.email || "").trim();
    const name = (body.name || "").trim() || "there";
    const date = (body.date || "").trim();
    const windowLabel = (body.windowLabel || "").trim();
    if (!email) {
      return NextResponse.json({ error: "Email required." }, { status: 400 });
    }

    const items = Array.isArray(body.items) ? body.items : [];
    const lines = items.map((item) => {
      const label = item.label || item.kind || "Booking";
      const amount = typeof item.amount === "number" ? ` · $${item.amount}` : "";
      return `• ${label}${amount}`;
    });

    const when = [date, windowLabel && windowLabel !== "all day" ? windowLabel : ""]
      .filter(Boolean)
      .join(" · ");
    const whenBit = when ? ` on ${when}` : windowLabel === "all day" && date ? ` on ${date}` : "";

    const subject = "Weather cancellation — DiFazio Tennis at Rhinebeck";
    const text = [
      `Hi ${name},`,
      "",
      `Courts 3 & 4 are unplayable due to weather${whenBit}.`,
      "Your booking(s) below are cancelled. You’ll receive a refund (or a free reschedule) — no action needed.",
      "",
      ...(lines.length ? lines : ["• Your session"]),
      "",
      "Sorry for the scramble — we’ll see you next fair day.",
      "",
      "— Derek DiFazio",
      "DiFazio Tennis · (631) 901-5220",
    ].join("\n");

    const listHtml = lines.length
      ? `<ul style="margin:0 0 16px;padding-left:18px;">${lines
          .map((l) => `<li style="margin:0 0 4px;">${escapeHtml(l.replace(/^•\s*/, ""))}</li>`)
          .join("")}</ul>`
      : `<p style="margin:0 0 16px;">Your session for that day.</p>`;

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.5;max-width:520px;">
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px;">Courts 3 &amp; 4 are <strong>unplayable due to weather</strong>${
          whenBit ? ` <strong>${escapeHtml(whenBit.trim())}</strong>` : ""
        }.</p>
        <p style="margin:0 0 12px;">Your booking(s) are cancelled. You’ll get a <strong>refund</strong> (or we can reschedule) — nothing you need to do.</p>
        ${listHtml}
        <p style="margin:0 0 20px;">Sorry for the scramble — see you next fair day.</p>
        <p style="margin:0;color:#6b665e;font-size:13px;">Derek DiFazio · DiFazio Tennis · <a href="tel:6319015220" style="color:#6b665e;">(631) 901-5220</a></p>
      </div>
    `;

    const result = await sendEmail({
      to: email,
      subject,
      html,
      text,
      replyTo: "difaziotennis@gmail.com",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Could not send email.", emailed: false },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, emailed: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to notify.";
    return NextResponse.json({ error: message, emailed: false }, { status: 500 });
  }
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
