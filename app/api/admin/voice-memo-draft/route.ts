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

function splitSentences(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .trim()
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizePoint(text: string): string {
  const cleaned = cleanSentence(text)
    .replace(/^[-*]\s*/, "")
    .replace(/^okay\s+so\s+/i, "")
    .replace(/^so\s+/i, "")
    .replace(/^today\s+we\s+spent\s+a\s+lot\s+of\s+time\s+on\s+/i, "We focused on ")
    .replace(/^for\s+this\s+week\s+i\s+want\s+you\s+doing\s+/i, "Homework: do ")
    .replace(/^let'?s\s+tentatively\s+do\s+next\s+lesson\s+/i, "Next lesson: ")
    .replace(/^we\s+also\s+cleaned\s+up\s+/i, "We improved ");
  if (!cleaned) return "";
  const firstTwoSentences = splitSentences(cleaned).slice(0, 2).join(" ");
  const words = firstTwoSentences.split(/\s+/).filter(Boolean);
  const cappedWords = words.slice(0, 24).join(" ");
  const punctuated = /[.!?]$/.test(cappedWords) ? cappedWords : `${cappedWords}.`;
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1);
}

function dedupePoints(points: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const p of points) {
    const key = p.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
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

type StructuredDraft = {
  subject?: string;
  sections?: Array<{ title?: string; points?: string[] }>;
};

function extractStructured(raw: string): StructuredDraft | null {
  const fenced = raw.match(/```json\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || raw;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  const jsonString = candidate.slice(start, end + 1);
  try {
    return JSON.parse(jsonString) as StructuredDraft;
  } catch {
    return null;
  }
}

function formatBodyFromSections(input: {
  clientName: string;
  lessonDate: string;
  lessonTime: string;
  sections: Array<{ title: string; points: string[] }>;
}): string {
  const greeting = input.clientName === "your lesson" ? "Hi," : `Hi ${input.clientName},`;
  const contextLine = [input.lessonDate, input.lessonTime].filter(Boolean).join(" at ");
  const lines: string[] = [greeting, "", `Great work today${contextLine ? ` (${contextLine})` : ""}.`, ""];

  for (const section of input.sections) {
    if (!section.points.length) continue;
    lines.push(section.title);
    for (const point of section.points) {
      lines.push(`- ${point}`);
    }
    lines.push("");
  }

  lines.push("See you on court,");
  lines.push("Derek");
  return lines.join("\n");
}

function looksGeneric(body: string): boolean {
  const genericSnippets = [
    "continue the same focus points",
    "quality reps",
    "add extra match",
    "keep nutrition and recovery habits consistent",
    "we can confirm the next session timing",
    "technique and consistency work from today's session",
    "good effort today",
    "keep up the good work",
    "as discussed",
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
    .filter((s) => s.length >= 10);

  const subjectDate = input.lessonDate ? ` - ${input.lessonDate}` : "";
  const subject = `Lesson Recap for ${input.clientName}${subjectDate}`;

  const weightedKeywords = [
    "forehand","backhand","serve","return","footwork","consistency","depth","timing",
    "nutrition","diet","sleep","recovery","workout","mobility","match","set","tournament",
    "next lesson","monday","tuesday","wednesday","thursday","friday","saturday","sunday",
    "am","pm","reminder","focus","homework","drill",
  ];

  const scored = chunks.map((s) => {
    const lower = s.toLowerCase();
    let score = 0;
    for (const kw of weightedKeywords) {
      if (lower.includes(kw)) score += kw.includes(" ") ? 3 : 2;
    }
    if (/\d/.test(lower)) score += 1;
    if (s.length > 140) score -= 1;
    return { s, score };
  });

  const keyPoints = dedupePoints(
    scored
      .sort((a, b) => b.score - a.score)
      .filter((x) => x.score > 0)
      .slice(0, 5)
      .map((x) => normalizePoint(x.s))
      .filter(Boolean)
  ).slice(0, 4);

  const fallbackPoints =
    keyPoints.length > 0
      ? keyPoints
      : dedupePoints(chunks.slice(0, 3).map((s) => normalizePoint(s)).filter(Boolean)).slice(0, 3);

  const body = formatBodyFromSections({
    clientName: input.clientName,
    lessonDate: input.lessonDate,
    lessonTime: input.lessonTime,
    sections: [{ title: "Key Points", points: fallbackPoints }],
  });

  return { subject, body };
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
You are an elite tennis coaching assistant. Turn a coach's rambling voice note into a short, client-ready recap email.

Rules:
- Distill, do not transcribe.
- Never mirror the full transcript chronology.
- Keep only high-signal takeaways the client should remember.
- 3-6 points total, max two short sentences per point.
- Every point must come from transcript facts.
- No generic filler advice.
- Omit categories not mentioned.
- Allowed categories: Summary, Key Areas of Focus, Health / Training Notes, Matchplay Recommendations, Next Lesson, Quick Note.

Return STRICT JSON ONLY in this format:
{
  "subject": "string",
  "sections": [
    { "title": "Summary", "points": ["point 1", "point 2"] }
  ]
}

Context:
- Student: ${input.clientName || "Client"}
- Lesson date: ${input.lessonDate || "N/A"}
- Lesson time: ${input.lessonTime || "N/A"}

Transcript:
${input.transcript}
`.trim();

  try {
    const response = await model.generateContent(prompt);
    const text = response.response.text();
    const structured = extractStructured(text);
    if (structured?.subject && structured.sections && structured.sections.length > 0) {
      const sections = structured.sections
        .map((section) => ({
          title: (section.title || "").trim(),
          points: dedupePoints(
            (section.points || [])
              .map((p) => normalizePoint(p))
              .filter(Boolean)
          ).slice(0, 4),
        }))
        .filter((section) => section.title && section.points.length > 0)
        .slice(0, 5);

      if (sections.length > 0) {
        const body = formatBodyFromSections({
          clientName: input.clientName,
          lessonDate: input.lessonDate,
          lessonTime: input.lessonTime,
          sections,
        });
        if (looksGeneric(body)) return null;
        return { subject: structured.subject.trim(), body };
      }
    }

    const parsed = extractJsonObject(text);
    if (!parsed?.subject || !parsed?.body) return null;
    if (looksGeneric(parsed.body)) return null;
    return { subject: parsed.subject.trim(), body: parsed.body.trim() };
  } catch {
    return null;
  }
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
