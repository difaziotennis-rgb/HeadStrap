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

function toBullets(items: string[], max = 3): string[] {
  return items
    .filter((item) => item.length > 2)
    .slice(0, max)
    .map((item) => `- ${item}`);
}

function hasAny(text: string, terms: string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
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

    const chunks = sentenceChunks(transcript);
    const todayFocus = toBullets(chunks.slice(0, 4), 3);
    const nextSteps = toBullets(chunks.slice(2, 8), 3);
    const lower = transcript.toLowerCase();

    const subjectDate = lessonDate ? ` - ${lessonDate}` : "";
    const subject = `Lesson Recap for ${clientName}${subjectDate}`;

    const contextLine = [lessonDate, lessonTime].filter(Boolean).join(" at ");
    const greeting = clientName === "your lesson" ? "Hi," : `Hi ${clientName},`;

    const bodyLines: string[] = [
      greeting,
      "",
      `Great work today${contextLine ? ` (${contextLine})` : ""}. Here is your quick recap and what to focus on before we meet again.`,
      "",
    ];

    bodyLines.push("Summary");
    bodyLines.push(...(todayFocus.length > 0 ? todayFocus : ["- Technique and consistency work from today's session."]));
    bodyLines.push("");

    if (hasAny(lower, ["focus", "key area", "forehand", "backhand", "serve", "volley", "footwork", "consistency", "timing"])) {
      bodyLines.push("Key Areas of Focus");
      bodyLines.push(...(nextSteps.length > 0 ? nextSteps : ["- Continue the same focus points with quality reps."]));
      bodyLines.push("");
    }
    if (hasAny(lower, ["nutrition", "diet", "hydrate", "hydration", "sleep", "recovery", "workout", "mobility", "stretch", "yoga"])) {
      bodyLines.push("Health and Recovery Notes");
      bodyLines.push("- Keep nutrition and recovery habits consistent between sessions.");
      bodyLines.push("");
    }
    if (hasAny(lower, ["match", "set", "tournament", "point play", "play more", "practice match", "extra play"])) {
      bodyLines.push("Matchplay Recommendations");
      bodyLines.push("- Add extra point-play or match reps before our next lesson.");
      bodyLines.push("");
    }
    if (hasAny(lower, ["next lesson", "next time", "next week", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday", "am", "pm"])) {
      bodyLines.push("Next Lesson");
      bodyLines.push("- I noted your scheduling details and we can confirm the next session timing.");
      bodyLines.push("");
    }

    bodyLines.push("If you have any questions, just reply to this email.");
    bodyLines.push("");
    bodyLines.push("See you on court,");
    bodyLines.push("Derek");

    return NextResponse.json({
      subject,
      to: clientEmail || "",
      body: bodyLines.join("\n"),
      meta: {
        source: "trial-rule-based-draft",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate draft email.", details: String(error) },
      { status: 500 }
    );
  }
}
