import { TimeSlot, Booking } from "./types";

// Mock data storage - in production, use a database
export const timeSlots: Map<string, TimeSlot> = new Map();
export const bookings: Map<string, Booking> = new Map();

// Track initialization to preserve existing bookings
let dataInitialized = false;

// Initialize with some sample available slots for the next 3 months
export function initializeMockData() {
  // Don't re-initialize if we already have data (preserves bookings)
  if (dataInitialized && timeSlots.size > 0) {
    return;
  }
  
  const today = new Date();
  
  // Add available slots for the next 90 days
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const isSunday = dayOfWeek === 0;
    
    // Regular hours: 9 AM to 7 PM (9-19) for all days
    for (let hour = 9; hour <= 19; hour++) {
      const id = `${dateStr}-${hour}`;
      // Only create if it doesn't exist (preserves booked slots)
      if (!timeSlots.has(id)) {
        timeSlots.set(id, {
          id,
          date: dateStr,
          hour,
          available: false, // All slots unavailable by default
          booked: false,
        });
      }
    }
    
    // 3 AM (hour 3) only on Sundays
    if (isSunday) {
      const id = `${dateStr}-3`;
      // Only create if it doesn't exist (preserves booked slots)
      if (!timeSlots.has(id)) {
        timeSlots.set(id, {
          id,
          date: dateStr,
          hour: 3,
          available: true, // 3am is available by default on Sundays
          booked: false,
        });
      }
    }
  }
  
  dataInitialized = true;
}

// Initialize mock data - will be called from components

