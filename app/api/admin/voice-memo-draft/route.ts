import { NextResponse } from "next/server";

type DraftRequest = {
  clientName?: string;
  clientEmail?: string;
  lessonDate?: string;
  lessonTime?: string;
  transcript?: string;
};

type ParsedLessonData = {
  student_name: string;
  key_areas_focused: string[];
  physical_limitations: string[];
  future_goals: string[];
  next_lesson_date: string;
};

function buildMessage(studentName: string, parsed: ParsedLessonData): string {
  let message = `Hi ${studentName}! 👋\n\n`;
  message += `Here's a quick update from today's lesson:\n\n`;

  if (parsed.key_areas_focused.length > 0) {
    message += `🎯 Key Areas We Worked On:\n`;
    for (const area of parsed.key_areas_focused) {
      message += `• ${area}\n`;
    }
    message += `\n`;
  }

  if (parsed.physical_limitations.length > 0) {
    message += `🧠 Health / Body Notes:\n`;
    for (const note of parsed.physical_limitations) {
      message += `• ${note}\n`;
    }
    message += `\n`;
  }

  if (parsed.future_goals.length > 0) {
    message += `🏆 Goals We're Working Towards:\n`;
    for (const goal of parsed.future_goals) {
      message += `• ${goal}\n`;
    }
    message += `\n`;
  }

  if (parsed.next_lesson_date && parsed.next_lesson_date !== "not specified") {
    message += `📅 Next Lesson: ${parsed.next_lesson_date}\n\n`;
  }

  message += `Keep up the great work! 💪\n\n`;
  message += `- DiFazio Tennis`;
  return message;
}

async function parseTranscriptWithGroq(transcript: string): Promise<ParsedLessonData | null> {
  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) return null;

  const prompt = `You are a tennis coach's AI assistant. Analyze the following lesson transcript and extract structured information.

Return ONLY valid JSON (no markdown, no code blocks, no explanations). The JSON must match this exact structure:
{
  "student_name": "string",
  "key_areas_focused": ["array", "of", "strings"],
  "physical_limitations": ["array", "of", "strings"],
  "future_goals": ["array", "of", "strings"],
  "next_lesson_date": "text description of next lesson time/date or 'not specified'"
}

Rules:
- Extract only concrete points that were actually mentioned.
- Rewrite rough spoken phrasing into clear, client-friendly wording.
- Do not include generic filler text.
- Keep each array item concise and specific.
- For next_lesson_date, extract exact timing text if mentioned; otherwise "not specified".

TRANSCRIPT:
${transcript}
`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${groqApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are a tennis coach assistant. Return ONLY valid JSON (no markdown, no code blocks).",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      max_tokens: 1200,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) return null;

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;

  try {
    const parsed = JSON.parse(content) as ParsedLessonData;
    if (!Array.isArray(parsed.key_areas_focused)) parsed.key_areas_focused = [];
    if (!Array.isArray(parsed.physical_limitations)) parsed.physical_limitations = [];
    if (!Array.isArray(parsed.future_goals)) parsed.future_goals = [];
    if (!parsed.next_lesson_date) parsed.next_lesson_date = "not specified";
    return parsed;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DraftRequest;
    const clientName = (body.clientName || "").trim() || "Student";
    const clientEmail = (body.clientEmail || "").trim();
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    const parsed = await parseTranscriptWithGroq(transcript);

    let parsedData: ParsedLessonData;
    if (parsed) {
      const parsedName = parsed.student_name?.trim();
      const normalizedName =
        parsedName && parsedName.toLowerCase() !== "not specified" ? parsedName : clientName;
      parsedData = {
        ...parsed,
        student_name: normalizedName,
      };
    } else {
      parsedData = {
        student_name: clientName,
        key_areas_focused: [transcript.slice(0, 180).trim()],
        physical_limitations: [],
        future_goals: [],
        next_lesson_date: "not specified",
      };
    }

    const subject = `Lesson Update - ${parsedData.student_name}`;
    const message = buildMessage(parsedData.student_name, parsedData);

    return NextResponse.json({
      subject,
      to: clientEmail || "",
      body: message,
      parsedData,
      meta: {
        source: parsed ? "lesson-style-groq-parser" : "fallback",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate draft email.", details: String(error) },
      { status: 500 }
    );
  }
}
