import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";
import { getBookingServerClient } from "@/lib/supabase/booking-server";
import { sendEmail } from "@/lib/send-email";
import { adminCancellationEmail } from "@/lib/email-templates";

type CancellationToken = {
  bookingId?: string;
  timeSlotId?: string;
  date?: string;
  hour?: number;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  amount?: number;
};

function decodeCancellationToken(token: string): CancellationToken | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf-8");
    const parsed = JSON.parse(json) as CancellationToken;
    return parsed;
  } catch {
    return null;
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(hour: number): string {
  const whole = Math.floor(hour);
  const mins = Math.round((hour - whole) * 60);
  const h12 = whole === 0 ? 12 : whole > 12 ? whole - 12 : whole;
  return `${h12}:${String(mins).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function renderResultPage(title: string, body: string, isSuccess: boolean): string {
  const tagBg = isSuccess ? "#e8f5e1" : "#fef3c7";
  const tagText = isSuccess ? "#2d5016" : "#92400e";
  const tag = isSuccess ? "Complete" : "Needs Attention";
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; background: #f7f7f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; }
    .wrap { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; }
    .card { width: 100%; max-width: 540px; background: #fff; border: 1px solid #ece8e2; border-radius: 14px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
    .head { padding: 28px 28px 22px; border-bottom: 1px solid #f0ede8; }
    .brand { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8477; margin-bottom: 8px; }
    h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.01em; }
    .tag { display: inline-block; margin-top: 10px; padding: 4px 10px; border-radius: 99px; font-size: 11px; letter-spacing: 0.06em; text-transform: uppercase; background: ${tagBg}; color: ${tagText}; }
    .body { padding: 24px 28px; font-size: 14px; line-height: 1.7; color: #4a4a4a; }
    .foot { padding: 18px 28px; border-top: 1px solid #f0ede8; text-align: center; font-size: 11px; color: #b0a99f; }
    a { color: #2d5016; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <div class="head">
        <div class="brand">DiFazio Tennis</div>
        <h1>${title}</h1>
        <div class="tag">${tag}</div>
      </div>
      <div class="body">${body}</div>
      <div class="foot">Rhinebeck, NY &middot; <a href="mailto:difaziotennis@gmail.com">difaziotennis@gmail.com</a></div>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new NextResponse(
      renderResultPage("Cancellation Link Invalid", "This cancellation link is missing required information.", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const decoded = decodeCancellationToken(token);
  if (!decoded) {
    return new NextResponse(
      renderResultPage("Cancellation Link Invalid", "This cancellation link could not be verified.", false),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  try {
    const supabase = getBookingServerClient();
    let bookingRow: any = null;

    if (decoded.bookingId) {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", decoded.bookingId)
        .maybeSingle();
      bookingRow = data;
    }

    const date = bookingRow?.date || decoded.date || "";
    const hour = bookingRow?.hour ?? decoded.hour;
    const slotId = bookingRow?.time_slot_id || decoded.timeSlotId || (date && typeof hour === "number" ? `${date}-${hour}` : "");

    if (bookingRow?.status === "cancelled") {
      const when = date && typeof hour === "number" ? `${formatDate(date)} at ${formatTime(hour)}` : "this lesson time";
      return new NextResponse(
        renderResultPage("Lesson Already Cancelled", `This lesson has already been cancelled for ${when}.`, true),
        { headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    if (decoded.bookingId) {
      await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", decoded.bookingId);
    }

    if (date && typeof hour === "number" && slotId) {
      await supabase.from("time_slots").upsert(
        {
          id: slotId,
          date,
          hour,
          available: true,
          booked: false,
          booked_by: null,
          booked_email: null,
          booked_phone: null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
    }

    const bookingForEmail: Booking = {
      id: decoded.bookingId || bookingRow?.id || "unknown",
      timeSlotId: slotId || "unknown",
      date,
      hour: typeof hour === "number" ? hour : 0,
      clientName: bookingRow?.client_name || decoded.clientName || "Not provided",
      clientEmail: bookingRow?.client_email || decoded.clientEmail || "Not provided",
      clientPhone: bookingRow?.client_phone || decoded.clientPhone || "Not provided",
      status: "cancelled",
      createdAt: bookingRow?.created_at || new Date().toISOString(),
      paymentStatus: bookingRow?.payment_status || "pending",
      amount: Number(bookingRow?.amount ?? decoded.amount ?? 0),
    };

    const adminEmail = adminCancellationEmail(bookingForEmail);
    await sendEmail({
      to: "difaziotennis@gmail.com",
      subject: adminEmail.subject,
      html: adminEmail.html,
      text: adminEmail.text,
    });

    const lessonWhen =
      date && typeof hour === "number"
        ? `<strong>${formatDate(date)} at ${formatTime(hour)}</strong>`
        : "your scheduled lesson";

    return new NextResponse(
      renderResultPage(
        "Lesson Cancelled",
        `Your lesson for ${lessonWhen} has been cancelled.<br><br>The schedule has been updated automatically and Coach Derek has been notified.`,
        true
      ),
      { headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  } catch (error) {
    console.error("[cancel-booking] Failed to cancel booking:", error);
    return new NextResponse(
      renderResultPage(
        "Cancellation Error",
        "We could not process this cancellation right now. Please email difaziotennis@gmail.com and include your lesson date/time.",
        false
      ),
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
