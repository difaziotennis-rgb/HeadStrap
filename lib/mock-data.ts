import { TimeSlot, Booking } from "./types";
import { getHoursForDay } from "./utils";

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
    const dayOfWeek = date.getDay();
    
    // Regular hours based on day of week
    const hours = getHoursForDay(dayOfWeek);
    for (const hour of hours) {
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
  }
  
  dataInitialized = true;
}

// Initialize mock data - will be called from components

