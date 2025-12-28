import { NextResponse } from "next/server";
import { timeSlots, bookings } from "@/lib/mock-data";

export async function GET() {
  try {
    const allBookings = Array.from(bookings.values());
    const bookedSlots = Array.from(timeSlots.values()).filter(s => s.booked);
    
    // Group bookings by date
    const bookingsByDate: Record<string, any[]> = {};
    allBookings.forEach(booking => {
      if (!bookingsByDate[booking.date]) {
        bookingsByDate[booking.date] = [];
      }
      bookingsByDate[booking.date].push({
        hour: booking.hour,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
      });
    });

    return NextResponse.json({
      success: true,
      totalBookings: allBookings.length,
      totalBookedSlots: bookedSlots.length,
      bookingsByDate,
      allBookings: allBookings.map(b => ({
        id: b.id,
        date: b.date,
        time: `${b.hour}:00`,
        client: b.clientName,
        email: b.clientEmail,
        phone: b.clientPhone,
        status: b.status,
        paymentStatus: b.paymentStatus,
        amount: b.amount,
      })),
      bookedSlots: bookedSlots.map(s => ({
        id: s.id,
        date: s.date,
        hour: s.hour,
        bookedBy: s.bookedBy,
        bookedEmail: s.bookedEmail,
      })),
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}









