import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";
import { sendEmail } from "@/lib/send-email";
import {
  courtUnavailableEmail,
  adminDeclineConfirmationEmail,
} from "@/lib/email-templates";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

// Decode the booking token
function decodeBookingToken(token: string): Booking | null {
  try {
    const data = Buffer.from(token, "base64url").toString("utf-8");
    return JSON.parse(data) as Booking;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing booking token" },
        { status: 400 }
      );
    }

    const booking = decodeBookingToken(token);

    if (!booking) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      );
    }

    const adminEmail = "difaziotennis@gmail.com";

    // Fetch upcoming available (unbooked) time slots from Supabase
    const supabase = getBookingServerClient();
    const today = new Date().toISOString().split("T")[0];

    const { data: slots } = await supabase
      .from("time_slots")
      .select("date, hour")
      .eq("available", true)
      .eq("booked", false)
      .gte("date", today)
      .order("date", { ascending: true })
      .order("hour", { ascending: true })
      .limit(20);

    // Filter out the declined slot itself and pick up to 5 alternatives
    const alternatives = (slots || [])
      .filter(
        (s: { date: string; hour: number }) =>
          !(s.date === booking.date && s.hour === booking.hour)
      )
      .slice(0, 5);

    // Send apology + alternatives email to the client
    const clientEmail = courtUnavailableEmail(booking, alternatives);
    const clientResult = await sendEmail({
      to: booking.clientEmail,
      subject: clientEmail.subject,
      html: clientEmail.html,
      text: clientEmail.text,
    });

    // Send confirmation to admin
    const adminEmailContent = adminDeclineConfirmationEmail(
      booking,
      alternatives
    );
    const adminResult = await sendEmail({
      to: adminEmail,
      subject: adminEmailContent.subject,
      html: adminEmailContent.html,
      text: adminEmailContent.text,
    });

    return NextResponse.json({
      success: true,
      booking,
      alternativesOffered: alternatives.length,
      emailsSent: {
        client: clientResult.success,
        admin: adminResult.success,
      },
      message: "Client notified with alternative times",
    });
  } catch (error: any) {
    console.error("Error declining booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to decline booking" },
      { status: 500 }
    );
  }
}
