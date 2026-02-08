import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

export async function GET() {
  const results: Record<string, any> = {};

  const url = process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL || "";
  const key = process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY || "";

  // Check env vars (show partial URL for debugging)
  results.envVars = {
    url: url ? url.substring(0, 30) + "..." : "NOT SET",
    keyPrefix: key ? key.substring(0, 20) + "..." : "NOT SET",
  };

  try {
    const supabase = getBookingServerClient();

    // Test existing students table (should work if connection is right)
    const { data: students, error: studentsErr } = await supabase
      .from("students")
      .select("id")
      .limit(1);
    results.studentsTable = {
      found: !studentsErr,
      count: students?.length ?? 0,
      error: studentsErr?.message ?? null,
    };

    // Test time_slots table
    const { data: slots, error: slotsErr } = await supabase
      .from("time_slots")
      .select("id")
      .limit(5);
    results.timeSlots = {
      found: !slotsErr,
      count: slots?.length ?? 0,
      error: slotsErr?.message ?? null,
    };

    // Test bookings table
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("id")
      .limit(5);
    results.bookings = {
      found: !bookingsErr,
      count: bookings?.length ?? 0,
      error: bookingsErr?.message ?? null,
    };

    // Test recurring_lessons table
    const { data: recurring, error: recurringErr } = await supabase
      .from("recurring_lessons")
      .select("id")
      .limit(5);
    results.recurringLessons = {
      found: !recurringErr,
      count: recurring?.length ?? 0,
      error: recurringErr?.message ?? null,
    };
  } catch (e: any) {
    results.connectionError = e.message;
  }

  return NextResponse.json(results);
}
