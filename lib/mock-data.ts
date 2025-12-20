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
  
  // Add available slots for the next 90 days, 9 AM to 7 PM (including Sundays)
  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Available hours: 9 AM to 7 PM (9-19)
    for (let hour = 9; hour <= 19; hour++) {
      const id = `${dateStr}-${hour}`;
      // Only create if it doesn't exist (preserves booked slots)
      if (!timeSlots.has(id)) {
        timeSlots.set(id, {
          id,
          date: dateStr,
          hour,
          available: hour === 9, // 9 AM available by default, others unavailable
          booked: false,
        });
      }
    }
  }
  
  dataInitialized = true;
}

// Initialize mock data - will be called from components

