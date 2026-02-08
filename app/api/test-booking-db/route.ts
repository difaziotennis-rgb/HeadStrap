import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function GET() {
  const results: Record<string, any> = {};

  // Check env vars
  results.envVars = {
    NEXT_PUBLIC_LESSON_SUPABASE_URL: process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL ? "SET" : "NOT SET",
    NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY ? "SET" : "NOT SET",
  };

  try {
    const supabase = getBookingServerClient();

    // Test time_slots table
    const { data: slots, error: slotsErr } = await supabase
      .from("time_slots")
      .select("id")
      .limit(5);
    results.timeSlots = {
      count: slots?.length ?? 0,
      error: slotsErr?.message ?? null,
      sample: slots?.map((s: any) => s.id) ?? [],
    };

    // Test bookings table
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id")
      .limit(5);
    results.bookings = {
      count: bookings?.length ?? 0,
      error: bookingsErr?.message ?? null,
    };

    // Test recurring_lessons table
    const { data: recurring, error: recurringErr } = await supabase
      .from("recurring_lessons")
      .select("id")
      .limit(5);
    results.recurringLessons = {
      count: recurring?.length ?? 0,
      error: recurringErr?.message ?? null,
    };
  } catch (e: any) {
    results.connectionError = e.message;
  }

  return NextResponse.json(results);
}
