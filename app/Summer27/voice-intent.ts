export type VoiceIntentKind =
  | "check_court"
  | "book_court"
  | "check_clinic"
  | "book_clinic"
  | "cancel"
  | "move"
  | "my_day"
  | "check_lesson"
  | "request_lesson"
  | "check_stringing"
  | "order_stringing"
  | "check_event"
  | "book_event"
  | "check_play"
  | "prices"
  | "unknown";

export type VoiceIntent = {
  intent: VoiceIntentKind;
  date: string | null;
  dateTo: string | null;
  hour: number | null;
  hourTo: number | null;
  timeOfDay: "morning" | "afternoon" | "evening" | null;
  clinicHint: string | null;
  courtId: "court-1" | "court-2" | null;
  childName: string | null;
  eventHint: string | null;
  stringHint: string | null;
  tension: string | null;
  priceTopic: string | null;
};

const KINDS: VoiceIntentKind[] = [
  "check_court",
  "book_court",
  "check_clinic",
  "book_clinic",
  "cancel",
  "move",
  "my_day",
  "check_lesson",
  "request_lesson",
  "check_stringing",
  "order_stringing",
  "check_event",
  "book_event",
  "check_play",
  "prices",
  "unknown",
];

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

export function weekendRange(now: Date): { date: string; dateTo: string } {
  const start = startOfDay(now);
  const day = start.getDay();
  const sat = addDays(start, day === 6 ? 0 : day === 0 ? -1 : 6 - day);
  return { date: isoDate(sat), dateTo: isoDate(addDays(sat, 1)) };
}

function parseHourToken(raw: string, mer?: string): number | null {
  let h = Number(raw);
  if (!Number.isFinite(h) || h > 23) return null;
  const m = (mer || "").replace(/\./g, "");
  if (m === "pm" && h < 12) h += 12;
  if (m === "am" && h === 12) h = 0;
  if (!m && h >= 1 && h <= 7) h += 12;
  return h;
}

export function parseHour(text: string): number | null {
  const t = text.toLowerCase();
  if (/\bnoon\b/.test(t)) return 12;
  const m = t.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!m) return null;
  return parseHourToken(m[1], m[3]);
}

function parseHourTo(text: string): number | null {
  const t = text.toLowerCase();
  const m = t.match(/\b(?:to|until|at)\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!m) return null;
  return parseHourToken(m[1], m[3]);
}

function parseTimeOfDay(text: string): VoiceIntent["timeOfDay"] {
  const t = text.toLowerCase();
  if (/\bsat(?:urday)?\s+a\.?m\.?\b/.test(t) || /\bsun(?:day)?\s+a\.?m\.?\b/.test(t)) return "morning";
  if (/\b(morning|a\.?m\.?)\b/.test(t) && !/\d/.test(t)) return "morning";
  if (/\b(afternoon)\b/.test(t)) return "afternoon";
  if (/\b(evening|night)\b/.test(t)) return "evening";
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

function parseChildName(text: string): string | null {
  const m =
    text.match(/\b(?:put|enroll|sign(?:\s+up)?)\s+([A-Z][a-z]+|[A-Za-z]+)\s+(?:in|for|up)\b/) ||
    text.match(/\bfor\s+([A-Z][a-z]+|[A-Za-z]+)(?:\s+in|\s+for)?\b/) ||
    text.match(/\b([A-Z][a-z]{2,})\s+(?:in|into)\s+(?:the\s+)?(?:junior|clinic)/i);
  if (!m) return null;
  const name = m[1];
  const skip = new Set(["my", "the", "a", "an", "me", "our", "his", "her", "their", "junior", "juniors"]);
  if (skip.has(name.toLowerCase())) return null;
  return name;
}

function parseTension(text: string): string | null {
  const m = text.match(/\b(\d{2})\s*(?:lbs?|pounds?)?\b/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 40 || n > 70) return null;
  return String(n);
}

function parseStringHint(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bpoly(?:ester)?\b/.test(t)) return "poly";
  if (/\bgut\b/.test(t) && /\bhybrid\b/.test(t)) return "hybrid-gut";
  if (/\bnatural\s+gut\b|\bgut\b/.test(t)) return "gut";
  if (/\bmulti/.test(t)) return "multifilament";
  if (/\bsynthetic\b|\bsyn\s+gut\b/.test(t)) return "synthetic";
  if (/\bhybrid\b/.test(t)) return "hybrid";
  if (/\bown string\b/.test(t)) return "own";
  return null;
}

function parsePriceTopic(text: string): string | null {
  const t = text.toLowerCase();
  if (/\blesson/.test(t)) return "lesson";
  if (/\bclinic|class/.test(t)) return "clinic";
  if (/\bstring|restring|racket/.test(t)) return "stringing";
  if (/\bevent|tournament|championship/.test(t)) return "event";
  if (/\bcourt/.test(t)) return "court";
  return "all";
}

function emptyIntent(partial: Partial<VoiceIntent>): VoiceIntent {
  return {
    intent: partial.intent || "unknown",
    date: partial.date ?? null,
    dateTo: partial.dateTo ?? null,
    hour: partial.hour ?? null,
    hourTo: partial.hourTo ?? null,
    timeOfDay: partial.timeOfDay ?? null,
    clinicHint: partial.clinicHint ?? null,
    courtId: partial.courtId ?? null,
    childName: partial.childName ?? null,
    eventHint: partial.eventHint ?? null,
    stringHint: partial.stringHint ?? null,
    tension: partial.tension ?? null,
    priceTopic: partial.priceTopic ?? null,
  };
}

export function parseVoiceFallback(transcript: string, now = new Date()): VoiceIntent {
  const t = transcript.toLowerCase();
  const hour = parseHour(t);
  const hourTo = /\bto\b/.test(t) ? parseHourTo(t) : null;
  const timeOfDay = parseTimeOfDay(t);
  let date = parseDate(t, now);
  let dateTo: string | null = null;
  if (/\bweekend\b/.test(t)) {
    const w = weekendRange(now);
    date = w.date;
    dateTo = w.dateTo;
  }
  let courtId: VoiceIntent["courtId"] = null;
  if (/\bcourt\s*3\b/.test(t)) courtId = "court-1";
  if (/\bcourt\s*4\b/.test(t)) courtId = "court-2";
  const childName = parseChildName(transcript);
  const clinicTalk = /\b(clinic|class|cardio|tennis 101|point play|juniors?)\b/.test(t);
  const book = /\b(book|reserve|sign me|enroll|join|put)\b/.test(t);

  if (/\b(how much|price|cost|rate|rates|charge)\b/.test(t)) {
    return emptyIntent({ intent: "prices", priceTopic: parsePriceTopic(t), date, hour, timeOfDay, courtId });
  }
  if (/\b(move|reschedule|change .+ to)\b/.test(t)) {
    return emptyIntent({ intent: "move", date, dateTo, hour, hourTo: hourTo || hour, timeOfDay, courtId, clinicHint: clinicTalk ? transcript : null });
  }
  if (/\b(cancel|drop|remove me)\b/.test(t)) {
    return emptyIntent({ intent: "cancel", date, hour, timeOfDay, courtId, clinicHint: clinicTalk ? transcript : null, childName });
  }
  if (/\b(what do i have|my (day|week|weekend|bookings|schedule)|am i booked)\b/.test(t)) {
    return emptyIntent({ intent: "my_day", date, dateTo, hour, timeOfDay, courtId });
  }
  if (/\b(string|restring|racket ready|poly|gut)\b/.test(t)) {
    const order = /\b(order|drop|restring|string my)\b/.test(t);
    return emptyIntent({
      intent: order || parseStringHint(t) ? "order_stringing" : "check_stringing",
      date,
      stringHint: parseStringHint(t),
      tension: parseTension(t),
    });
  }
  if (/\b(lesson|derek)\b/.test(t) && !clinicTalk) {
    return emptyIntent({
      intent: book || /\brequest\b/.test(t) ? "request_lesson" : "check_lesson",
      date: date || isoDate(now),
      hour,
      timeOfDay,
    });
  }
  if (/\b(event|tournament|championship|105|wimbledon|social)\b/.test(t)) {
    return emptyIntent({
      intent: book ? "book_event" : "check_event",
      date,
      eventHint: transcript,
    });
  }
  if (/\b(looking for a game|hit with|anyone (playing|free)|lfg|find a game)\b/.test(t)) {
    return emptyIntent({ intent: "check_play", date: date || isoDate(now), hour, timeOfDay, courtId });
  }
  if (clinicTalk || childName) {
    return emptyIntent({
      intent: book || childName ? "book_clinic" : "check_clinic",
      date,
      hour,
      timeOfDay,
      clinicHint: transcript,
      childName,
    });
  }
  if (book && (/\bcourt/.test(t) || hour != null)) {
    return emptyIntent({ intent: "book_court", date: date || isoDate(now), hour, timeOfDay, courtId });
  }
  if (/\b(court|open time|court time)\b/.test(t) || hour != null) {
    return emptyIntent({ intent: "check_court", date: date || isoDate(now), hour, timeOfDay, courtId });
  }
  return emptyIntent({ intent: "unknown", date, hour, timeOfDay, clinicHint: transcript, courtId, childName });
}

export function mergeIntent(parsed: Partial<VoiceIntent>, fallback: VoiceIntent): VoiceIntent {
  const intent = KINDS.includes(parsed.intent as VoiceIntentKind) ? (parsed.intent as VoiceIntentKind) : fallback.intent;
  return {
    intent,
    date: parsed.date ?? fallback.date,
    dateTo: parsed.dateTo ?? fallback.dateTo,
    hour: typeof parsed.hour === "number" ? parsed.hour : fallback.hour,
    hourTo: typeof parsed.hourTo === "number" ? parsed.hourTo : fallback.hourTo,
    timeOfDay: parsed.timeOfDay ?? fallback.timeOfDay,
    clinicHint: parsed.clinicHint ?? fallback.clinicHint,
    courtId: parsed.courtId ?? fallback.courtId,
    childName: parsed.childName ?? fallback.childName,
    eventHint: parsed.eventHint ?? fallback.eventHint,
    stringHint: parsed.stringHint ?? fallback.stringHint,
    tension: parsed.tension ?? fallback.tension,
    priceTopic: parsed.priceTopic ?? fallback.priceTopic,
  };
}
