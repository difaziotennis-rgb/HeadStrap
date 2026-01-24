import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check that doesn't require any external services
  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    envVars: {
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY,
      hasGroqKey: !!process.env.GROQ_API_KEY,
    },
  });
}
