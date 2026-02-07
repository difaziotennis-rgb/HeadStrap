// Test script to create multiple bookings and verify functionality
import { timeSlots, bookings, initializeMockData } from './lib/mock-data';
import { Booking, TimeSlot } from './lib/types';
import { PAYMENT_CONFIG } from './lib/payment-config';

// Initialize data
initializeMockData();

console.log('🧪 Starting Booking Tests...\n');

// Test 1: Book a lesson for tomorrow at 10 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];
const slot1Id = `${tomorrowStr}-10`;

console.log('Test 1: Booking tomorrow at 10 AM');
const slot1 = timeSlots.get(slot1Id);
if (slot1) {
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  
  bookings.set(booking1.id, booking1);
  slot1.booked = true;
  slot1.bookedBy = booking1.clientName;
  slot1.bookedEmail = booking1.clientEmail;
  slot1.bookedPhone = booking1.clientPhone;
  timeSlots.set(slot1Id, slot1);
  
  console.log('✅ Booking 1 created:', booking1);
  console.log('   Slot status:', slot1.booked ? 'BOOKED' : 'AVAILABLE');
} else {
  console.log('❌ Slot not found');
}

// Test 2: Book a lesson for next week at 2 PM
const nextWeek = new Date();
nextWeek.setDate(nextWeek.getDate() + 7);
const nextWeekStr = nextWeek.toISOString().split('T')[0];
const slot2Id = `${nextWeekStr}-14`;

console.log('\nTest 2: Booking next week at 2 PM');
const slot2 = timeSlots.get(slot2Id);
if (slot2) {
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  
  bookings.set(booking2.id, booking2);
  slot2.booked = true;
  slot2.bookedBy = booking2.clientName;
  slot2.bookedEmail = booking2.clientEmail;
  slot2.bookedPhone = booking2.clientPhone;
  timeSlots.set(slot2Id, slot2);
  
  console.log('✅ Booking 2 created:', booking2);
  console.log('   Slot status:', slot2.booked ? 'BOOKED' : 'AVAILABLE');
} else {
  console.log('❌ Slot not found');
}

// Test 3: Book a lesson for 2 weeks from now at 5 PM
const twoWeeks = new Date();
twoWeeks.setDate(twoWeeks.getDate() + 14);
const twoWeeksStr = twoWeeks.toISOString().split('T')[0];
const slot3Id = `${twoWeeksStr}-17`;

console.log('\nTest 3: Booking 2 weeks from now at 5 PM');
const slot3 = timeSlots.get(slot3Id);
if (slot3) {
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  
  bookings.set(booking3.id, booking3);
  slot3.booked = true;
  slot3.bookedBy = booking3.clientName;
  slot3.bookedEmail = booking3.clientEmail;
  slot3.bookedPhone = booking3.clientPhone;
  timeSlots.set(slot3Id, slot3);
  
  console.log('✅ Booking 3 created:', booking3);
  console.log('   Slot status:', slot3.booked ? 'BOOKED' : 'AVAILABLE');
} else {
  console.log('❌ Slot not found');
}

// Test 4: Book a lesson for next month at 11 AM
const nextMonth = new Date();
nextMonth.setMonth(nextMonth.getMonth() + 1);
const nextMonthStr = nextMonth.toISOString().split('T')[0];
const slot4Id = `${nextMonthStr}-11`;

console.log('\nTest 4: Booking next month at 11 AM');
const slot4 = timeSlots.get(slot4Id);
if (slot4) {
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  
  bookings.set(booking4.id, booking4);
  slot4.booked = true;
  slot4.bookedBy = booking4.clientName;
  slot4.bookedEmail = booking4.clientEmail;
  slot4.bookedPhone = booking4.clientPhone;
  timeSlots.set(slot4Id, slot4);
  
  console.log('✅ Booking 4 created:', booking4);
  console.log('   Slot status:', slot4.booked ? 'BOOKED' : 'AVAILABLE');
} else {
  console.log('❌ Slot not found - creating it');
  // Create the booking first
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  bookings.set(booking4.id, booking4);
  
  // Create the slot if it doesn't exist
  const newSlot: TimeSlot = {
    id: slot4Id,
    date: nextMonthStr,
    hour: 11,
    available: true,
    booked: true,
    bookedBy: booking4.clientName,
    bookedEmail: booking4.clientEmail,
    bookedPhone: booking4.clientPhone,
  };
  timeSlots.set(slot4Id, newSlot);
  
  console.log('✅ Booking 4 created (slot created):', booking4);
}

// Test 5: Book a lesson for 3 weeks from now at 3 PM
const threeWeeks = new Date();
threeWeeks.setDate(threeWeeks.getDate() + 21);
const threeWeeksStr = threeWeeks.toISOString().split('T')[0];
const slot5Id = `${threeWeeksStr}-15`;

console.log('\nTest 5: Booking 3 weeks from now at 3 PM');
const slot5 = timeSlots.get(slot5Id);
if (slot5) {
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
    amount: PAYMENT_CONFIG.lessonRate,
  };
  
  bookings.set(booking5.id, booking5);
  slot5.booked = true;
  slot5.bookedBy = booking5.clientName;
  slot5.bookedEmail = booking5.clientEmail;
  slot5.bookedPhone = booking5.clientPhone;
  timeSlots.set(slot5Id, slot5);
  
  console.log('✅ Booking 5 created:', booking5);
  console.log('   Slot status:', slot5.booked ? 'BOOKED' : 'AVAILABLE');
} else {
  console.log('❌ Slot not found');
}

// Verification: Check all bookings
console.log('\n📊 Verification Summary:');
console.log(`Total bookings created: ${bookings.size}`);
console.log('\nAll Bookings:');
bookings.forEach((booking, id) => {
  console.log(`  - ${id}: ${booking.clientName} on ${booking.date} at ${booking.hour}:00`);
});

// Check that slots are properly marked as booked
console.log('\n✅ Slot Status Check:');
const testSlots = [slot1Id, slot2Id, slot3Id, slot4Id, slot5Id];
testSlots.forEach(slotId => {
  const slot = timeSlots.get(slotId);
  if (slot) {
    console.log(`  ${slotId}: ${slot.booked ? '✅ BOOKED' : '❌ NOT BOOKED'} - ${slot.bookedBy || 'Available'}`);
  } else {
    console.log(`  ${slotId}: ❌ NOT FOUND`);
  }
});

console.log('\n🎉 All tests completed!');

