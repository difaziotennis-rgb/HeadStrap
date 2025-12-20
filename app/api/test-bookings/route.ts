import { NextResponse } from "next/server";
import { timeSlots, bookings, initializeMockData } from "@/lib/mock-data";
import { Booking, TimeSlot } from "@/lib/types";

export async function POST() {
  try {
    // Initialize data
    initializeMockData();

    const results: string[] = [];
    results.push("🧪 Starting Booking Tests...\n");

    // Test 1: Book tomorrow at 10 AM
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const slot1Id = `${tomorrowStr}-10`;

    const slot1 = timeSlots.get(slot1Id) || {
      id: slot1Id,
      date: tomorrowStr,
      hour: 10,
      available: true,
      booked: false,
    };
    timeSlots.set(slot1Id, slot1);

    const booking1: Booking = {
      id: `booking-${Date.now()}-1`,
      timeSlotId: slot1Id,
      date: tomorrowStr,
      hour: 10,
      clientName: "John Smith",
      clientEmail: "john.smith@email.com",
      clientPhone: "(845) 555-1234",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: 160,
    };
    bookings.set(booking1.id, booking1);
    slot1.booked = true;
    slot1.bookedBy = booking1.clientName;
    slot1.bookedEmail = booking1.clientEmail;
    slot1.bookedPhone = booking1.clientPhone;
    timeSlots.set(slot1Id, slot1);
    results.push(`✅ Test 1: Booked ${tomorrowStr} at 10 AM for John Smith`);

    // Test 2: Book next week at 2 PM
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    const slot2Id = `${nextWeekStr}-14`;

    const slot2 = timeSlots.get(slot2Id) || {
      id: slot2Id,
      date: nextWeekStr,
      hour: 14,
      available: true,
      booked: false,
    };
    timeSlots.set(slot2Id, slot2);

    const booking2: Booking = {
      id: `booking-${Date.now()}-2`,
      timeSlotId: slot2Id,
      date: nextWeekStr,
      hour: 14,
      clientName: "Sarah Johnson",
      clientEmail: "sarah.j@email.com",
      clientPhone: "(845) 555-5678",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: 160,
    };
    bookings.set(booking2.id, booking2);
    slot2.booked = true;
    slot2.bookedBy = booking2.clientName;
    slot2.bookedEmail = booking2.clientEmail;
    slot2.bookedPhone = booking2.clientPhone;
    timeSlots.set(slot2Id, slot2);
    results.push(`✅ Test 2: Booked ${nextWeekStr} at 2 PM for Sarah Johnson`);

    // Test 3: Book 2 weeks from now at 5 PM
    const twoWeeks = new Date();
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    const twoWeeksStr = twoWeeks.toISOString().split('T')[0];
    const slot3Id = `${twoWeeksStr}-17`;

    const slot3 = timeSlots.get(slot3Id) || {
      id: slot3Id,
      date: twoWeeksStr,
      hour: 17,
      available: true,
      booked: false,
    };
    timeSlots.set(slot3Id, slot3);

    const booking3: Booking = {
      id: `booking-${Date.now()}-3`,
      timeSlotId: slot3Id,
      date: twoWeeksStr,
      hour: 17,
      clientName: "Michael Chen",
      clientEmail: "m.chen@email.com",
      clientPhone: "(845) 555-9012",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "paid",
      amount: 160,
    };
    bookings.set(booking3.id, booking3);
    slot3.booked = true;
    slot3.bookedBy = booking3.clientName;
    slot3.bookedEmail = booking3.clientEmail;
    slot3.bookedPhone = booking3.clientPhone;
    timeSlots.set(slot3Id, slot3);
    results.push(`✅ Test 3: Booked ${twoWeeksStr} at 5 PM for Michael Chen`);

    // Test 4: Book next month at 11 AM
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const nextMonthStr = nextMonth.toISOString().split('T')[0];
    const slot4Id = `${nextMonthStr}-11`;

    const slot4 = timeSlots.get(slot4Id) || {
      id: slot4Id,
      date: nextMonthStr,
      hour: 11,
      available: true,
      booked: false,
    };
    timeSlots.set(slot4Id, slot4);

    const booking4: Booking = {
      id: `booking-${Date.now()}-4`,
      timeSlotId: slot4Id,
      date: nextMonthStr,
      hour: 11,
      clientName: "Emily Rodriguez",
      clientEmail: "emily.r@email.com",
      clientPhone: "(845) 555-3456",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: 160,
    };
    bookings.set(booking4.id, booking4);
    slot4.booked = true;
    slot4.bookedBy = booking4.clientName;
    slot4.bookedEmail = booking4.clientEmail;
    slot4.bookedPhone = booking4.clientPhone;
    timeSlots.set(slot4Id, slot4);
    results.push(`✅ Test 4: Booked ${nextMonthStr} at 11 AM for Emily Rodriguez`);

    // Test 5: Book 3 weeks from now at 3 PM
    const threeWeeks = new Date();
    threeWeeks.setDate(threeWeeks.getDate() + 21);
    const threeWeeksStr = threeWeeks.toISOString().split('T')[0];
    const slot5Id = `${threeWeeksStr}-15`;

    const slot5 = timeSlots.get(slot5Id) || {
      id: slot5Id,
      date: threeWeeksStr,
      hour: 15,
      available: true,
      booked: false,
    };
    timeSlots.set(slot5Id, slot5);

    const booking5: Booking = {
      id: `booking-${Date.now()}-5`,
      timeSlotId: slot5Id,
      date: threeWeeksStr,
      hour: 15,
      clientName: "David Thompson",
      clientEmail: "d.thompson@email.com",
      clientPhone: "(845) 555-7890",
      status: "confirmed",
      createdAt: new Date().toISOString(),
      paymentStatus: "pending",
      amount: 160,
    };
    bookings.set(booking5.id, booking5);
    slot5.booked = true;
    slot5.bookedBy = booking5.clientName;
    slot5.bookedEmail = booking5.clientEmail;
    slot5.bookedPhone = booking5.clientPhone;
    timeSlots.set(slot5Id, slot5);
    results.push(`✅ Test 5: Booked ${threeWeeksStr} at 3 PM for David Thompson`);

    // Verification
    results.push(`\n📊 Total bookings: ${bookings.size}`);
    results.push(`📅 Booked slots: ${Array.from(timeSlots.values()).filter(s => s.booked).length}`);

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
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}


