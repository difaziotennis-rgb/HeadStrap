import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type DraftRequest = {
  clientName?: string;
  clientEmail?: string;
  lessonDate?: string;
  lessonTime?: string;
  transcript?: string;
};

type StructuredDraft = {
  subject: string;
  sections: Array<{ title: string; bullets: string[] }>;
};

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function safeJsonFromText(text: string): any | null {
  const fenced = text.match(/```json\s*([\s\S]*?)```/i);
  const source = fenced?.[1] || text;
  const start = source.indexOf("{");
  const end = source.lastIndexOf("}");
  if (start < 0 || end < start) return null;
  try {
    return JSON.parse(source.slice(start, end + 1));
  } catch {
    return null;
  }
}

function cleanBullet(text: string): string {
  const cleaned = normalizeLine(text)
    .replace(/^[-*]\s*/, "")
    .replace(/\b(um+|uh+|you know|sort of|kind of|basically)\b/gi, "")
    .trim();
  if (!cleaned) return "";

  const words = cleaned.split(/\s+/).filter(Boolean).slice(0, 22);
  const short = words.join(" ");
  const punctuated = /[.!?]$/.test(short) ? short : `${short}.`;
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1);
}

function dedupeBullets(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const normalized = item.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    out.push(item);
  }
  return out;
}

function normalizeStructuredDraft(raw: any, fallbackSubject: string): StructuredDraft | null {
  if (!raw || typeof raw !== "object") return null;
  const subject = typeof raw.subject === "string" && raw.subject.trim() ? raw.subject.trim() : fallbackSubject;
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];

  const sections = rawSections
    .map((section: any) => {
      const title = typeof section?.title === "string" ? section.title.trim() : "";
      const bullets = Array.isArray(section?.bullets)
        ? dedupeBullets(section.bullets.map((b: any) => cleanBullet(String(b || ""))).filter(Boolean))
        : [];
      return { title, bullets };
    })
    .filter((s) => s.title && s.bullets.length > 0)
    .slice(0, 6);

  if (!sections.length) return null;
  return { subject, sections };
}

function buildPrompt(input: { clientName: string; lessonDate: string; lessonTime: string; transcript: string }): string {
  return `
You are an assistant helping a tennis coach draft client follow-up emails from rough voice notes.

Goal:
- Transform rambling coaching notes into clean, logical, useful client bullets.
- DO NOT mirror or replay transcript wording.
- Correct grammar/spelling.
- Keep points concise and specific.

Hard rules:
- Output STRICT JSON only.
- JSON schema:
{
  "subject": "string",
  "sections": [
    { "title": "Key Areas of Focus", "bullets": ["bullet 1", "bullet 2"] }
  ]
}
- Use only sections that are actually mentioned.
- Allowed section titles:
  - Summary
  - Key Areas of Focus
  - Training Plan
  - Health / Recovery
  - Matchplay Recommendations
  - Next Lesson
  - Quick Note
- 3 to 8 bullets total.
- Each bullet must be at most two short sentences (prefer one).
- No generic filler such as "keep it up", "continue quality reps", "as discussed".
- Bullets must be specific to transcript details.

Context:
- Client: ${input.clientName || "Client"}
- Lesson date: ${input.lessonDate || "N/A"}
- Lesson time: ${input.lessonTime || "N/A"}

Transcript:
${input.transcript}
`.trim();
}

async function callOpenAI(prompt: string): Promise<any | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  const model = process.env.VOICE_DRAFT_OPENAI_MODEL || "gpt-4.1";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return safeJsonFromText(content);
}

async function callGroq(prompt: string): Promise<any | null> {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const model = process.env.VOICE_DRAFT_GROQ_MODEL || "llama-3.3-70b-versatile";
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: "Return only valid JSON." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return null;
  return safeJsonFromText(content);
}

async function callGemini(prompt: string): Promise<any | null> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const modelName = process.env.GEMINI_PROGRESS_EMAIL_MODEL || "gemini-2.5-pro";
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: modelName });
    const response = await model.generateContent(prompt);
    return safeJsonFromText(response.response.text());
  } catch {
    return null;
  }
}

function deterministicFallback(input: {
  clientName: string;
  lessonDate: string;
  lessonTime: string;
  transcript: string;
}): StructuredDraft {
  const clauses = normalizeLine(input.transcript)
    .replace(/\s+and\s+then\s+/gi, ". ")
    .replace(/,\s+and\s+/gi, ". ")
    .replace(/\s+also\s+/gi, ". ")
    .split(/[.!?;]/)
    .map((c) => cleanBullet(c))
    .filter((c) => c.length >= 12);

  const bullets = dedupeBullets(clauses).slice(0, 5);

  return {
    subject: `Lesson Recap for ${input.clientName}${input.lessonDate ? ` - ${input.lessonDate}` : ""}`,
    sections: [
      {
        title: "Key Points",
        bullets: bullets.length ? bullets : ["We reviewed your session details and set clear focus points for next time."],
      },
    ],
  };
}

function formatBody(clientName: string, lessonDate: string, lessonTime: string, sections: StructuredDraft["sections"]): string {
  const greeting = clientName === "your lesson" ? "Hi," : `Hi ${clientName},`;
  const contextLine = [lessonDate, lessonTime].filter(Boolean).join(" at ");
  const lines: string[] = [greeting, "", `Great work today${contextLine ? ` (${contextLine})` : ""}.`, ""];

  for (const section of sections) {
    if (!section.bullets.length) continue;
    lines.push(section.title);
    for (const bullet of section.bullets) {
      lines.push(`- ${bullet}`);
    }
    lines.push("");
  }

  lines.push("See you on court,");
  lines.push("Derek");
  return lines.join("\n");
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

    const fallbackSubject = `Lesson Recap for ${clientName}${lessonDate ? ` - ${lessonDate}` : ""}`;
    const prompt = buildPrompt({ clientName, lessonDate, lessonTime, transcript });

    const candidates = await Promise.all([
      callOpenAI(prompt),
      callGroq(prompt),
      callGemini(prompt),
    ]);

    let draft: StructuredDraft | null = null;
    for (const candidate of candidates) {
      const normalized = normalizeStructuredDraft(candidate, fallbackSubject);
      if (normalized) {
        draft = normalized;
        break;
      }
    }

    if (!draft) {
      draft = deterministicFallback({ clientName, lessonDate, lessonTime, transcript });
    }

    return NextResponse.json({
      subject: draft.subject,
      to: clientEmail || "",
      body: formatBody(clientName, lessonDate, lessonTime, draft.sections),
      meta: {
        source: draft === null ? "unknown" : "ai-first-multi-provider-v1",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate draft email.", details: String(error) },
      { status: 500 }
    );
  }
}
