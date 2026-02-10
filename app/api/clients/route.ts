import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

// PUT - Update client info across all their bookings and time slots
export async function PUT(request: Request) {
  try {
    const { originalName, name, email, phone } = await request.json();

    if (!originalName) {
      return NextResponse.json({ error: "Original name required" }, { status: 400 });
    }

    const supabase = getBookingServerClient();

    // Update bookings
    const { error: bookingErr } = await supabase
      .from("bookings")
      .update({
        client_name: name,
        client_email: email,
        client_phone: phone,
      })
      .ilike("client_name", originalName);

    if (bookingErr) {
      console.error("Failed to update bookings:", bookingErr);
    }

    // Update time slots
    const { error: slotErr } = await supabase
      .from("time_slots")
      .update({
        booked_by: name,
        booked_email: email,
        booked_phone: phone,
      })
      .ilike("booked_by", originalName);

    if (slotErr) {
      console.error("Failed to update time slots:", slotErr);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Remove client from all bookings and time slots (clears their info)
export async function DELETE(request: Request) {
  try {
    const { name } = await request.json();

    if (!name) {
      return NextResponse.json({ error: "Client name required" }, { status: 400 });
    }

    const supabase = getBookingServerClient();

    // Clear client info from time slots (unbook them)
    await supabase
      .from("time_slots")
      .update({
        booked: false,
        booked_by: null,
        booked_email: null,
        booked_phone: null,
      })
      .ilike("booked_by", name);

    // Delete their bookings
    await supabase
      .from("bookings")
      .delete()
      .ilike("client_name", name);

    // Delete their recurring lessons
    await supabase
      .from("recurring_lessons")
      .delete()
      .ilike("client_name", name);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
