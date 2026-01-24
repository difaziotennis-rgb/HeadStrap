import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/lesson-server';

export async function GET() {
  try {
    // Check environment variables first
    const hasUrl = !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL;
    const hasKey = !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY;
    
    if (!hasUrl || !hasKey) {
      return NextResponse.json({
        connected: false,
        error: {
          message: 'Missing environment variables',
          hasUrl,
          hasKey,
          urlPrefix: process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL?.substring(0, 30) || 'NOT SET',
          keyPrefix: process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT SET',
        },
        suggestion: 'Please set NEXT_PUBLIC_LESSON_SUPABASE_URL and NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY in your environment variables.'
      }, { status: 500 });
    }
    
    const supabase = await createClient();
    
    // Test 1: Check if we can connect
    const { data: testData, error: testError } = await supabase
      .from('students')
      .select('count')
      .limit(1);

    if (testError) {
      return NextResponse.json({
        connected: false,
        error: {
          code: testError.code,
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
        },
        suggestion: testError.code === 'PGRST116' 
          ? 'The "students" table does not exist. Please run the SQL schema in Supabase.'
          : testError.code === '42501'
          ? 'Row Level Security (RLS) is blocking access. Check your RLS policies.'
          : 'Check your Supabase connection and table setup.'
      }, { status: 500 });
    }

    return NextResponse.json({
      connected: true,
      message: 'Database connection successful!',
      tableExists: true
    });
  } catch (error) {
    return NextResponse.json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestion: 'Check your Supabase configuration in .env.local'
    }, { status: 500 });
  }
}
