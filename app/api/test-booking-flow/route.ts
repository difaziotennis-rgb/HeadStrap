import { NextResponse } from "next/server";
import { timeSlots, bookings, initializeMockData } from "@/lib/mock-data";
import { Booking, TimeSlot } from "@/lib/types";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

export async function POST() {
  try {
    initializeMockData();
    
    const results: string[] = [];
    results.push("🧪 Testing Booking Flow...\n");

    // Test 1: Make a slot available
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const slot1Id = `${tomorrowStr}-10`;

    let slot1 = timeSlots.get(slot1Id);
    if (!slot1) {
      slot1 = {
        id: slot1Id,
        date: tomorrowStr,
        hour: 10,
        available: true,
        booked: false,
      };
      timeSlots.set(slot1Id, slot1);
    } else {
      slot1.available = true;
      slot1.booked = false;
      timeSlots.set(slot1Id, slot1);
    }
    results.push(`✅ Test 1: Made slot available - ${tomorrowStr} at 10 AM`);

    // Test 2: Book the slot
    const booking1: Booking = {
      id: `booking-${Date.now()}-1`,
      timeSlotId: slot1Id,
      date: tomorrowStr,
      hour: 10,
      clientName: "Test Client 1",
      clientEmail: "test1@example.com",
      clientPhone: "(845) 555-1111",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: PAYMENT_CONFIG.lessonRate,
    };
    bookings.set(booking1.id, booking1);
    slot1.booked = true;
    slot1.bookedBy = booking1.clientName;
    slot1.bookedEmail = booking1.clientEmail;
    slot1.bookedPhone = booking1.clientPhone;
    timeSlots.set(slot1Id, slot1);
    results.push(`✅ Test 2: Booked slot - ${booking1.clientName}`);

    // Test 3: Make another slot available and book it
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const slot2Id = `${nextWeekStr}-14`;

    let slot2 = timeSlots.get(slot2Id);
    if (!slot2) {
      slot2 = {
        id: slot2Id,
        date: nextWeekStr,
        hour: 14,
        available: true,
        booked: false,
      };
      timeSlots.set(slot2Id, slot2);
    } else {
      slot2.available = true;
      slot2.booked = false;
      timeSlots.set(slot2Id, slot2);
    }

    const booking2: Booking = {
      id: `booking-${Date.now()}-2`,
      timeSlotId: slot2Id,
      date: nextWeekStr,
      hour: 14,
      clientName: "Test Client 2",
      clientEmail: "test2@example.com",
      clientPhone: "(845) 555-2222",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: PAYMENT_CONFIG.lessonRate,
    };
    bookings.set(booking2.id, booking2);
    slot2.booked = true;
    slot2.bookedBy = booking2.clientName;
    slot2.bookedEmail = booking2.clientEmail;
    slot2.bookedPhone = booking2.clientPhone;
    timeSlots.set(slot2Id, slot2);
    results.push(`✅ Test 3: Booked second slot - ${booking2.clientName}`);

    // Test 4: Make a slot available but don't book it (for testing)
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const twoWeeksStr = twoWeeks.toISOString().split('T')[0];
    const slot3Id = `${twoWeeksStr}-16`;

    let slot3 = timeSlots.get(slot3Id);
    if (!slot3) {
      slot3 = {
        id: slot3Id,
        date: twoWeeksStr,
        hour: 16,
        available: true,
        booked: false,
      };
      timeSlots.set(slot3Id, slot3);
    } else {
      slot3.available = true;
      slot3.booked = false;
      timeSlots.set(slot3Id, slot3);
    }
    results.push(`✅ Test 4: Made slot available (not booked) - ${twoWeeksStr} at 4 PM`);

    // Verification
    const totalBookings = bookings.size;
    const bookedSlots = Array.from(timeSlots.values()).filter(s => s.booked).length;
    const availableSlots = Array.from(timeSlots.values()).filter(s => s.available && !s.booked).length;

    results.push(`\n📊 Verification:`);
    results.push(`   Total bookings: ${totalBookings}`);
    results.push(`   Booked slots: ${bookedSlots}`);
    results.push(`   Available slots: ${availableSlots}`);

    // Verify bookings
    results.push(`\n📋 Bookings created:`);
    bookings.forEach((booking, id) => {
      results.push(`   - ${id}: ${booking.clientName} on ${booking.date} at ${booking.hour}:00`);
    });

    return NextResponse.json({
      success: true,
      message: results.join('\n'),
      bookings: Array.from(bookings.values()).map(b => ({
        id: b.id,
        date: b.date,
        hour: b.hour,
        clientName: b.clientName,
        clientEmail: b.clientEmail,
      })),
      stats: {
        totalBookings,
        bookedSlots,
        availableSlots,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}









