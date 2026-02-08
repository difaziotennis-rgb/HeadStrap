import { createBrowserClient } from '@supabase/ssr'

// Browser-side Supabase client for booking data
// Uses the same Supabase instance as lesson intelligence
let client: ReturnType<typeof createBrowserClient> | null = null;

export function getBookingClient() {
  if (!client) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY!
    )
  }
  return client;
}
