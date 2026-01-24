import { NextRequest, NextResponse } from 'next/server';

interface Student {
  id: string;
  name: string;
  summary_data: any;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, conversationHistory, students } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
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

    // Build context about available students
    const studentsContext = students.length > 0
      ? `\n\nAvailable students:\n${students.map((s: Student) => {
          const summary = s.summary_data || {};
          return `- ${s.name} (ID: ${s.id})${summary.student_name ? ` - Also known as: ${summary.student_name}` : ''}`;
        }).join('\n')}`
      : '\n\nNo students in the system yet.';

    // Build system prompt
    const systemPrompt = `You are an AI assistant for a tennis coach's lesson management system. You can help with:

1. Answering questions about students and lessons
2. Performing actions on students:
   - edit_student_name: Change a student's name (requires confirmation)
   - add_student: Create a new student (no confirmation needed)
   - delete_student: Delete a student and all their lessons (requires confirmation)
   - update_student_data: Update student summary data (requires confirmation)

When the user wants to perform an action, respond with BOTH:
1. A natural language response explaining what you'll do
2. A JSON action object in this format:
{
  "action": {
    "type": "action_type",
    "data": { ...action specific data },
    "needsConfirmation": true/false
  }
}

Action formats:
- edit_student_name: { "type": "edit_student_name", "data": { "studentId": "id", "currentName": "old name", "newName": "new name" }, "needsConfirmation": true }
- add_student: { "type": "add_student", "data": { "name": "student name" }, "needsConfirmation": false }
- delete_student: { "type": "delete_student", "data": { "studentId": "id", "studentName": "name" }, "needsConfirmation": true }
- update_student_data: { "type": "update_student_data", "data": { "studentId": "id", "summaryData": {...} }, "needsConfirmation": true }

IMPORTANT:
- Always try to match student names (case-insensitive, partial matches OK)
- For delete and edit actions, always set needsConfirmation: true
- Include the action JSON at the end of your response, prefixed with "ACTION:" 
- If no action is needed, don't include an action object
- Be helpful, friendly, and concise${studentsContext}`;

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map((msg: Message) => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    // Call Grok API (using OpenAI-compatible endpoint)
    // Note: Grok API might use a different endpoint - adjust if needed
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Using Groq's model since Grok API might not be available
        messages: messages,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      
      // Fallback: Try to parse action from message using simple pattern matching
      const action = parseActionFromMessage(message, students);
      return NextResponse.json({
        response: "I'll help you with that. Let me process your request.",
        action: action,
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || 'I apologize, but I encountered an error.';

    // Parse action from response
    const actionMatch = aiResponse.match(/ACTION:\s*(\{[\s\S]*\})/);
    let action = null;
    let cleanResponse = aiResponse;

    if (actionMatch) {
      try {
        action = JSON.parse(actionMatch[1]);
        cleanResponse = aiResponse.replace(/ACTION:\s*\{[\s\S]*\}/, '').trim();
      } catch (e) {
        console.error('Failed to parse action JSON:', e);
      }
    }

    // If no action found in response, try to parse from message
    if (!action) {
      action = parseActionFromMessage(message, students);
    }

    return NextResponse.json({
      response: cleanResponse,
      action: action,
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Fallback action parser using pattern matching
function parseActionFromMessage(message: string, students: Student[]): any {
  const lowerMessage = message.toLowerCase();

  // Add student
  const addMatch = lowerMessage.match(/(?:add|create|new)\s+(?:a\s+)?student\s+(?:named|called)?\s*["']?([^"'\n]+)["']?/i);
  if (addMatch) {
    return {
      type: 'add_student',
      data: { name: addMatch[1].trim() },
      needsConfirmation: false,
    };
  }

  // Delete student
  const deleteMatch = lowerMessage.match(/(?:delete|remove)\s+(?:student\s+)?["']?([^"'\n]+)["']?/i);
  if (deleteMatch) {
    const studentName = deleteMatch[1].trim();
    const student = findStudentByName(studentName, students);
    if (student) {
      return {
        type: 'delete_student',
        data: { studentId: student.id, studentName: student.name },
        needsConfirmation: true,
      };
    }
  }

  // Edit student name
  const renameMatch = lowerMessage.match(/(?:rename|change|edit)\s+["']?([^"'\n]+)["']?\s+(?:to|as)\s+["']?([^"'\n]+)["']?/i);
  if (renameMatch) {
    const oldName = renameMatch[1].trim();
    const newName = renameMatch[2].trim();
    const student = findStudentByName(oldName, students);
    if (student) {
      return {
        type: 'edit_student_name',
        data: {
          studentId: student.id,
          currentName: student.name,
          newName: newName,
        },
        needsConfirmation: true,
      };
    }
  }

  return null;
}

function findStudentByName(name: string, students: Student[]): Student | null {
  const lowerName = name.toLowerCase().trim();
  return (
    students.find(
      (s) =>
        s.name.toLowerCase() === lowerName ||
        s.name.toLowerCase().includes(lowerName) ||
        lowerName.includes(s.name.toLowerCase()) ||
        (s.summary_data?.student_name &&
          s.summary_data.student_name.toLowerCase() === lowerName)
    ) || null
  );
}
