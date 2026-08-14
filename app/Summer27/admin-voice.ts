import { getPaymentProfile } from "./payments";
import { type S27AdminBlock, type S27Catalog, type S27MemberNote } from "./schedule";
import { COURTS, formatDateInput, formatHour, formatPrettyDate, parseDateInput, type ClinicDef, type CourtId } from "./summer27-data";
import {
  stringingShopStatus,
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "./storage";
import { parseHour, parseSpokenDate } from "./voice-intent";
import { applyWeatherClose, weatherAffectedRows, weatherAlreadyClosed, type WeatherCloseResult } from "./weather-close";

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export type AdminVoiceData = {
  members: S27MemberAccount[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  charges: S27Charge[];
  blocks: S27AdminBlock[];
  notes: S27MemberNote[];
  catalog: S27Catalog;
  today: string;
};

export type AdminVoiceActions = {
  saveCourts: (next: S27CourtBooking[]) => void;
  saveClinics: (next: S27ClinicBooking[]) => void;
  saveLessons: (next: S27LessonBooking[]) => void;
  saveEvents: (next: S27EventBooking[]) => void;
  saveStringing: (next: S27StringingOrder[]) => void;
  saveCharges: (next: S27Charge[]) => void;
  saveHolds: (next: S27AdminBlock[]) => void;
  saveNotes: (next: S27MemberNote[]) => void;
  markStringingReady: (id: string) => Promise<void>;
  markStringingPickedUp: (id: string) => void;
  onWeatherClose: (result: WeatherCloseResult) => void;
  openMember: (memberNumber: string) => void;
};

export type AdminDraft =
  | { kind: "unknown"; title: string; detail: string; mutating: false }
  | { kind: "lookup"; title: string; detail: string; mutating: false }
  | { kind: "open_member"; title: string; detail: string; mutating: false; memberNumber: string }
  | { kind: "rain"; title: string; detail: string; mutating: true; date: string }
  | { kind: "string_ready"; title: string; detail: string; mutating: true; orderId: string }
  | { kind: "string_pickup"; title: string; detail: string; mutating: true; orderId: string }
  | { kind: "charge"; title: string; detail: string; mutating: true; charge: S27Charge }
  | { kind: "add_clinic"; title: string; detail: string; mutating: true; booking: S27ClinicBooking }
  | { kind: "add_court"; title: string; detail: string; mutating: true; booking: S27CourtBooking }
  | { kind: "cancel"; title: string; detail: string; mutating: true; target: { type: "court" | "clinic" | "lesson" | "event"; id: string } }
  | { kind: "hold"; title: string; detail: string; mutating: true; block: S27AdminBlock }
  | { kind: "release_hold"; title: string; detail: string; mutating: true; blockId: string }
  | { kind: "lesson_status"; title: string; detail: string; mutating: true; lessonId: string; status: "accepted" | "declined" }
  | { kind: "mark_paid"; title: string; detail: string; mutating: true; target: { type: "court" | "clinic" | "lesson" | "event" | "stringing"; id: string } }
  | { kind: "note"; title: string; detail: string; mutating: true; memberNumber: string; note: string };

const STOP = new Set([
  "the",
  "a",
  "an",
  "to",
  "for",
  "at",
  "on",
  "in",
  "of",
  "and",
  "or",
  "my",
  "their",
  "his",
  "her",
  "court",
  "courts",
  "clinic",
  "clinics",
  "lesson",
  "lessons",
  "racket",
  "stringing",
  "ready",
  "notify",
  "picked",
  "pickup",
  "charge",
  "mark",
  "paid",
  "hold",
  "block",
  "open",
  "release",
  "cancel",
  "add",
  "book",
  "put",
  "sign",
  "who",
  "whats",
  "today",
  "tomorrow",
  "weather",
  "rain",
  "out",
  "close",
  "both",
  "three",
  "four",
  "am",
  "pm",
  "please",
  "hey",
  "can",
  "you",
  "just",
  "member",
  "file",
  "pull",
  "up",
  "show",
  "me",
  "roster",
  "walk",
  "guest",
  "note",
  "accept",
  "decline",
  "accepted",
  "declined",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
]);

function talk(text: string) {
  return text.toLowerCase().replace(/['’]/g, "'").replace(/[“”]/g, '"');
}

function scoreName(hay: string, q: string) {
  const name = hay.toLowerCase().trim();
  const ql = q.toLowerCase().trim();
  if (!ql || !name) return 0;
  if (name === ql) return 800;
  if (name.startsWith(ql)) return 700;
  const parts = name.split(/\s+/);
  if (parts.some((p) => p === ql)) return 650;
  if (parts.some((p) => p.startsWith(ql))) return 600;
  if (name.includes(ql)) return 400;
  return 0;
}

function scoreMember(m: S27MemberAccount, q: string) {
  const ql = q.toLowerCase().trim();
  if (m.memberNumber === ql) return 1000;
  let best = scoreName(m.name, q);
  for (const child of m.children || []) {
    best = Math.max(best, scoreName(child.name, q) + 20);
  }
  return best;
}

function memberHits(members: S27MemberAccount[], q: string) {
  return members
    .map((m) => ({ m, score: scoreMember(m, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name));
}

function personFor(members: S27MemberAccount[], hint: string | null) {
  if (!hint) return null;
  const hits = memberHits(members, hint);
  if (!hits.length) {
    return { name: hint.replace(/\b\w/g, (c) => c.toUpperCase()), member: null as S27MemberAccount | null, ambiguous: false };
  }
  const top = hits[0];
  const ambiguous = hits.length > 1 && hits[1].score >= top.score - 50 && hits[1].score >= 600;
  const child = (top.m.children || []).find((c) => scoreName(c.name, hint) >= 600);
  return { name: child?.name || top.m.name, member: top.m, ambiguous };
}

function nameHint(text: string, members: S27MemberAccount[]) {
  const t = talk(text);
  const poss = t.match(/\b([a-z]{2,})'s\b/);
  if (poss && !STOP.has(poss[1]) && memberHits(members, poss[1]).length) return poss[1];

  const people = [
    ...members.map((m) => m.name),
    ...members.flatMap((m) => (m.children || []).map((c) => c.name)),
  ];
  for (const name of people) {
    const first = name.split(/\s+/)[0]?.toLowerCase();
    if (first && first.length > 2 && new RegExp(`\\b${first}s\\b`).test(t) && !STOP.has(first)) return first;
  }

  const full = members.find((m) => t.includes(m.name.toLowerCase()));
  if (full) return full.name;
  const childHit = members.flatMap((m) => m.children || []).find((c) => t.includes(c.name.toLowerCase()));
  if (childHit) return childHit.name;

  const firstHits = members.filter((m) => {
    const first = m.name.split(/\s+/)[0]?.toLowerCase();
    return first && first.length > 2 && new RegExp(`\\b${first}\\b`).test(t);
  });
  if (firstHits.length === 1) return firstHits[0].name.split(/\s+/)[0];

  const childFirst = members.flatMap((m) => m.children || []).filter((c) => {
    const first = c.name.split(/\s+/)[0]?.toLowerCase();
    return first && first.length > 2 && new RegExp(`\\b${first}\\b`).test(t);
  });
  if (childFirst.length === 1) return childFirst[0].name;

  const labeled = t.match(/\b(?:for|to|add|book|put|charge|notify|note)\s+([a-z]{2,})\b/);
  if (labeled && !STOP.has(labeled[1])) return labeled[1];
  if (poss && !STOP.has(poss[1])) return poss[1];
  return null;
}

function parseCourtId(t: string): CourtId | "both" | null {
  if (/\bboth courts\b|\bboth\b/.test(t) && /\bcourt/.test(t)) return "both";
  if (/\bcourt\s*3\b|\bcourt three\b/.test(t)) return "court-1";
  if (/\bcourt\s*4\b|\bcourt four\b/.test(t)) return "court-2";
  return null;
}

function clinicMatch(clinic: { name: string; level: string; id: string; kind: string }, hint: string) {
  const h = hint.toLowerCase();
  const blob = `${clinic.name} ${clinic.level} ${clinic.id} ${clinic.kind}`.toLowerCase();
  if (/\btots\b/.test(h)) return blob.includes("tots");
  if (/\btoddlers?\b/.test(h)) return /toddler/.test(blob);
  if (/\bhigh school\b/.test(h)) return blob.includes("high school");
  if (/\bjuniors?\b/.test(h)) return clinic.kind === "junior" && !/tots|toddler/.test(blob);
  const keys = ["101", "cardio", "point play", "ladies", "high performance", "weeknight", "beginner", "3.5", "2.5", "games"];
  const hits = keys.filter((k) => h.includes(k));
  if (hits.length === 0) return true;
  return hits.some((k) => blob.includes(k));
}

function pickClinic(text: string, date: string, hour: number | null, defs: ClinicDef[]) {
  const day = parseDateInput(date).getDay();
  let list = defs.filter((c) => c.days.includes(day));
  const named = list.filter((c) => clinicMatch(c, text));
  if (named.length && named.length < list.length) list = named;
  if (hour != null) {
    const exact = list.filter((c) => Math.abs(c.startHour - hour) < 0.26);
    const near = list.filter((c) => Math.abs(c.startHour - hour) < 1);
    list = exact.length ? exact : near.length ? near : hour != null ? [] : list;
  }
  list.sort((a, b) => a.startHour - b.startHour);
  return list[0] || null;
}

function bookingNameScore(clientName: string, hint: string) {
  return scoreName(clientName, hint);
}

function bestBooking<T extends { clientName: string; date: string }>(rows: T[], hint: string, date: string | null) {
  const scored = rows
    .map((row) => ({
      row,
      score: bookingNameScore(row.clientName, hint) + (date && row.date === date ? 50 : 0) + (row.date >= (date || "") ? 1 : 0),
    }))
    .filter((x) => x.score >= 400)
    .sort((a, b) => b.score - a.score || b.row.date.localeCompare(a.row.date));
  return scored[0]?.row || null;
}

function moneyFrom(t: string) {
  const dollars = t.match(/\$\s*(\d+(?:\.\d{1,2})?)/) || t.match(/\b(\d+(?:\.\d{1,2})?)\s*dollars?\b/);
  if (dollars) return Number(dollars[1]);
  if (/\bballs?\b/.test(t)) return 5;
  if (/\bgrip|overgrip\b/.test(t)) return 8;
  if (/\bdrink|gatorade|water\b/.test(t)) return 3;
  if (/\bdemo\b/.test(t)) return 25;
  return null;
}

function chargeNote(t: string, amount: number) {
  if (/\bballs?\b/.test(t)) return "Can of balls";
  if (/\bgrip|overgrip\b/.test(t)) return "Overgrip";
  if (/\bdrink|gatorade|water\b/.test(t)) return "Drink from pro shop";
  if (/\bdemo\b/.test(t)) return "Demo racket rental";
  const said = t.match(/\bfor\s+(.+)$/);
  if (said) return said[1].replace(/\.$/, "").trim().slice(0, 80);
  return `Desk charge $${amount}`;
}

function warn(ambiguous: boolean, name: string, member: S27MemberAccount | null) {
  if (!member) return `No member file for ${name} — treating as walk-up.`;
  if (ambiguous) return `Using ${member.name} (#${member.memberNumber}). Tap Don’t if that’s the wrong person.`;
  return "";
}

function unknown(detail: string): AdminDraft {
  return { kind: "unknown", title: "Didn’t catch an action", detail, mutating: false };
}

export function parseAdminVoice(transcript: string, data: AdminVoiceData, now = new Date()): AdminDraft {
  const said = transcript.trim();
  const t = talk(said);
  const date = parseSpokenDate(t, now) || data.today;
  const hourRaw = parseHour(t);
  const hour = hourRaw == null ? null : Math.round(hourRaw * 2) / 2;
  const courtId = parseCourtId(t);
  const hint = nameHint(said, data.members);
  const person = personFor(data.members, hint);
  const pretty = formatPrettyDate(date);

  if (/\b(rain\s*out|wash\s*out|weather|close (?:the )?courts?|courts? closed)\b/.test(t)) {
    if (weatherAlreadyClosed(data.blocks, date) && weatherAffectedRows({ date, courts: data.courts, clinics: data.clinics, lessons: data.lessons }).length === 0) {
      return { kind: "lookup", title: "Already closed", detail: `${pretty} is already marked closed for weather.`, mutating: false };
    }
    const rows = weatherAffectedRows({ date, courts: data.courts, clinics: data.clinics, lessons: data.lessons });
    const preview = rows
      .slice(0, 8)
      .map((r) => `${r.name} · ${r.kind} · ${r.label} · $${r.amount}`)
      .join("\n");
    const extra = rows.length > 8 ? `\nand ${rows.length - 8} more` : "";
    return {
      kind: "rain",
      title: `Rain out ${pretty}`,
      detail: `Hold both courts, clear ${rows.length} paid booking${rows.length === 1 ? "" : "s"}, email players, and refund Stripe charges when we have them.${preview ? `\n\n${preview}${extra}` : "\n\nNo paid bookings on the book — still places the weather hold."}`,
      mutating: true,
      date,
    };
  }

  if (
    (/\b(who('?s| is)|what('?s| is)|what'?s happening|roster|how('?s| is) .+ looking|on court|in (the )?clinic)\b/.test(t) ||
      (/\bclinics?\b/.test(t) && !/\b(add|book|put|cancel|sign|charge|hold)\b/.test(t))) &&
    !/\b(add|book|put|cancel|charge|hold)\b/.test(t)
  ) {
    return lookupDraft(t, data, date, hour, courtId);
  }

  if (/\b(pull up|open|show|member file)\b/.test(t) && person?.member) {
    return {
      kind: "open_member",
      title: `Open ${person.member.name}`,
      detail: `${person.member.name} · #${person.member.memberNumber}${person.ambiguous ? `\n\n${warn(true, person.name, person.member)}` : ""}`,
      mutating: false,
      memberNumber: person.member.memberNumber,
    };
  }

  if (/\b(racket|string).*(ready|done|notify)|notify .*(racket|string)\b/.test(t) || (/\bready\b/.test(t) && /\b(racket|string)\b/.test(t))) {
    const order = findStringing(data.stringing, person?.name || hint || "", ["in_shop", "ready"]);
    if (!order) return unknown("I need a name on a stringing order still in the shop. Try “Sarah’s racket is ready.”");
    return {
      kind: "string_ready",
      title: `Notify ${order.clientName}`,
      detail: `Mark ${order.racket || "racket"} ready (${order.stringName}, ${order.tension} lbs) and email ${order.clientName}.`,
      mutating: true,
      orderId: order.id,
    };
  }

  if (/\b(picked up|collected|they (got|took) (it|their racket))\b/.test(t)) {
    const order = findStringing(data.stringing, person?.name || hint || "", ["ready", "in_shop"]);
    if (!order) return unknown("I need a name on a stringing order. Try “Sarah picked up her racket.”");
    return {
      kind: "string_pickup",
      title: `${order.clientName} picked up`,
      detail: `Mark ${order.clientName}’s ${order.racket || "racket"} as picked up.`,
      mutating: true,
      orderId: order.id,
    };
  }

  if (/\b(charge|sold|sell|grabbed|owes)\b/.test(t) && (moneyFrom(t) != null || /\b(balls?|grip|drink|demo)\b/.test(t))) {
    if (!person) return unknown("Who should I charge? Try “charge Sarah $5 for balls.”");
    const amount = moneyFrom(t);
    if (amount == null || !Number.isFinite(amount) || amount <= 0) return unknown("I need an amount. Try “charge Sarah $5 for balls.”");
    const member = person.member;
    const card = member ? getPaymentProfile(member.memberNumber) : null;
    const method: S27Charge["paymentMethod"] = card?.last4 ? "saved-card" : "manual";
    const note = chargeNote(t, amount);
    const row: S27Charge = {
      id: uid("charge"),
      date: data.today,
      description: note,
      clientName: person.name,
      clientEmail: member?.email || "",
      memberNumber: member?.memberNumber,
      amount,
      paymentStatus: "paid",
      paymentMethod: method,
      createdAt: new Date().toISOString(),
    };
    const billed = card?.last4 ? `card on file (•••• ${card.last4})` : "manual / cash (no card on file)";
    return {
      kind: "charge",
      title: `Charge ${person.name} $${amount}`,
      detail: `${note} · $${amount} · ${billed}.${person.ambiguous || !member ? `\n\n${warn(!!person.ambiguous, person.name, member)}` : ""}`,
      mutating: true,
      charge: row,
    };
  }

  if (/\b(accept|confirm) .*(lesson|request)\b/.test(t) || (/\baccept\b/.test(t) && /\blesson\b/.test(t))) {
    const lesson = findLessonRequest(data.lessons, person?.name || hint || "", date);
    if (!lesson) return unknown("No pending lesson request matched. Try “accept Sarah’s lesson.”");
    return {
      kind: "lesson_status",
      title: `Accept ${lesson.clientName}’s lesson`,
      detail: `${formatPrettyDate(lesson.date)} ${formatHour(lesson.hour)} · ${lesson.proName || "pro"} · ${lesson.duration} min.`,
      mutating: true,
      lessonId: lesson.id,
      status: "accepted",
    };
  }

  if (/\bdecline\b/.test(t) && /\blesson\b/.test(t)) {
    const lesson = findLessonRequest(data.lessons, person?.name || hint || "", date);
    if (!lesson) return unknown("No pending lesson request matched. Try “decline Sarah’s lesson.”");
    return {
      kind: "lesson_status",
      title: `Decline ${lesson.clientName}’s lesson`,
      detail: `${formatPrettyDate(lesson.date)} ${formatHour(lesson.hour)} · ${lesson.proName || "pro"}.`,
      mutating: true,
      lessonId: lesson.id,
      status: "declined",
    };
  }

  if ((/\b(mark|set) .*paid\b/.test(t) || (/\bpaid\b/.test(t) && /\b(court|clinic|lesson|string)\b/.test(t))) && person) {
    const paid = findUnpaid(data, person.name, date, t);
    if (!paid) return unknown(`No unpaid booking for ${person.name}.`);
    return {
      kind: "mark_paid",
      title: `Mark ${person.name} paid`,
      detail: paid.label,
      mutating: true,
      target: paid.target,
    };
  }

  if (/\b(note|remember|tell me later)\b/.test(t) && person?.member) {
    const body =
      said.replace(/^.*?(?:note(?: for)?|remember)\s+[^,.:]+[,.:]?\s*/i, "").trim() || said;
    const existing = data.notes.find((n) => n.memberNumber === person.member!.memberNumber)?.note || "";
    const nextNote = existing ? `${existing}\n${formatDateInput(now)} · ${body}` : `${formatDateInput(now)} · ${body}`;
    return {
      kind: "note",
      title: `Note on ${person.member.name}`,
      detail: body,
      mutating: true,
      memberNumber: person.member.memberNumber,
      note: nextNote,
    };
  }

  if (/\b(open|release|unhold|lift).*(hold|block)\b/.test(t) || (/\brelease\b/.test(t) && /\bcourt/.test(t))) {
    const match = data.blocks
      .filter((b) => b.date === date && (b.kind || "hold") === "hold")
      .filter((b) => (courtId && courtId !== "both" ? b.courtId === courtId || b.courtId === "both" : true))
      .filter((b) => (hour == null ? true : hour >= b.startHour && hour < b.startHour + b.durationHours));
    const block = match[0];
    if (!block) return unknown("No hold matched that court/time. Try “release the hold on court 3 at 4.”");
    const courtLabel = block.courtId === "both" ? "both courts" : COURTS.find((c) => c.id === block.courtId)?.name || block.courtId;
    return {
      kind: "release_hold",
      title: `Release hold`,
      detail: `${formatPrettyDate(block.date)} · ${courtLabel} · ${formatHour(block.startHour)} · ${block.reason}`,
      mutating: true,
      blockId: block.id,
    };
  }

  if (/\b(hold|block|close off)\b/.test(t) && /\bcourt/.test(t) && !/\bweather|rain\b/.test(t)) {
    const cid = courtId || "both";
    const start = hour == null ? 8 : Math.floor(hour);
    const block: S27AdminBlock = {
      id: uid("hold"),
      date,
      courtId: cid,
      startHour: start,
      durationHours: 1,
      reason: "Director hold",
      createdAt: new Date().toISOString(),
      kind: "hold",
    };
    const courtLabel = cid === "both" ? "both courts" : COURTS.find((c) => c.id === cid)?.name || cid;
    return {
      kind: "hold",
      title: `Hold ${courtLabel}`,
      detail: `${pretty} · ${formatHour(start)} for 1 hour · ${courtLabel}.`,
      mutating: true,
      block,
    };
  }

  if (/\b(cancel|drop|take off|remove)\b/.test(t) && person) {
    const hit = findCancel(data, person.name, date, hour, t);
    if (!hit) return unknown(`No booking for ${person.name} to cancel.`);
    return {
      kind: "cancel",
      title: `Cancel ${person.name}`,
      detail: hit.label,
      mutating: true,
      target: hit.target,
    };
  }

  if ((/\b(add|put|walk[- ]?up|sign)\b/.test(t) && /\b(clinic|class|juniors?|tots|cardio|101)\b/.test(t)) || (/\b(add|put)\b/.test(t) && person && pickClinic(t, date, hour, data.catalog.clinics))) {
    if (!person) return unknown("Who should I add? Try “add Emma to Tuesday juniors.”");
    const def = pickClinic(t, date, hour, data.catalog.clinics);
    if (!def) return unknown("Which clinic? Try “add Emma to Tuesday juniors” or “put Sarah in 9am Saturday.”");
    const member = person.member;
    const booking: S27ClinicBooking = {
      id: uid("clinic"),
      clinicId: def.id,
      clinicName: def.name,
      date,
      clientName: person.name,
      clientEmail: member?.email || "",
      memberNumber: member?.memberNumber,
      amount: member ? def.memberPrice : def.guestPrice,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: new Date().toISOString(),
    };
    return {
      kind: "add_clinic",
      title: `Add ${person.name}`,
      detail: `${def.name} · ${pretty} · ${formatHour(def.startHour)} · $${booking.amount} paid (desk).${person.ambiguous || !member ? `\n\n${warn(!!person.ambiguous, person.name, member)}` : ""}`,
      mutating: true,
      booking,
    };
  }

  if (/\b(book|add|put|walk[- ]?up)\b/.test(t) && /\bcourt/.test(t) && person) {
    const cid: CourtId = courtId === "court-2" ? "court-2" : "court-1";
    const start = hour == null ? 8 : Math.floor(hour);
    const member = person.member;
    const rates = data.catalog.courtRates;
    const booking: S27CourtBooking = {
      id: uid("court"),
      date,
      hour: start,
      durationHours: 1,
      courtId: cid,
      courtName: COURTS.find((c) => c.id === cid)?.name || cid,
      clientName: person.name,
      clientEmail: member?.email || "",
      clientPhone: member?.phone || "",
      memberNumber: member?.memberNumber,
      amount: (member ? rates.member : rates.guest) * 1,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: new Date().toISOString(),
    };
    return {
      kind: "add_court",
      title: `Book ${person.name}`,
      detail: `${booking.courtName} · ${pretty} ${formatHour(start)} · $${booking.amount} paid (desk).${person.ambiguous || !member ? `\n\n${warn(!!person.ambiguous, person.name, member)}` : ""}`,
      mutating: true,
      booking,
    };
  }

  if (person?.member && /\b(open|show|file|pull)\b/.test(t)) {
    return {
      kind: "open_member",
      title: `Open ${person.member.name}`,
      detail: `${person.member.name} · #${person.member.memberNumber}`,
      mutating: false,
      memberNumber: person.member.memberNumber,
    };
  }

  return unknown(
    `I heard “${said}” but didn’t map it to a desk action. Try rain out, who’s on court 3 at 4, add Emma to juniors, book Sarah court 3 at 4, charge Mike $5 balls, or Sarah’s racket is ready.`
  );
}

function findStringing(orders: S27StringingOrder[], hint: string, statuses: Array<"in_shop" | "ready" | "picked_up">) {
  const open = orders.filter((o) => statuses.includes(stringingShopStatus(o)));
  if (!hint) return open[0] || null;
  const scored = open
    .map((o) => ({ o, score: scoreName(o.clientName, hint) }))
    .filter((x) => x.score >= 400)
    .sort((a, b) => b.score - a.score);
  return scored[0]?.o || null;
}

function findLessonRequest(lessons: S27LessonBooking[], hint: string, date: string) {
  const pending = lessons.filter((l) => l.requestStatus === "requested");
  if (!hint && pending.length === 1) return pending[0];
  return bestBooking(pending, hint, date) || bestBooking(pending, hint, null);
}

function findUnpaid(data: AdminVoiceData, hint: string, date: string, t: string) {
  if (/\bclinic\b/.test(t)) {
    const row = bestBooking(
      data.clinics.filter((b) => b.paymentStatus === "pending"),
      hint,
      date
    );
    if (row) return { label: `${row.clinicName} · ${formatPrettyDate(row.date)} · $${row.amount}`, target: { type: "clinic" as const, id: row.id } };
  }
  if (/\blesson\b/.test(t)) {
    const row = bestBooking(
      data.lessons.filter((b) => b.paymentStatus === "pending"),
      hint,
      date
    );
    if (row) return { label: `Lesson · ${formatPrettyDate(row.date)} ${formatHour(row.hour)} · $${row.amount}`, target: { type: "lesson" as const, id: row.id } };
  }
  if (/\bstring\b/.test(t)) {
    const scored = data.stringing
      .filter((b) => b.paymentStatus === "pending")
      .map((row) => ({ row, score: scoreName(row.clientName, hint) }))
      .filter((x) => x.score >= 400)
      .sort((a, b) => b.score - a.score);
    const row = scored[0]?.row;
    if (row) return { label: `Stringing · ${row.stringName} · $${row.amount}`, target: { type: "stringing" as const, id: row.id } };
  }
  const court = bestBooking(
    data.courts.filter((b) => b.paymentStatus === "pending"),
    hint,
    date
  );
  if (court) return { label: `${court.courtName} · ${formatPrettyDate(court.date)} ${formatHour(court.hour)} · $${court.amount}`, target: { type: "court" as const, id: court.id } };
  const clinic = bestBooking(
    data.clinics.filter((b) => b.paymentStatus === "pending"),
    hint,
    date
  );
  if (clinic) return { label: `${clinic.clinicName} · ${formatPrettyDate(clinic.date)} · $${clinic.amount}`, target: { type: "clinic" as const, id: clinic.id } };
  const lesson = bestBooking(
    data.lessons.filter((b) => b.paymentStatus === "pending"),
    hint,
    date
  );
  if (lesson) return { label: `Lesson · ${formatPrettyDate(lesson.date)} ${formatHour(lesson.hour)} · $${lesson.amount}`, target: { type: "lesson" as const, id: lesson.id } };
  return null;
}

function findCancel(data: AdminVoiceData, hint: string, date: string, hour: number | null, t: string) {
  if (/\bclinic|class|juniors?\b/.test(t)) {
    const row = bestBooking(data.clinics, hint, date);
    if (row) return { label: `${row.clinicName} · ${formatPrettyDate(row.date)} · ${row.clientName}`, target: { type: "clinic" as const, id: row.id } };
  }
  if (/\blesson\b/.test(t)) {
    let list = data.lessons.filter((b) => bookingNameScore(b.clientName, hint) >= 400);
    if (hour != null) list = list.filter((b) => Math.abs(b.hour - hour) < 0.6);
    const row = bestBooking(list.length ? list : data.lessons, hint, date);
    if (row) return { label: `Lesson · ${formatPrettyDate(row.date)} ${formatHour(row.hour)} · ${row.clientName}`, target: { type: "lesson" as const, id: row.id } };
  }
  if (/\bevent\b/.test(t)) {
    const mapped = data.events.map((b) => ({ ...b, clientName: b.attendeeName, date: b.eventDate }));
    const row = bestBooking(mapped, hint, date);
    if (row) return { label: `${row.eventTitle} · ${formatPrettyDate(row.eventDate)} · ${row.attendeeName}`, target: { type: "event" as const, id: row.id } };
  }
  let courts = data.courts.filter((b) => bookingNameScore(b.clientName, hint) >= 400);
  if (hour != null) courts = courts.filter((b) => Math.abs(b.hour - hour) < 0.6);
  const court = bestBooking(courts.length ? courts : data.courts, hint, date);
  if (court && (/\bcourt/.test(t) || hour != null || !/\bclinic|lesson\b/.test(t))) {
    return { label: `${court.courtName} · ${formatPrettyDate(court.date)} ${formatHour(court.hour)} · ${court.clientName}`, target: { type: "court" as const, id: court.id } };
  }
  const clinic = bestBooking(data.clinics, hint, date);
  if (clinic) return { label: `${clinic.clinicName} · ${formatPrettyDate(clinic.date)} · ${clinic.clientName}`, target: { type: "clinic" as const, id: clinic.id } };
  return null;
}

function lookupDraft(
  t: string,
  data: AdminVoiceData,
  date: string,
  hour: number | null,
  courtId: CourtId | "both" | null
): AdminDraft {
  const pretty = formatPrettyDate(date);
  if (/\bclinic|class|juniors?|roster\b/.test(t) || (hour != null && /\b(nine|9|eight|8|ten|10)\b/.test(t) && !/\bcourt/.test(t))) {
    const def = pickClinic(t, date, hour, data.catalog.clinics);
    if (def) {
      const roster = data.clinics.filter((b) => b.clinicId === def.id && b.date === date);
      const names = roster.map((b) => `${b.clientName}${b.paymentStatus === "pending" ? " (unpaid)" : ""}`).join("\n") || "Nobody on the roster yet.";
      return {
        kind: "lookup",
        title: def.name,
        detail: `${pretty} · ${formatHour(def.startHour)} · ${roster.length}/${def.capacity}\n\n${names}`,
        mutating: false,
      };
    }
  }

  const slot = hour == null ? null : Math.floor(hour);
  if (slot != null || /\bcourt/.test(t) || /\bnow\b/.test(t) || /\bwhat('?s| is) (on|happening)\b/.test(t)) {
    const h = slot ?? (/\bnow\b/.test(t) ? new Date().getHours() : null);
    const lines: string[] = [];
    for (const court of COURTS) {
      if (courtId && courtId !== "both" && court.id !== courtId) continue;
      const booked = data.courts.filter((b) => b.date === date && b.courtId === court.id && (h == null || Math.abs(b.hour - h) < 0.6));
      if (booked.length) {
        for (const b of booked) lines.push(`${b.courtName} ${formatHour(b.hour)} · ${b.clientName}`);
      } else if (h != null) {
        const hold = data.blocks.find(
          (b) =>
            b.date === date &&
            (b.kind || "hold") !== "open" &&
            (b.courtId === court.id || b.courtId === "both") &&
            h >= b.startHour &&
            h < b.startHour + b.durationHours
        );
        lines.push(hold ? `${court.name} ${formatHour(h)} · hold (${hold.reason})` : `${court.name} ${formatHour(h)} · open`);
      }
    }
    const lessons = data.lessons.filter(
      (b) => b.date === date && b.requestStatus !== "declined" && (h == null || Math.abs(b.hour - h) < 0.6)
    );
    for (const b of lessons) lines.push(`Lesson ${formatHour(b.hour)} · ${b.clientName}${b.proName ? ` · ${b.proName}` : ""}`);
    const clinics = data.catalog.clinics.filter((c) => c.days.includes(parseDateInput(date).getDay()) && (h == null || Math.abs(c.startHour - h) < 1));
    for (const c of clinics) {
      const n = data.clinics.filter((b) => b.clinicId === c.id && b.date === date).length;
      lines.push(`${c.name} ${formatHour(c.startHour)} · ${n}/${c.capacity}`);
    }
    return {
      kind: "lookup",
      title: h != null ? `On at ${formatHour(h)}` : `On ${pretty}`,
      detail: lines.length ? `${pretty}\n\n${lines.join("\n")}` : `${pretty} — nothing on the book for that window.`,
      mutating: false,
    };
  }

  return unknown("Ask “who’s on court 3 at 4” or “today’s 9am clinic.”");
}

export async function applyAdminDraft(draft: AdminDraft, data: AdminVoiceData, actions: AdminVoiceActions): Promise<string> {
  if (draft.kind === "unknown" || draft.kind === "lookup") return draft.title;
  if (draft.kind === "open_member") {
    actions.openMember(draft.memberNumber);
    return `Opened ${draft.title.replace(/^Open /, "")}.`;
  }
  if (draft.kind === "rain") {
    const result = await applyWeatherClose({
      date: draft.date,
      courts: data.courts,
      clinics: data.clinics,
      lessons: data.lessons,
      blocks: data.blocks,
    });
    actions.onWeatherClose(result);
    return `Weather close · ${result.emailed} emailed · ${result.refunded} refund${result.refunded === 1 ? "" : "s"}.`;
  }
  if (draft.kind === "string_ready") {
    await actions.markStringingReady(draft.orderId);
    return "";
  }
  if (draft.kind === "string_pickup") {
    actions.markStringingPickedUp(draft.orderId);
    return "";
  }
  if (draft.kind === "charge") {
    actions.saveCharges([draft.charge, ...data.charges]);
    return `Charged ${draft.charge.clientName} $${draft.charge.amount}.`;
  }
  if (draft.kind === "add_clinic") {
    actions.saveClinics([...data.clinics, draft.booking]);
    return `Added ${draft.booking.clientName} to ${draft.booking.clinicName}.`;
  }
  if (draft.kind === "add_court") {
    actions.saveCourts([...data.courts, draft.booking]);
    return `Booked ${draft.booking.clientName} on ${draft.booking.courtName}.`;
  }
  if (draft.kind === "cancel") {
    if (draft.target.type === "court") actions.saveCourts(data.courts.filter((x) => x.id !== draft.target.id));
    if (draft.target.type === "clinic") actions.saveClinics(data.clinics.filter((x) => x.id !== draft.target.id));
    if (draft.target.type === "lesson") actions.saveLessons(data.lessons.filter((x) => x.id !== draft.target.id));
    if (draft.target.type === "event") actions.saveEvents(data.events.filter((x) => x.id !== draft.target.id));
    return "Cancelled.";
  }
  if (draft.kind === "hold") {
    actions.saveHolds([...data.blocks, draft.block]);
    return "Hold placed.";
  }
  if (draft.kind === "release_hold") {
    actions.saveHolds(data.blocks.filter((b) => b.id !== draft.blockId));
    return "Hold released.";
  }
  if (draft.kind === "lesson_status") {
    actions.saveLessons(
      data.lessons.map((x) => (x.id === draft.lessonId ? { ...x, requestStatus: draft.status } : x))
    );
    return draft.status === "accepted" ? "Lesson accepted." : "Lesson declined.";
  }
  if (draft.kind === "mark_paid") {
    const id = draft.target.id;
    if (draft.target.type === "court") {
      actions.saveCourts(data.courts.map((x) => (x.id === id ? { ...x, paymentStatus: "paid" as const } : x)));
    }
    if (draft.target.type === "clinic") {
      actions.saveClinics(data.clinics.map((x) => (x.id === id ? { ...x, paymentStatus: "paid" as const } : x)));
    }
    if (draft.target.type === "lesson") {
      actions.saveLessons(data.lessons.map((x) => (x.id === id ? { ...x, paymentStatus: "paid" as const } : x)));
    }
    if (draft.target.type === "event") {
      actions.saveEvents(data.events.map((x) => (x.id === id ? { ...x, paymentStatus: "paid" as const } : x)));
    }
    if (draft.target.type === "stringing") {
      actions.saveStringing(data.stringing.map((x) => (x.id === id ? { ...x, paymentStatus: "paid" as const } : x)));
    }
    return "Marked paid.";
  }
  if (draft.kind === "note") {
    const rest = data.notes.filter((n) => n.memberNumber !== draft.memberNumber);
    actions.saveNotes([...rest, { memberNumber: draft.memberNumber, note: draft.note, updatedAt: new Date().toISOString() }]);
    return "Note saved.";
  }
  return "Done.";
}
