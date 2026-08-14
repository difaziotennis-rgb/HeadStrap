export type VoiceIntent = {
  intent: "check_court" | "book_court" | "check_clinic" | "book_clinic" | "unknown";
  date: string | null;
  hour: number | null;
  timeOfDay: "morning" | "afternoon" | "evening" | null;
  clinicHint: string | null;
  courtId: "court-1" | "court-2" | null;
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function isoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function nextWeekday(from: Date, jsDay: number) {
  const start = startOfDay(from);
  for (let i = 0; i <= 7; i++) {
    const d = addDays(start, i);
    if (d.getDay() === jsDay) return d;
  }
  return start;
}

function parseHour(text: string): number | null {
  const t = text.toLowerCase();
  const noon = /\bnoon\b/.test(t);
  if (noon) return 12;
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!m) return null;
  let h = Number(m[1]);
  const mer = (m[3] || "").replace(/\./g, "");
  if (h > 23) return null;
  if (mer === "pm" && h < 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  if (!mer && h >= 1 && h <= 7) h += 12;
  if (h < 7 || h > 20) return h >= 0 && h <= 23 ? h : null;
  return h;
}

function parseTimeOfDay(text: string): VoiceIntent["timeOfDay"] {
  const t = text.toLowerCase();
  if (/\b(morning|a\.?m\.?)\b/.test(t) && !/\d/.test(t)) return "morning";
  if (/\b(afternoon)\b/.test(t)) return "afternoon";
  if (/\b(evening|night)\b/.test(t)) return "evening";
  if (/\bsat(?:urday)?\s+a\.?m\.?\b/.test(t) || /\bsun(?:day)?\s+a\.?m\.?\b/.test(t)) return "morning";
  return null;
}

function parseDate(text: string, now: Date): string | null {
  const t = text.toLowerCase();
  if (/\btoday\b/.test(t)) return isoDate(now);
  if (/\btomorrow\b/.test(t)) return isoDate(addDays(now, 1));
  const days: [RegExp, number][] = [
    [/\bsunday\b|\bsun\b/, 0],
    [/\bmonday\b|\bmon\b/, 1],
    [/\btuesday\b|\btue\b/, 2],
    [/\bwednesday\b|\bwed\b/, 3],
    [/\bthursday\b|\bthu\b/, 4],
    [/\bfriday\b|\bfri\b/, 5],
    [/\bsaturday\b|\bsat\b/, 6],
  ];
  for (const [re, day] of days) {
    if (re.test(t)) return isoDate(nextWeekday(now, day));
  }
  return null;
}

export function parseVoiceFallback(transcript: string, now = new Date()): VoiceIntent {
  const t = transcript.toLowerCase();
  const hour = parseHour(t);
  const timeOfDay = parseTimeOfDay(t);
  const date = parseDate(t, now);
  const clinicTalk = /\b(clinic|class|cardio|tennis 101|point play|juniors?)\b/.test(t);
  const courtTalk = /\b(court|courts|open time|court time)\b/.test(t);
  const book = /\b(book|reserve|sign me|enroll|join)\b/.test(t);
  let courtId: VoiceIntent["courtId"] = null;
  if (/\bcourt\s*3\b/.test(t)) courtId = "court-1";
  if (/\bcourt\s*4\b/.test(t)) courtId = "court-2";

  if (clinicTalk && book) {
    return { intent: "book_clinic", date, hour, timeOfDay, clinicHint: transcript, courtId };
  }
  if (clinicTalk) {
    return { intent: "check_clinic", date, hour, timeOfDay, clinicHint: transcript, courtId };
  }
  if (book || (courtTalk && /\bbook\b/.test(t))) {
    return { intent: "book_court", date: date || isoDate(now), hour, timeOfDay, clinicHint: null, courtId };
  }
  if (courtTalk || hour != null) {
    return { intent: "check_court", date: date || isoDate(now), hour, timeOfDay, clinicHint: null, courtId };
  }
  return { intent: "unknown", date, hour, timeOfDay, clinicHint: transcript, courtId };
}

export function mergeIntent(parsed: Partial<VoiceIntent>, fallback: VoiceIntent): VoiceIntent {
  return {
    intent: parsed.intent || fallback.intent,
    date: parsed.date ?? fallback.date,
    hour: typeof parsed.hour === "number" ? parsed.hour : fallback.hour,
    timeOfDay: parsed.timeOfDay ?? fallback.timeOfDay,
    clinicHint: parsed.clinicHint ?? fallback.clinicHint,
    courtId: parsed.courtId ?? fallback.courtId,
  };
}
