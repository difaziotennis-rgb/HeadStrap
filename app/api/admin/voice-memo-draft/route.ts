import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type DraftRequest = {
  clientName?: string;
  clientEmail?: string;
  lessonDate?: string;
  lessonTime?: string;
  transcript?: string;
};

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceChunks(text: string): string[] {
  const normalized = normalizeLine(text);
  if (!normalized) return [];
  return normalized
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function cleanSentence(value: string): string {
  return value
    .replace(/\b(um+|uh+|like|you know|sort of|kind of|basically)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sentenceToBullet(value: string): string {
  const cleaned = cleanSentence(value);
  const lower = cleaned.toLowerCase();
  if (lower.startsWith("we ")) return `- ${cleaned}`;
  if (lower.startsWith("i ")) return `- ${cleaned}`;
  return `- ${cleaned.charAt(0).toUpperCase()}${cleaned.slice(1)}`;
}

function includesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function extractJsonObject(raw: string): { subject?: string; body?: string } | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  const jsonString = candidate.slice(start, end + 1);
  try {
    return JSON.parse(jsonString) as { subject?: string; body?: string };
  } catch {
    return null;
  }
}

function looksGeneric(body: string): boolean {
  const genericSnippets = [
    "continue the same focus points",
    "quality reps",
    "add extra match",
    "keep nutrition and recovery habits consistent",
    "we can confirm the next session timing",
    "technique and consistency work from today's session",
  ];
  const lower = body.toLowerCase();
  return genericSnippets.some((s) => lower.includes(s));
}

function buildExtractiveDraft(input: {
  clientName: string;
  lessonDate: string;
  lessonTime: string;
  transcript: string;
}): { subject: string; body: string } {
  const chunks = sentenceChunks(input.transcript)
    .map(cleanSentence)
    .filter((s) => s.length >= 8);

  const subjectDate = input.lessonDate ? ` - ${input.lessonDate}` : "";
  const subject = `Lesson Recap for ${input.clientName}${subjectDate}`;
  const greeting = input.clientName === "your lesson" ? "Hi," : `Hi ${input.clientName},`;
  const contextLine = [input.lessonDate, input.lessonTime].filter(Boolean).join(" at ");

  const used = new Set<string>();
  const pick = (terms: string[], limit: number): string[] => {
    const picks: string[] = [];
    for (const sentence of chunks) {
      if (picks.length >= limit) break;
      if (used.has(sentence)) continue;
      if (!includesAny(sentence, terms)) continue;
      picks.push(sentenceToBullet(sentence));
      used.add(sentence);
    }
    return picks;
  };

  const sections: Array<{ title: string; bullets: string[] }> = [];

  const summary = chunks
    .filter((s) => !used.has(s))
    .slice(0, 3)
    .map((s) => {
      used.add(s);
      return sentenceToBullet(s);
    });
  if (summary.length > 0) sections.push({ title: "Summary", bullets: summary });

  const focus = pick(
    [
      "forehand",
      "backhand",
      "serve",
      "volley",
      "return",
      "footwork",
      "timing",
      "contact",
      "consistency",
      "depth",
      "net",
      "split step",
      "rally",
      "approach",
      "slice",
      "topspin",
    ],
    4
  );
  if (focus.length > 0) sections.push({ title: "Key Areas of Focus", bullets: focus });

  const health = pick(
    [
      "nutrition",
      "diet",
      "hydrate",
      "hydration",
      "sleep",
      "recovery",
      "workout",
      "mobility",
      "stretch",
      "yoga",
      "injury",
      "pain",
      "warm up",
      "cool down",
    ],
    3
  );
  if (health.length > 0) sections.push({ title: "Health / Training Notes", bullets: health });

  const matchplay = pick(
    [
      "match",
      "set",
      "tournament",
      "point play",
      "practice set",
      "compete",
      "ladder",
      "play with",
      "drill match",
      "tie break",
    ],
    3
  );
  if (matchplay.length > 0) sections.push({ title: "Matchplay Recommendations", bullets: matchplay });

  const nextLesson = pick(
    [
      "next lesson",
      "next week",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
      "am",
      "pm",
      ":00",
      ":30",
      "at ",
      "schedule",
    ],
    2
  );
  if (nextLesson.length > 0) sections.push({ title: "Next Lesson", bullets: nextLesson });

  const personal = pick(
    ["great job", "proud", "keep it up", "good work", "awesome", "nice work", "message", "reminder"],
    2
  );
  if (personal.length > 0) sections.push({ title: "Quick Note", bullets: personal });

  // If categorization found nothing, still provide cleaned bullets only from transcript.
  if (sections.length === 0) {
    sections.push({
      title: "Session Notes",
      bullets: chunks.slice(0, 4).map(sentenceToBullet),
    });
  }

  const bodyLines: string[] = [
    greeting,
    "",
    `Great work today${contextLine ? ` (${contextLine})` : ""}.`,
    "",
  ];

  for (const section of sections) {
    bodyLines.push(section.title);
    bodyLines.push(...section.bullets);
    bodyLines.push("");
  }

  bodyLines.push("See you on court,");
  bodyLines.push("Derek");

  return { subject, body: bodyLines.join("\n") };
}

async function generateWithGemini(input: {
  clientName: string;
  lessonDate: string;
  lessonTime: string;
  transcript: string;
}): Promise<{ subject: string; body: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const modelName = process.env.GEMINI_PROGRESS_EMAIL_MODEL || "gemini-2.5-pro";
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName });

  const prompt = `
You are an elite tennis coaching assistant. Turn the raw voice transcript into a polished, concise lesson recap email.

Rules:
- Keep the tone professional, warm, and actionable.
- Write for the student directly.
- Keep it short enough to read in under 1 minute.
- Lightly edit and clean the coach's wording so it reads clearly.
- Keep structure simple and elegant for quick reading.
- Include only what the coach explicitly mentions.
- If a category is not mentioned, do not include it.
- Never insert generic filler advice.
- Every bullet must reflect a concrete point that appears in the transcript.
- Supported categories (use only when present in transcript):
  1) Summary of what we worked on
  2) Key areas of focus
  3) Nutrition / health / workout suggestions
  4) Matchplay or extra-play recommendations
  5) Next lesson date/time or potential scheduling notes
  6) Quick personal message from coach
- Use short bullets under each included category.
- Do not invent specific biomechanics details not implied by transcript.
- End with a brief encouraging sign-off from Derek.
- Return only strict JSON with keys: "subject" and "body".

Context:
- Student: ${input.clientName || "Client"}
- Lesson date: ${input.lessonDate || "N/A"}
- Lesson time: ${input.lessonTime || "N/A"}

Transcript:
${input.transcript}
`.trim();

  const response = await model.generateContent(prompt);
  const text = response.response.text();
  const parsed = extractJsonObject(text);
  if (!parsed?.subject || !parsed?.body) return null;
  if (looksGeneric(parsed.body)) return null;
  return { subject: parsed.subject.trim(), body: parsed.body.trim() };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as DraftRequest;
    const clientName = (body.clientName || "").trim() || "your lesson";
    const clientEmail = (body.clientEmail || "").trim();
    const lessonDate = (body.lessonDate || "").trim();
    const lessonTime = (body.lessonTime || "").trim();
    const transcript = (body.transcript || "").trim();

    if (!transcript) {
      return NextResponse.json({ error: "Transcript is required." }, { status: 400 });
    }

    // Preferred path: strongest available model in backend config.
    // Default is Gemini 2.5 Pro unless GEMINI_PROGRESS_EMAIL_MODEL is set.
    const modelDraft = await generateWithGemini({
      clientName,
      lessonDate,
      lessonTime,
      transcript,
    });
    if (modelDraft) {
      return NextResponse.json({
        subject: modelDraft.subject,
        to: clientEmail || "",
        body: modelDraft.body,
        meta: {
          source: "gemini",
          model: process.env.GEMINI_PROGRESS_EMAIL_MODEL || "gemini-2.5-pro",
        },
      });
    }

    const extractive = buildExtractiveDraft({
      clientName,
      lessonDate,
      lessonTime,
      transcript,
    });

    return NextResponse.json({
      subject: extractive.subject,
      to: clientEmail || "",
      body: extractive.body,
      meta: {
        source: "extractive-transcript-draft",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate draft email.", details: String(error) },
      { status: 500 }
    );
  }
}
