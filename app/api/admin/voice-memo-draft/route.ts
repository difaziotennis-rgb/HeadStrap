import { NextResponse } from "next/server";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

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

function parseLessonTimeToHour(lessonTime?: string): number | null {
  const raw = (lessonTime || "").trim();
  if (!raw) return null;

  const match = raw.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  const hour12 = Number(match[1]);
  const minute = Number(match[2]);
  const period = match[3].toUpperCase();

  if (
    Number.isNaN(hour12) ||
    Number.isNaN(minute) ||
    hour12 < 1 ||
    hour12 > 12 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }

  const baseHour = hour12 % 12;
  const hour24 = period === "PM" ? baseHour + 12 : baseHour;
  return hour24 + minute / 60;
}

function formatSlotAsNextLesson(dateStr: string, hour: number): string {
  const date = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(date.getTime())) return "not specified";

  const whole = Math.floor(hour);
  const mins = Math.round((hour - whole) * 60);
  const h12 = whole === 0 ? 12 : whole > 12 ? whole - 12 : whole;
  const ampm = whole >= 12 ? "PM" : "AM";
  const timeText = `${h12}:${String(mins).padStart(2, "0")} ${ampm}`;

  const dateText = date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return `${dateText} at ${timeText}`;
}

async function lookupNextLessonDateFromSchedule(
  clientName: string,
  lessonDate?: string,
  lessonTime?: string
): Promise<string | null> {
  const normalizedClient = clientName.trim();
  if (!normalizedClient) return null;

  const baseDate = (lessonDate || "").trim();
  if (!baseDate) return null;

  const currentHour = parseLessonTimeToHour(lessonTime);
  const supabase = getBookingServerClient();

  const queryFields = "date,hour,booked_by,booked";
  const exactRes = await supabase
    .from("time_slots")
    .select(queryFields)
    .eq("booked", true)
    .eq("booked_by", normalizedClient)
    .gte("date", baseDate)
    .order("date", { ascending: true })
    .order("hour", { ascending: true })
    .limit(60);

  let rows = exactRes.data ?? [];
  if (exactRes.error) {
    return null;
  }

  // Fallback to case-insensitive match for historical name casing differences.
  if (rows.length === 0) {
    const ilikeRes = await supabase
      .from("time_slots")
      .select(queryFields)
      .eq("booked", true)
      .ilike("booked_by", normalizedClient)
      .gte("date", baseDate)
      .order("date", { ascending: true })
      .order("hour", { ascending: true })
      .limit(60);
    if (ilikeRes.error) return null;
    rows = ilikeRes.data ?? [];
  }

  for (const row of rows) {
    if (!row?.date || typeof row.hour !== "number") continue;

    const isAfterDate = row.date > baseDate;
    const isSameDateFutureHour =
      row.date === baseDate &&
      (currentHour === null ? true : row.hour > currentHour);

    if (isAfterDate || isSameDateFutureHour) {
      return formatSlotAsNextLesson(row.date, row.hour);
    }
  }

  return null;
}

function formatLessonDateForSubject(lessonDate?: string): string | null {
  const raw = (lessonDate || "").trim();
  if (!raw) return null;

  // Expect YYYY-MM-DD from schedule slot data.
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return raw;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day, 12, 0, 0);

  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function pickClosing(seed: string): { line: string; emoji: string } {
  const options = [
    { line: "Keep up the great work!", emoji: "💪" },
    { line: "Great effort today - keep building on these habits.", emoji: "🎾" },
    { line: "Nice work today - stay consistent with this plan.", emoji: "👏" },
    { line: "Excellent session today - keep practicing with intention.", emoji: "✅" },
    { line: "Strong work today - keep trusting the process.", emoji: "🔥" },
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
  message += `Here is a quick lesson update:\n\n`;

  if (parsed.key_areas_focused.length > 0) {
    message += `🎯 Key Areas Worked On with Coach Derek:\n`;
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
    message += `🏆 Goals Coach Derek Is Working Toward with You:\n`;
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
  message += `- Coach Derek's AI assistant`;
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
- Preserve technical specifics exactly when spoken (for example: topspin, slice, contact point, swing path, racquet face angle, footwork pattern, court positioning, target zones).
- If a stroke is mentioned, include the stroke + the technical cue in the same item.
- Example: if transcript says "topspin on the forehand stroke", output something like "Forehand topspin with a low-to-high swing path and brushing contact."
- Avoid vague rewrites like "Forehand improvement" when detailed mechanics were given.
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
    const lessonDate = (body.lessonDate || "").trim();
    const lessonTime = (body.lessonTime || "").trim();
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

    const parsedNextLesson = (parsedData.next_lesson_date || "").trim().toLowerCase();
    if (!parsedNextLesson || parsedNextLesson === "not specified") {
      const lookedUpNextLesson = await lookupNextLessonDateFromSchedule(
        clientName,
        lessonDate,
        lessonTime
      );
      if (lookedUpNextLesson) {
        parsedData.next_lesson_date = lookedUpNextLesson;
      }
    }

    const lessonDateInSubject = formatLessonDateForSubject(lessonDate);
    const subject = lessonDateInSubject
      ? `Lesson Update - ${parsedData.student_name} - ${lessonDateInSubject}`
      : `Lesson Update - ${parsedData.student_name}`;
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
