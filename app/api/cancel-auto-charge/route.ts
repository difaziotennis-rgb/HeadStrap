import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function POST(request: Request) {
  try {
    const { bookingId } = await request.json();

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing booking ID" },
        { status: 400 }
      );
    }

    const supabase = getBookingServerClient();

    // Check if booking exists and hasn't been charged yet
    const { data: booking, error: fetchErr } = await supabase
      .from("bookings")
      .select("id, client_name, payment_status, auto_charge_cancelled")
      .eq("id", bookingId)
      .single();

    if (fetchErr || !booking) {
      return NextResponse.json(
        { error: "Booking not found" },
        { status: 404 }
      );
    }

    if (booking.payment_status === "paid") {
      return NextResponse.json(
        { error: "This booking has already been charged", alreadyPaid: true },
        { status: 400 }
      );
    }

    if (booking.auto_charge_cancelled) {
      return NextResponse.json({
        success: true,
        alreadyCancelled: true,
        message: "Auto-charge was already cancelled",
      });
    }

    // Cancel the auto-charge
    const { error: updateErr } = await supabase
      .from("bookings")
      .update({ auto_charge_cancelled: true })
      .eq("id", bookingId);

    if (updateErr) {
      console.error("Failed to cancel auto-charge:", updateErr);
      return NextResponse.json(
        { error: "Failed to cancel auto-charge" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Auto-charge cancelled for ${booking.client_name || "client"}`,
    });
  } catch (error: any) {
    console.error("Error cancelling auto-charge:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel" },
      { status: 500 }
    );
  }
}
