import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";
import { getBookingServerClient } from "@/lib/supabase/booking-server";
import { sendEmail } from "@/lib/send-email";

type BookingRequestBody = {
  booking?: Booking;
};

function isValidBooking(input: unknown): input is Booking {
  if (!input || typeof input !== "object") return false;
  const booking = input as Booking;
  return (
    typeof booking.id === "string" &&
    typeof booking.timeSlotId === "string" &&
    typeof booking.date === "string" &&
    typeof booking.hour === "number" &&
    typeof booking.clientEmail === "string" &&
    typeof booking.status === "string" &&
    typeof booking.createdAt === "string" &&
    typeof booking.amount === "number"
  );
}

function formatTime(hour: number): string {
  const whole = Math.floor(hour);
  const mins = Math.round((hour - whole) * 60);
  const h12 = whole === 0 ? 12 : whole > 12 ? whole - 12 : whole;
  return `${h12}:${String(mins).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as BookingRequestBody;
    if (!isValidBooking(body.booking)) {
      return NextResponse.json({ error: "Invalid booking payload." }, { status: 400 });
    }

    const booking = body.booking;
    const supabase = getBookingServerClient();

    // Prevent duplicate pending requests for the same slot.
    const { data: existingForSlot, error: existingError } = await supabase
      .from("bookings")
      .select("id,status")
      .eq("time_slot_id", booking.timeSlotId)
      .in("status", ["pending", "confirmed"])
      .limit(1);

    if (existingError) {
      return NextResponse.json({ error: "Could not validate slot availability." }, { status: 500 });
    }

    if ((existingForSlot ?? []).length > 0) {
      return NextResponse.json(
        { error: "That lesson time was just requested. Please choose another slot." },
        { status: 409 }
      );
    }

    const row = {
      id: booking.id,
      time_slot_id: booking.timeSlotId,
      date: booking.date,
      hour: booking.hour,
      client_name: booking.clientName || "Guest",
      client_email: booking.clientEmail,
      client_phone: booking.clientPhone || null,
      status: "pending",
      created_at: booking.createdAt,
      payment_status: booking.paymentStatus || "pending",
      amount: booking.amount,
      member_code: booking.memberCode || null,
      member_id: booking.memberId || null,
    };

    const { error: upsertError } = await supabase
      .from("bookings")
      .upsert(row, { onConflict: "id" });

    if (upsertError) {
      return NextResponse.json({ error: "Failed to save booking request." }, { status: 500 });
    }

    // Best-effort admin notification (request still succeeds if email is not configured).
    const date = new Date(`${booking.date}T12:00:00`).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const time = formatTime(booking.hour);
    await sendEmail({
      to: "difaziotennis@gmail.com",
      subject: `New Lesson Request: ${booking.clientName || "Guest"} - ${date} at ${time}`,
      html: `
        <p>New lesson request received.</p>
        <p><strong>Client:</strong> ${booking.clientName || "Guest"}</p>
        <p><strong>Email:</strong> ${booking.clientEmail}</p>
        <p><strong>Phone:</strong> ${booking.clientPhone || "Not provided"}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>Amount:</strong> $${booking.amount}</p>
      `,
      text: [
        "New lesson request received.",
        `Client: ${booking.clientName || "Guest"}`,
        `Email: ${booking.clientEmail}`,
        `Phone: ${booking.clientPhone || "Not provided"}`,
        `Date: ${date}`,
        `Time: ${time}`,
        `Amount: $${booking.amount}`,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to submit booking request.", details: String(error) },
      { status: 500 }
    );
  }
}

