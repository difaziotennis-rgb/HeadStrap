import { NextResponse } from "next/server";
import { timeSlots, initializeMockData } from "@/lib/mock-data";

export async function GET() {
  try {
    // Initialize mock data to ensure slots are loaded
    initializeMockData();
    const allSlots = Array.from(timeSlots.values());
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    
    // Filter for available, not booked slots starting from today
    const now = new Date();
    const currentHour = now.getHours();
    const availableSlots = allSlots.filter(slot => {
      const slotDate = new Date(slot.date + 'T00:00:00');
      const isToday = slot.date === todayStr;
      const isPastHour = isToday && slot.hour <= currentHour;
      
      return (
        slot.available &&
        !slot.booked &&
        slotDate >= today &&
        !isPastHour
      );
    });
    
    // Sort by date, then by hour
    availableSlots.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date);
      if (dateCompare !== 0) return dateCompare;
      return a.hour - b.hour;
    });
    
    if (availableSlots.length === 0) {
      return NextResponse.json({
        available: false,
        message: "No available slots found",
      });
    }
    
    const nextSlot = availableSlots[0];
    const slotDate = new Date(nextSlot.date + 'T00:00:00');
    const dateStr = slotDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const wh = Math.floor(nextSlot.hour);
    const mn = Math.round((nextSlot.hour - wh) * 60);
    const dh = wh === 0 ? 12 : wh > 12 ? wh - 12 : wh;
    const timeStr = `${dh}:${String(mn).padStart(2, '0')} ${nextSlot.hour >= 12 ? 'PM' : 'AM'}`;
    
    return NextResponse.json({
      available: true,
      date: nextSlot.date,
      dateFormatted: dateStr,
      hour: nextSlot.hour,
      timeFormatted: timeStr,
      datetime: `${dateStr} at ${timeStr}`,
      slotId: nextSlot.id,
    });
  } catch (error: any) {
    console.error("Error finding next available slot:", error);
    return NextResponse.json(
      { error: error.message, available: false },
      { status: 500 }
    );
  }
}

