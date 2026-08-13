import { NextResponse } from "next/server";

/**
 * Validate director desk password.
 * Set S27_ADMIN_PASSWORD in Vercel. Until then, defaults to a non-production placeholder.
 */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { password?: string };
    const provided = String(body.password || "");
    const expected = process.env.S27_ADMIN_PASSWORD?.trim() || "";

    if (!expected) {
      // Preview / pre-Stripe: allow classic demo passwords so you can still open the desk.
      const demoOk = provided === "admin" || provided === "admin123";
      if (!demoOk) {
        return NextResponse.json(
          { ok: false, error: "Set S27_ADMIN_PASSWORD in Vercel for production admin access." },
          { status: 401 }
        );
      }
      return NextResponse.json({ ok: true, mode: "demo" });
    }

    if (provided !== expected) {
      return NextResponse.json({ ok: false, error: "Incorrect password." }, { status: 401 });
    }
    return NextResponse.json({ ok: true, mode: "live" });
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
}
