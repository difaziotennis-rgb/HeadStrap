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
  personal_note?: string;
};

function pickClosing(seed: string): { line: string; emoji: string } {
  const options = [
    { line: "Keep up the great work!", emoji: "💪" },
    { line: "Proud of your progress - keep building on this.", emoji: "🎾" },
    { line: "Great session today, keep that momentum going.", emoji: "🔥" },
    { line: "You're trending in a great direction - stay consistent.", emoji: "👏" },
    { line: "Excellent effort today - let's keep stacking wins.", emoji: "✅" },
  ];

  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return options[hash % options.length];
}

function firstNameOnly(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "there";
  return trimmed.split(/\s+/)[0];
}

function buildMessage(studentName: string, parsed: ParsedLessonData, seed: string): string {
  const closing = pickClosing(seed);
  const firstName = firstNameOnly(studentName);
  let message = `Hi ${firstName}! 👋\n\n`;
  message += `Here's a quick update from today's lesson:\n\n`;

  if (parsed.key_areas_focused.length > 0) {
    message += `🎯 Key Areas We Worked On:\n`;
    for (const area of parsed.key_areas_focused) {
      const formatted = area.charAt(0).toUpperCase() + area.slice(1);
      message += `• ${formatted}\n`;
    }
    message += `\n`;
  }

  if (parsed.physical_limitations.length > 0) {
    message += `🧠 Health / Body Notes:\n`;
    for (const note of parsed.physical_limitations) {
      const formatted = note.charAt(0).toUpperCase() + note.slice(1);
      message += `• ${formatted}\n`;
    }
    message += `\n`;
  }

  if (parsed.future_goals.length > 0) {
    message += `🏆 Goals We're Working Towards:\n`;
    for (const goal of parsed.future_goals) {
      const formatted = goal.charAt(0).toUpperCase() + goal.slice(1);
      message += `• ${formatted}\n`;
    }
    message += `\n`;
  }

  if (parsed.next_lesson_date && parsed.next_lesson_date !== "not specified") {
    message += `📅 Next Lesson: ${parsed.next_lesson_date}\n\n`;
  }

  if (parsed.personal_note && parsed.personal_note !== "not specified") {
    const formatted = parsed.personal_note.charAt(0).toUpperCase() + parsed.personal_note.slice(1);
    message += `💬 Personal Note:\n`;
    message += `• ${formatted}\n\n`;
  }

  message += `${closing.line} ${closing.emoji}\n\n`;
  message += `- Coach Derek`;
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
  "next_lesson_date": "text description of next lesson time/date or 'not specified'",
  "personal_note": "optional encouraging message / inside joke / custom note or 'not specified'"
}

Rules:
- Extract only concrete points that were actually mentioned.
- Rewrite rough spoken phrasing into clear, client-friendly wording.
- Do not include generic filler text.
- Keep each array item concise and specific.
- Do not use one-word labels when details were provided.
- Example: prefer "Proper grip on serve" over just "Serve".
- For next_lesson_date, extract exact timing text if mentioned; otherwise "not specified".
- For personal_note, include only if coach said something personal/encouraging/fun; otherwise "not specified".

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
    if (!parsed.personal_note) parsed.personal_note = "not specified";
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
        personal_note: "not specified",
      };
    }

    const subject = `Lesson Update - ${parsedData.student_name}`;
    const message = buildMessage(parsedData.student_name, parsedData, transcript);

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
