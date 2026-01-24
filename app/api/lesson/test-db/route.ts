import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
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
