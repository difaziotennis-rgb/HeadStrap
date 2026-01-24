import { NextRequest, NextResponse } from 'next/server';
import { ParsedLessonData, StudentSummaryData } from '@/lib/types/lesson-intelligence';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, existingSummary } = body;

    if (!transcript) {
      return NextResponse.json(
        { error: 'No transcript provided' },
        { status: 400 }
      );
    }

    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    // Build the prompt for Gemini
    const existingContext = existingSummary 
      ? `\n\nEXISTING STUDENT PROFILE:\n${JSON.stringify(existingSummary, null, 2)}\n\nIMPORTANT: When merging with the existing profile, you MUST:\n1. ADD new items mentioned in the transcript\n2. REMOVE items explicitly said to be "done", "completed", "no longer needed", "we're finished with", "we don't need to work on anymore", etc.\n3. UPDATE items if they're mentioned as changed (e.g., "change X to Y" or "update X")\n4. KEEP items that are still relevant and not mentioned as completed\n\nFor deletions: If the transcript says something like "we're done with the serve" or "no longer focusing on backhand", REMOVE those items from the arrays.\nFor edits: If the transcript says "change 'improve serve' to 'master serve'", update the item accordingly.`
      : '';

    const prompt = `You are a tennis coach's AI assistant. Analyze the following lesson transcript and extract structured information.

Return ONLY valid JSON (no markdown, no code blocks, no explanations). The JSON must match this exact structure:
{
  "student_name": "string",
  "key_areas_focused": ["array", "of", "strings"],
  "physical_limitations": ["array", "of", "strings"],
  "future_goals": ["array", "of", "strings"],
  "next_lesson_date": "text description of next lesson time/date or 'not specified'"
}

CRITICAL INSTRUCTIONS FOR MERGING:
- If the transcript mentions something is "done", "completed", "finished", "no longer needed", "we're done with", "we don't need to work on anymore", etc., REMOVE it from the relevant array
- If the transcript mentions changing/updating an item, update it in the array
- Add new items mentioned in the transcript
- Keep items that are still relevant and not mentioned as completed

For next_lesson_date, extract the exact text mentioned about when the next lesson will be. Examples:
- "Wednesday afternoon"
- "Saturday afternoon" 
- "2 p.m. on Thursday"
- "Next week Tuesday"
- "December 15th at 3pm"
- "2024-12-15" (if a specific date is given)
- "not specified" (if nothing is mentioned)

TRANSCRIPT:
${transcript}${existingContext}

Extract all relevant information. If something is not mentioned, use an empty array [] or "not specified" for the date.`;

    // Call Groq API for parsing (using same API key as transcription)
    // Using llama-3.3-70b-versatile (updated from deprecated llama-3.1-70b-versatile)
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a tennis coach\'s AI assistant. Analyze lesson transcripts and return ONLY valid JSON (no markdown, no code blocks, no explanations).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: 'json_object' }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', errorText);
      
      // Try to parse error for better message
      let errorMessage = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorText;
      } catch {
        // Keep original error text
      }
      
      return NextResponse.json(
        { error: 'Parsing failed', details: errorMessage },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    if (!content) {
      return NextResponse.json(
        { error: 'No content returned from Groq' },
        { status: 500 }
      );
    }

    // Groq with json_object response_format should return pure JSON
    let jsonText = content.trim();
    // Remove markdown code blocks if present (just in case)
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const parsedData: ParsedLessonData = JSON.parse(jsonText);
      
      // Validate structure
      if (!parsedData.student_name || !Array.isArray(parsedData.key_areas_focused)) {
        throw new Error('Invalid JSON structure returned');
      }

      return NextResponse.json({ parsedData });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw content:', content);
      return NextResponse.json(
        { error: 'Failed to parse AI response', details: content },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Parsing error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
