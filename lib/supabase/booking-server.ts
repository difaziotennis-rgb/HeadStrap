import { createClient } from '@supabase/supabase-js'

// Server-side Supabase client for booking data (no cookies needed)
// Uses the same Supabase instance as lesson intelligence
export function getBookingServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY!
  )
}
