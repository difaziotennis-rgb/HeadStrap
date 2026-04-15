import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/lesson-server';
import { Lesson } from '@/lib/types/lesson-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, transcript, parsed_data } = body;

    if (!student_id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('lessons')
      .insert({
        student_id,
        transcript: transcript || null,
        parsed_data: parsed_data || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to create lesson', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ lesson: data as Lesson });
  } catch (error) {
    console.error('Error creating lesson:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    const supabase = await createClient();
    
    let query = supabase
      .from('lessons')
      .select('*')
      .order('date', { ascending: false });

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch lessons', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ lessons: data as Lesson[] });
  } catch (error) {
    console.error('Error fetching lessons:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
