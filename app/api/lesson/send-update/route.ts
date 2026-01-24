import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const text = formData.get('text') as string;
    const studentName = formData.get('studentName') as string;

    if (!text || !studentName) {
      return NextResponse.json(
        { error: 'Text and student name are required' },
        { status: 400 }
      );
    }

    // This endpoint is kept for future use (e.g., saving updates to database)
    // For now, the copy/screenshot functionality in the UI handles everything
    // Users can manually copy the info and send via their preferred messaging app

    return NextResponse.json({
      success: true,
      message: 'Update prepared successfully',
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process update', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
