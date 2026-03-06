import { NextResponse } from "next/server";

type DraftRequest = {
  clientName?: string;
  clientEmail?: string;
  lessonDate?: string;
  lessonTime?: string;
  transcript?: string;
};

type Section = {
  title: string;
  points: string[];
};

function normalizeLine(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function cleanText(value: string): string {
  return normalizeLine(value)
    .replace(/\b(um+|uh+|you know|sort of|kind of|basically)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function splitIntoClauses(text: string): string[] {
  const normalized = cleanText(text)
    .replace(/\s+and\s+then\s+/gi, ". ")
    .replace(/,\s+and\s+if\s+/gi, ". If ")
    .replace(/,\s+and\s+/gi, ". ")
    .replace(/\s+also\s+/gi, ". ")
    .replace(/\s+plus\s+/gi, ". ")
    .replace(/\s+then\s+/gi, ". ");

  const parts = normalized
    .split(/(?:[.!?;]|,\s+(?=(?:for|next|we|you|on|in|at|try|do|schedule|if)\b))/i)
    .map((s) => cleanText(s))
    .filter((s) => s.length >= 12)
    .filter((s) => s.split(/\s+/).length >= 5);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const key = part.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(part);
  }
  return out;
}

function splitLongClause(clause: string): string[] {
  const normalized = cleanText(clause);
  if (normalized.split(/\s+/).length < 14) return [normalized];

  const pieces = normalized
    .replace(/\s+and\s+then\s+/gi, ". ")
    .replace(/,\s+and\s+/gi, ". ")
    .replace(/\s+and\s+/gi, ". ")
    .split(/[.]/)
    .map((s) => cleanText(s))
    .filter((s) => s.length >= 10);

  return pieces.length > 1 ? pieces : [normalized];
}

function includesAny(text: string, terms: string[]): boolean {
  const lower = text.toLowerCase();
  return terms.some((term) => lower.includes(term));
}

function normalizePoint(clause: string): string {
  const cleaned = cleanText(clause)
    .replace(/^okay\s+so\s+/i, "")
    .replace(/^so\s+/i, "")
    .replace(/^today\s+we\s+spent\s+a\s+lot\s+of\s+time\s+on\s+/i, "We focused on ")
    .replace(/^we\s+worked\s+on\s+/i, "We focused on ")
    .replace(/^we\s+also\s+cleaned\s+up\s+/i, "We improved ")
    .replace(/^for\s+this\s+week\s+i\s+want\s+you\s+doing\s+/i, "Homework: do ")
    .replace(/^for\s+match\s+play,\s*/i, "")
    .replace(/^let'?s\s+tentatively\s+do\s+next\s+lesson\s+/i, "Next lesson: ")
    .replace(/,\s*$/, "");

  if (!cleaned) return "";

  const words = cleaned
    .replace(/\s+next\s+lesson\s+sunday\s+at\s+/i, " Next lesson: Sunday at ")
    .replace(/\s+next\s+lesson\s+on\s+/i, " Next lesson: ")
    .split(/\s+/)
    .filter(Boolean);
  let capped = words.join(" ");
  if (words.length > 24) {
    const first24 = words.slice(0, 24).join(" ");
    const lastComma = first24.lastIndexOf(",");
    capped = lastComma > 20 ? first24.slice(0, lastComma) : first24;
  }
  const punctuated = /[.!?]$/.test(capped) ? capped : `${capped}.`;
  return punctuated.charAt(0).toUpperCase() + punctuated.slice(1);
}

function pushPoint(target: string[], point: string, max: number): void {
  if (!point || target.length >= max) return;
  const key = point.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
  const exists = target.some(
    (p) => p.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim() === key
  );
  if (!exists) target.push(point);
}

function distillTranscript(transcript: string): Section[] {
  const clauses = splitIntoClauses(transcript).flatMap(splitLongClause);

  const focusTerms = [
    "forehand","backhand","serve","return","volley","footwork","timing","consistency","depth","contact","toss","rally","approach","slice","topspin","pattern",
  ];
  const healthTerms = [
    "nutrition","diet","hydrate","hydration","sleep","recovery","workout","mobility","stretch","yoga","injury","pain","tight","warm up","cool down",
  ];
  const matchTerms = [
    "match","tournament","point play","practice set","ladder","tie break","first-ball","game plan","compete",
  ];
  const nextTerms = [
    "next lesson","next week","tentative","am","pm",
  ];
  const personalTerms = [
    "great job","awesome","loved your attitude","proud","keep it up","well done","good effort",
  ];
  const homeworkTerms = ["homework", "for this week", "do ", "practice", "drill", "reps", "every day"];

  const focus: string[] = [];
  const homework: string[] = [];
  const health: string[] = [];
  const match: string[] = [];
  const next: string[] = [];
  const personal: string[] = [];
  const catchAll: string[] = [];

  for (const clause of clauses) {
    const point = normalizePoint(clause);
    if (!point) continue;

    if (includesAny(clause, nextTerms)) {
      pushPoint(next, point, 2);
      continue;
    }
    if (includesAny(clause, personalTerms)) {
      pushPoint(personal, point, 2);
      continue;
    }
    if (includesAny(clause, matchTerms)) {
      pushPoint(match, point, 3);
      continue;
    }
    if (includesAny(clause, healthTerms)) {
      pushPoint(health, point, 3);
      continue;
    }
    if (includesAny(clause, homeworkTerms)) {
      pushPoint(homework, point, 3);
      continue;
    }
    if (includesAny(clause, focusTerms)) {
      pushPoint(focus, point, 4);
      continue;
    }
    pushPoint(catchAll, point, 4);
  }

  const sections: Section[] = [];
  if (focus.length) sections.push({ title: "Key Areas of Focus", points: focus });
  if (homework.length) sections.push({ title: "Training Plan", points: homework });
  if (health.length) sections.push({ title: "Health / Recovery", points: health });
  if (match.length) sections.push({ title: "Matchplay Recommendations", points: match });
  if (next.length) sections.push({ title: "Next Lesson", points: next });
  if (personal.length) sections.push({ title: "Quick Note", points: personal });

  if (sections.length === 0) {
    sections.push({ title: "Key Points", points: catchAll.slice(0, 4) });
  } else if (catchAll.length > 0 && sections.length < 3) {
    sections.push({ title: "Key Points", points: catchAll.slice(0, 2) });
  }

  return sections;
}

function formatEmailBody(clientName: string, lessonDate: string, lessonTime: string, sections: Section[]): string {
  const greeting = clientName === "your lesson" ? "Hi," : `Hi ${clientName},`;
  const contextLine = [lessonDate, lessonTime].filter(Boolean).join(" at ");
  const lines: string[] = [
    greeting,
    "",
    `Great work today${contextLine ? ` (${contextLine})` : ""}.`,
    "",
  ];

  for (const section of sections) {
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

    const subjectDate = lessonDate ? ` - ${lessonDate}` : "";
    const subject = `Lesson Recap for ${clientName}${subjectDate}`;
    const sections = distillTranscript(transcript);
    const bodyText = formatEmailBody(clientName, lessonDate, lessonTime, sections);

    return NextResponse.json({
      subject,
      to: clientEmail || "",
      body: bodyText,
      meta: {
        source: "deterministic-distiller-v1",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to generate draft email.", details: String(error) },
      { status: 500 }
    );
  }
}
