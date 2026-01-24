import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Student } from '@/lib/types/lesson-intelligence';

export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch students', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ students: data as Student[] });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, summary_data } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Student name is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('students')
      .insert({
        name,
        summary_data: summary_data || {},
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      console.error('Supabase error code:', error.code);
      console.error('Supabase error message:', error.message);
      console.error('Supabase error details:', error.details);
      console.error('Supabase error hint:', error.hint);
      
      // Include more detailed error information
      const errorDetails = error.details 
        ? `${error.message} (${error.details})`
        : error.message;
      const errorHint = error.hint ? ` Hint: ${error.hint}` : '';
      const fullErrorDetails = `${errorDetails}${errorHint}`;
      
      return NextResponse.json(
        { 
          error: 'Failed to create student', 
          details: fullErrorDetails,
          code: error.code || 'UNKNOWN',
          message: error.message,
          hint: error.hint,
          fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ student: data as Student });
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, summary_data } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Build update object with only provided fields
    const updateData: { name?: string; summary_data?: any } = {};
    if (name !== undefined) {
      updateData.name = name;
    }
    if (summary_data !== undefined) {
      updateData.summary_data = summary_data;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'At least one field (name or summary_data) must be provided' },
        { status: 400 }
      );
    }
    
    const { data, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to update student', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ student: data as Student });
  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // First, delete all lessons associated with this student
    const { error: lessonsError } = await supabase
      .from('lessons')
      .delete()
      .eq('student_id', id);

    if (lessonsError) {
      console.error('Error deleting lessons:', lessonsError);
      return NextResponse.json(
        { error: 'Failed to delete student lessons', details: lessonsError.message },
        { status: 500 }
      );
    }

    // Then delete the student
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to delete student', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
