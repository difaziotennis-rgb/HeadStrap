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
   - add_key_area: Add a key area of focus to a student (no confirmation needed)
   - add_physical_limitation: Add a physical limitation to a student (no confirmation needed)
   - add_future_goal: Add a future goal to a student (no confirmation needed)
   - update_next_lesson_date: Update the next lesson date for a student (no confirmation needed)
   - navigate_to_student: Open/select a student's profile (no confirmation needed)
   - parse_and_update: Parse natural language and update multiple fields at once (no confirmation needed)

KEY AREAS OF FOCUS include: forehand, backhand, serve, volley, footwork, topspin, slice, return, approach shots, overhead, drop shots, lobs, strategy, mental game, consistency, power, accuracy, etc.

PHYSICAL LIMITATIONS include: injuries (knee, shoulder, elbow, wrist, ankle, back, etc.), pain, restrictions, mobility issues, etc.

FUTURE GOALS include: tournament preparation, match play, specific skill improvement, ranking goals, etc.

NEXT LESSON DATE can be: "Wednesday afternoon", "Saturday at 2pm", "Next week Tuesday", "December 15th", etc. - extract the exact text mentioned.

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
- add_key_area: { "type": "add_key_area", "data": { "studentId": "id", "studentName": "name", "keyArea": "area text" }, "needsConfirmation": false }
- add_physical_limitation: { "type": "add_physical_limitation", "data": { "studentId": "id", "studentName": "name", "limitation": "limitation text" }, "needsConfirmation": false }
- add_future_goal: { "type": "add_future_goal", "data": { "studentId": "id", "studentName": "name", "goal": "goal text" }, "needsConfirmation": false }
- update_next_lesson_date: { "type": "update_next_lesson_date", "data": { "studentId": "id", "studentName": "name", "nextLessonDate": "date text" }, "needsConfirmation": false }
- navigate_to_student: { "type": "navigate_to_student", "data": { "studentId": "id", "studentName": "name" }, "needsConfirmation": false }
- parse_and_update: { "type": "parse_and_update", "data": { "studentId": "id", "studentName": "name", "text": "natural language text to parse" }, "needsConfirmation": false }

SMART PARSING:
- If the user says something like "Mark has a knee injury" or "Sarah injured her shoulder", use add_physical_limitation
- If the user says "John is working on his forehand" or "Emma needs to improve her backhand", use add_key_area
- If the user says "Next lesson for Tom is Wednesday at 2pm" or "Sarah's lesson is Saturday afternoon", use update_next_lesson_date
- If the user mentions multiple things in one message (e.g., "Mark has a knee injury and his next lesson is Wednesday"), use parse_and_update
- Be smart about detecting tennis terms: forehand, backhand, serve, volley, footwork, topspin, slice, etc. are key areas
- Be smart about detecting injuries: knee, shoulder, elbow, wrist, ankle, back, pain, injury, etc. are physical limitations

IMPORTANT:
- Always try to match student names (case-insensitive, partial matches OK)
- For delete and edit name actions, always set needsConfirmation: true
- For adding data (key areas, limitations, goals, dates), no confirmation needed
- When adding to arrays (key_areas_focused, physical_limitations, future_goals), preserve existing items and append the new one
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
        action: action || null, // Ensure we return null instead of undefined
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
        const parsedAction = JSON.parse(actionMatch[1]);
        // Handle nested action structure: { action: { type, data } } or flat { type, data }
        if (parsedAction.action) {
          action = parsedAction.action;
        } else if (parsedAction.type) {
          action = parsedAction;
        } else {
          console.error('Action JSON missing type:', parsedAction);
        }
        cleanResponse = aiResponse.replace(/ACTION:\s*\{[\s\S]*\}/, '').trim();
      } catch (e) {
        console.error('Failed to parse action JSON:', e, 'Match:', actionMatch[1]);
      }
    }

    // If no action found in response, try to parse from message
    if (!action) {
      action = parseActionFromMessage(message, students);
    }

    // Ensure action has the correct structure
    if (action && !action.type) {
      console.error('Action missing type:', action);
      action = null;
    }
    
    // Log for debugging
    if (action) {
      console.log('Parsed action:', JSON.stringify(action, null, 2));
    } else {
      console.log('No action parsed from message:', message);
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

  // Add key area - detect tennis terms in natural language
  // Patterns: "working on forehand", "needs to improve backhand", "focusing on serve", etc.
  const tennisTerms = ['forehand', 'backhand', 'serve', 'volley', 'footwork', 'topspin', 'slice', 'return', 'approach', 'overhead', 'drop shot', 'lob', 'strategy', 'mental', 'consistency', 'power', 'accuracy'];
  const keyAreaPatterns = [
    /(?:working\s+on|focusing\s+on|needs?\s+to\s+improve|improving|practicing)\s+["']?([^"'\n]+)["']?\s+(?:for|with|to)\s+["']?([^"'\n]+)["']?/i,
    /["']?([^"'\n]+)["']?\s+(?:is\s+)?(?:working\s+on|focusing\s+on|needs?\s+to\s+improve|improving|practicing)\s+["']?([^"'\n]+)["']?/i,
    /(?:add|set)\s+(?:key\s+area|focus)\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?/i,
    /(?:add)\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?\s+(?:key\s+area|focus)/i,
  ];
  
  for (const pattern of keyAreaPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const keyArea = match[1]?.trim() || match[2]?.trim();
      const studentName = match[2]?.trim() || match[1]?.trim();
      
      // Check if the extracted text contains tennis terms
      const hasTennisTerm = tennisTerms.some(term => keyArea.toLowerCase().includes(term) || studentName.toLowerCase().includes(term));
      
      if (hasTennisTerm) {
        // Swap if needed - if studentName contains tennis term, it's actually the key area
        const actualKeyArea = hasTennisTerm && tennisTerms.some(t => studentName.toLowerCase().includes(t)) ? studentName : keyArea;
        const actualStudentName = hasTennisTerm && tennisTerms.some(t => studentName.toLowerCase().includes(t)) ? keyArea : studentName;
        
        const student = findStudentByName(actualStudentName, students);
        if (student) {
          return {
            type: 'add_key_area',
            data: { studentId: student.id, studentName: student.name, keyArea: actualKeyArea },
            needsConfirmation: false,
          };
        }
      } else {
        // Try normal matching
        const student = findStudentByName(studentName, students);
        if (student) {
          return {
            type: 'add_key_area',
            data: { studentId: student.id, studentName: student.name, keyArea: keyArea },
            needsConfirmation: false,
          };
        }
      }
    }
  }

  // Add physical limitation - detect injuries in natural language
  // Patterns: "has a knee injury", "injured their shoulder", "knee pain", etc.
  const injuryTerms = ['injury', 'injured', 'pain', 'hurt', 'sore', 'knee', 'shoulder', 'elbow', 'wrist', 'ankle', 'back', 'hip', 'limitation', 'restriction', 'mobility'];
  const limitationPatterns = [
    /["']?([^"'\n]+)["']?\s+(?:has|have|had)\s+(?:a\s+)?["']?([^"'\n]+)["']?\s+(?:injury|pain|problem|issue)/i,
    /["']?([^"'\n]+)["']?\s+(?:injured|hurt)\s+(?:their|his|her)\s+["']?([^"'\n]+)["']?/i,
    /["']?([^"'\n]+)["']?\s+(?:has|have)\s+["']?([^"'\n]+)["']?\s+(?:pain|injury|problem|issue)/i,
    /(?:add|set)\s+(?:physical\s+)?limitation\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?/i,
    /(?:add)\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?\s+(?:physical\s+)?limitation/i,
  ];
  
  for (const pattern of limitationPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const studentName = match[1]?.trim();
      const limitation = match[2]?.trim();
      
      // Check if limitation contains injury terms
      const hasInjuryTerm = injuryTerms.some(term => limitation.toLowerCase().includes(term));
      
      if (hasInjuryTerm) {
        const student = findStudentByName(studentName, students);
        if (student) {
          return {
            type: 'add_physical_limitation',
            data: { studentId: student.id, studentName: student.name, limitation: limitation },
            needsConfirmation: false,
          };
        }
      }
    }
  }

  // Add future goal
  const goalMatch = lowerMessage.match(/(?:add|set)\s+(?:future\s+)?goal\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?/i) ||
                    lowerMessage.match(/(?:add)\s+["']?([^"'\n]+)["']?\s+(?:to|for)\s+["']?([^"'\n]+)["']?\s+(?:future\s+)?goal/i);
  if (goalMatch) {
    const goal = goalMatch[1].trim();
    const studentName = goalMatch[2].trim();
    const student = findStudentByName(studentName, students);
    if (student) {
      return {
        type: 'add_future_goal',
        data: { studentId: student.id, studentName: student.name, goal: goal },
        needsConfirmation: false,
      };
    }
  }

  // Update next lesson date - detect various patterns
  const nextLessonPatterns = [
    /(?:next\s+lesson|lesson)\s+(?:for|with)?\s+["']?([^"'\n]+)["']?\s+(?:is|will\s+be|on)?\s*["']?([^"'\n]+)["']?/i,
    /["']?([^"'\n]+)["']?\s+(?:next\s+lesson|lesson)\s+(?:is|will\s+be|on)?\s*["']?([^"'\n]+)["']?/i,
    /(?:set|update|change)\s+next\s+lesson\s+(?:date|for)?\s+["']?([^"'\n]+)["']?\s+(?:to|as)?\s*["']?([^"'\n]+)["']?/i,
  ];
  
  for (const pattern of nextLessonPatterns) {
    const match = lowerMessage.match(pattern);
    if (match) {
      const studentName = match[1].trim();
      const date = match[2].trim();
      const student = findStudentByName(studentName, students);
      if (student && (date.includes('wednesday') || date.includes('thursday') || date.includes('friday') || date.includes('saturday') || date.includes('sunday') || date.includes('monday') || date.includes('tuesday') || date.includes('pm') || date.includes('am') || date.includes('afternoon') || date.includes('morning') || date.includes('week') || date.match(/\d/))) {
        return {
          type: 'update_next_lesson_date',
          data: { studentId: student.id, studentName: student.name, nextLessonDate: date },
          needsConfirmation: false,
        };
      }
    }
  }
  
  // If message contains multiple pieces of information or complex natural language,
  // use parse_and_update instead of trying to parse individual actions
  const hasMultipleInfo = (
    (lowerMessage.includes('injury') || lowerMessage.includes('pain') || lowerMessage.includes('hurt')) &&
    (lowerMessage.includes('forehand') || lowerMessage.includes('backhand') || lowerMessage.includes('serve') || lowerMessage.includes('lesson'))
  ) || (
    lowerMessage.split(/\s+(?:and|,)\s+/i).length > 2 &&
    (lowerMessage.includes('injury') || lowerMessage.includes('forehand') || lowerMessage.includes('backhand') || lowerMessage.includes('lesson'))
  );
  
  if (hasMultipleInfo) {
    // Try to find a student name in the message
    for (const student of students) {
      const studentNameLower = student.name.toLowerCase();
      if (lowerMessage.includes(studentNameLower)) {
        return {
          type: 'parse_and_update',
          data: { studentId: student.id, studentName: student.name, text: message },
          needsConfirmation: false,
        };
      }
    }
  }

  // Navigate to student - "show student X" or "open X" or "go to X"
  const navigateMatch = lowerMessage.match(/(?:show|open|go\s+to|view|select)\s+(?:student\s+)?["']?([^"'\n]+)["']?/i);
  if (navigateMatch) {
    const studentName = navigateMatch[1].trim();
    const student = findStudentByName(studentName, students);
    if (student) {
      return {
        type: 'navigate_to_student',
        data: { studentId: student.id, studentName: student.name },
        needsConfirmation: false,
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
