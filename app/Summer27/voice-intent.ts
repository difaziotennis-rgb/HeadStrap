import { parseDateInput, s27Clinics } from "./summer27-data";

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
  proHint: string | null;
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

function normalizeTalk(text: string) {
  return text.toLowerCase().replace(/['’]/g, "'").replace(/[“”]/g, '"');
}

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

function hourFromParts(raw: string, minutes?: string, mer?: string): number | null {
  let h = Number(raw);
  if (!Number.isFinite(h) || h > 23) return null;
  const min = minutes ? Number(minutes) : 0;
  if (!Number.isFinite(min) || min < 0 || min > 59) return null;
  const m = (mer || "").replace(/\./g, "");
  if (m === "pm" && h < 12) h += 12;
  if (m === "am" && h === 12) h = 0;
  if (!m && h >= 1 && h <= 7) h += 12;
  return h + min / 60;
}

const HOUR_WORDS: Record<string, number> = {
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};

export function parseHour(text: string): number | null {
  const t = normalizeTalk(text).replace(/(\d)\s*(a\.?m\.?|p\.?m\.?)/g, "$1$2");
  if (/\bnoon\b/.test(t)) return 12;
  if (/\bmidnight\b/.test(t)) return 0;
  const withMer = [...t.matchAll(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/g)];
  if (withMer[0]) {
    let hour = hourFromParts(withMer[0][1], withMer[0][2], withMer[0][3]);
    if (hour != null && hour < 12 && /\b(tonight|evening|night)\b/.test(t)) hour += 12;
    return hour;
  }
  const word = t.match(/\b(seven|eight|nine|ten|eleven|twelve)\s*(o['’]?clock)?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (word) {
    const h = HOUR_WORDS[word[1]];
    const mer = word[3] || (/\b(tonight|evening|night|afternoon)\b/.test(t) && h < 12 ? "pm" : h === 12 ? "pm" : undefined);
    return hourFromParts(String(h > 12 ? h - 12 : h), undefined, mer);
  }
  const at = t.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (at) {
    let hour = hourFromParts(at[1], at[2], at[3]);
    if (hour != null && hour < 12 && /\b(tonight|evening|night)\b/.test(t) && !at[3]) hour += 12;
    return hour;
  }
  const clock = t.match(/\b(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (clock) return hourFromParts(clock[1], clock[2], clock[3]);
  const cleaned = t
    .replace(/\b(105|101)\b/g, " ")
    .replace(/\b\d+\.\d+\b/g, " ");
  const bare = cleaned.match(/\b([1-9]|1[0-2])\b/);
  if (bare) return hourFromParts(bare[1], undefined, undefined);
  return null;
}

function parseHourTo(text: string): number | null {
  const t = text.toLowerCase();
  const m = t.match(/\b(?:to|until)\s+(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)?\b/);
  if (!m) return null;
  return hourFromParts(m[1], m[2], m[3]);
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
    text.match(/\b(?:put|enroll)\s+([A-Z][a-z]+)/) ||
    text.match(/\bsign\s+up\s+([A-Z][a-z]+)/) ||
    text.match(/\bcancel\s+([A-Z][a-z]+)(?:['’]s)?\b/) ||
    text.match(/\b([A-Z][a-z]{2,})\s+(?:join|in|into)\b/) ||
    text.match(/\bfor\s+([A-Z][a-z]{2,})\b/) ||
    text.match(/\b([A-Z][a-z]{2,})\s+(?:in|into)\s+(?:the\s+)?(?:junior|clinic)/i);
  if (!m) return null;
  const name = m[1];
  const skip = new Set([
    "my",
    "the",
    "a",
    "an",
    "me",
    "our",
    "his",
    "her",
    "their",
    "junior",
    "juniors",
    "saturday",
    "sunday",
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "sat",
    "sun",
    "mon",
    "tue",
    "wed",
    "thu",
    "fri",
    "clinic",
    "class",
    "cardio",
    "today",
    "tomorrow",
    "tots",
    "both",
    "kids",
    "guests",
    "guest",
    "ladies",
    "high",
    "performance",
    "weeknight",
    "tennis",
  ]);
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

function parseProHint(text: string): string | null {
  const t = text.toLowerCase();
  if (/\bderek\b/.test(t)) return "derek";
  if (/\bmaya\b/.test(t)) return "maya-ellison";
  if (/\bjonah\b/.test(t)) return "jonah-berkowitz";
  return null;
}

function parsePriceTopic(text: string): string | null {
  const t = normalizeTalk(text);
  if (/\blesson|derek|maya|jonah/.test(t)) return "lesson";
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
    proHint: partial.proHint ?? null,
    eventHint: partial.eventHint ?? null,
    stringHint: partial.stringHint ?? null,
    tension: partial.tension ?? null,
    priceTopic: partial.priceTopic ?? null,
  };
}

function clinicExistsAt(date: string | null, hour: number | null) {
  if (!date || hour == null) return false;
  const day = parseDateInput(date).getDay();
  return s27Clinics.some((c) => c.days.includes(day) && Math.abs(c.startHour - hour) < 0.26);
}

export function parseVoiceFallback(transcript: string, now = new Date()): VoiceIntent {
  const t = normalizeTalk(transcript);
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
  const proHint = parseProHint(transcript);
  const clinicTalk =
    /\b(clinics?|class(?:es)?|cardio|tennis 101|point play|advanced games|tots|toddlers|ladies|high performance|weeknight|roster)\b/.test(t) ||
    (/\bjuniors?\b/.test(t) && !/\blesson\b/.test(t));
  const book =
    /\b(book|reserve|sign(?:\s*me)?[\s-]?up|enroll|join|put|register|schedule|get me (?:in|into)|add me|still make)\b/.test(t) ||
    /\bi (?:wanna|want to) (?:book|join|hit)\b/.test(t);

  if (/\b(how much|prices?|cost|rate|rates|charge|fee)\b/.test(t)) {
    return emptyIntent({ intent: "prices", priceTopic: parsePriceTopic(t), date, hour, timeOfDay, courtId, proHint });
  }
  if (/\b(move|reschedule|change .+ to)\b/.test(t)) {
    return emptyIntent({ intent: "move", date, dateTo, hour, hourTo: hourTo || hour, timeOfDay, courtId, clinicHint: clinicTalk ? transcript : null });
  }
  if (/\b(cancel|drop me|remove me|take me off)\b/.test(t)) {
    return emptyIntent({ intent: "cancel", date, hour, timeOfDay, courtId, clinicHint: clinicTalk ? transcript : null, childName });
  }
  if (
    /\b(what do i have|what'?s on my book|my (day|week|weekend|bookings|schedule)|am i booked|do i have anything|show my bookings)\b/.test(t)
  ) {
    return emptyIntent({ intent: "my_day", date, dateTo, hour, timeOfDay, courtId });
  }
  if (/\b(stringing|string|restring|racket|poly|gut|multifilament|synthetic)\b/.test(t)) {
    const checking = /\b(ready|done|status|check)\b/.test(t);
    const order = /\b(order|drop off|restring|string my|string it)\b/.test(t) || !!parseStringHint(t);
    return emptyIntent({
      intent: checking || (!order && /\bracket\b/.test(t)) ? "check_stringing" : "order_stringing",
      date,
      stringHint: parseStringHint(t),
      tension: parseTension(t),
    });
  }
  if ((/\blesson\b/.test(t) || proHint) && !clinicTalk) {
    return emptyIntent({
      intent: book || /\brequest\b/.test(t) || !!proHint ? "request_lesson" : "check_lesson",
      date: date || isoDate(now),
      hour,
      timeOfDay,
      proHint,
      childName,
    });
  }
  if (
    /\b(events?|tournament|championships?|105|wimbledon|social|family play|mixed doubles|round robin|season close|season end)\b/.test(
      t
    )
  ) {
    return emptyIntent({
      intent: book ? "book_event" : "check_event",
      date,
      eventHint: transcript,
    });
  }
  if (
    /\b(looking for a game|looking for doubles|hit with|hitting partner|anyone (playing|free|looking)|lfg|find a game)\b/.test(t)
  ) {
    return emptyIntent({ intent: "check_play", date: date || isoDate(now), hour, timeOfDay, courtId });
  }
  if (clinicTalk || childName || (book && !/\bcourt/.test(t) && clinicExistsAt(date, hour))) {
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
  if (/\b(what'?s open|anything open|open this)\b/.test(t) || /\b(court|open time|court time|open courts|open slots)\b/.test(t) || hour != null) {
    return emptyIntent({ intent: "check_court", date: date || isoDate(now), hour, timeOfDay, courtId });
  }
  return emptyIntent({ intent: "unknown", date, hour, timeOfDay, clinicHint: transcript, courtId, childName, proHint });
}

export function mergeIntent(parsed: Partial<VoiceIntent>, fallback: VoiceIntent): VoiceIntent {
  const intent = KINDS.includes(parsed.intent as VoiceIntentKind) ? (parsed.intent as VoiceIntentKind) : fallback.intent;
  return {
    intent,
    date: fallback.date ?? parsed.date ?? null,
    dateTo: fallback.dateTo ?? parsed.dateTo ?? null,
    hour: fallback.hour ?? (typeof parsed.hour === "number" ? parsed.hour : null),
    hourTo: fallback.hourTo ?? (typeof parsed.hourTo === "number" ? parsed.hourTo : null),
    timeOfDay: fallback.timeOfDay ?? parsed.timeOfDay ?? null,
    clinicHint: parsed.clinicHint || fallback.clinicHint,
    courtId: fallback.courtId ?? parsed.courtId ?? null,
    childName: fallback.childName ?? parsed.childName ?? null,
    proHint: fallback.proHint ?? (parsed.proHint && parsed.proHint !== "derek" ? parsed.proHint : null),
    eventHint: parsed.eventHint || fallback.eventHint,
    stringHint: parsed.stringHint || fallback.stringHint,
    tension: parsed.tension || fallback.tension,
    priceTopic: parsed.priceTopic ?? fallback.priceTopic ?? null,
  };
}
