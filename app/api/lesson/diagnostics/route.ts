import { NextResponse } from 'next/server';

export async function GET() {
  const diagnostics: Record<string, any> = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  };

  // Check Supabase variables
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL;
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY;
  
  diagnostics.checks.supabase = {
    url: {
      present: hasSupabaseUrl,
      value: hasSupabaseUrl 
        ? `${process.env.NEXT_PUBLIC_LESSON_SUPABASE_URL.substring(0, 30)}...` 
        : 'MISSING',
    },
    anonKey: {
      present: hasSupabaseKey,
      value: hasSupabaseKey 
        ? `${process.env.NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY.substring(0, 20)}...` 
        : 'MISSING',
    },
    status: hasSupabaseUrl && hasSupabaseKey ? 'OK' : 'MISSING VARIABLES',
  };

  // Check Groq API key
  const hasGroqKey = !!process.env.GROQ_API_KEY;
  diagnostics.checks.groq = {
    apiKey: {
      present: hasGroqKey,
      value: hasGroqKey 
        ? `${process.env.GROQ_API_KEY.substring(0, 20)}...` 
        : 'MISSING',
    },
    status: hasGroqKey ? 'OK' : 'MISSING',
  };

  // Test Supabase connection if variables are present
  if (hasSupabaseUrl && hasSupabaseKey) {
    try {
      const { createClient } = await import('@/lib/supabase/lesson-server');
      const supabase = await createClient();
      
      const { data, error } = await supabase
        .from('students')
        .select('count')
        .limit(1);

      if (error) {
        diagnostics.checks.supabase.connection = {
          status: 'FAILED',
          error: {
            code: error.code,
            message: error.message,
            hint: error.hint,
          },
        };
      } else {
        diagnostics.checks.supabase.connection = {
          status: 'OK',
          message: 'Successfully connected to Supabase',
        };
      }
    } catch (error) {
      diagnostics.checks.supabase.connection = {
        status: 'ERROR',
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  } else {
    diagnostics.checks.supabase.connection = {
      status: 'SKIPPED',
      message: 'Cannot test connection - missing environment variables',
    };
  }

  // Overall status
  const allRequired = hasSupabaseUrl && hasSupabaseKey && hasGroqKey;
  const supabaseConnected = diagnostics.checks.supabase.connection?.status === 'OK';
  
  diagnostics.summary = {
    allRequired: allRequired,
    supabaseConnected: supabaseConnected,
    status: allRequired && supabaseConnected ? 'READY' : 'NOT READY',
    missing: [
      !hasSupabaseUrl && 'NEXT_PUBLIC_LESSON_SUPABASE_URL',
      !hasSupabaseKey && 'NEXT_PUBLIC_LESSON_SUPABASE_ANON_KEY',
      !hasGroqKey && 'GROQ_API_KEY',
    ].filter(Boolean) as string[],
  };

  return NextResponse.json(diagnostics, {
    status: diagnostics.summary.status === 'READY' ? 200 : 500,
  });
}
