import { NextResponse } from "next/server";
import { sendS27MemberEmail } from "@/lib/summer27/member-email";

type Body = {
  orderId?: string;
  clientName?: string;
  clientEmail?: string;
  racket?: string;
  stringName?: string;
  tension?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body;
    const email = (body.clientEmail || "").trim();
    const name = (body.clientName || "").trim() || "there";
    if (!email) {
      return NextResponse.json({ error: "Member email required." }, { status: 400 });
    }

    const racket = body.racket || "your racket";
    const stringName = body.stringName || "your string";
    const tension = body.tension
      ? /lbs/i.test(body.tension)
        ? body.tension
        : `${body.tension} lbs`
      : "";
    const detail = [racket, stringName, tension].filter(Boolean).join(" · ");

    const subject = "Racket ready for pickup";
    const text = [
      `Hi ${name},`,
      "",
      "Your restring is ready at the Rhinebeck pro shop.",
      detail,
      "",
      "Pickup during shop hours.",
      "",
      "— Derek",
      "DiFazio Tennis · (631) 901-5220",
    ].join("\n");

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1a1a1a;line-height:1.5;max-width:520px;">
        <p style="margin:0 0 12px;">Hi ${escapeHtml(name)},</p>
        <p style="margin:0 0 12px;">Your restring is ready at the Rhinebeck pro shop.</p>
        <p style="margin:0 0 16px;padding:12px 14px;background:#f7f7f5;border-radius:10px;">${escapeHtml(detail)}</p>
        <p style="margin:0 0 16px;">Pickup during shop hours.</p>
        <p style="margin:0;color:#6b665e;font-size:13px;">Derek · DiFazio Tennis · <a href="tel:6319015220" style="color:#6b665e;">(631) 901-5220</a></p>
      </div>
    `;

    const result = await sendS27MemberEmail({
      to: email,
      subject,
      html,
      text,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Could not send email.", emailed: false },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      emailed: !!result.emailed,
      skipped: result.skipped || null,
      orderId: body.orderId || null,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to notify member.";
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
