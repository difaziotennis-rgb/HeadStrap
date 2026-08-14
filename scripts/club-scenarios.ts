/**
 * 250 club situations on mock data — book, cancel, rain-out, clinic, admin edits.
 * Run: npx tsx scripts/club-scenarios.ts
 */
import { applyAdminDraft, parseAdminVoice, type AdminDraft, type AdminVoiceActions, type AdminVoiceData } from "../app/Summer27/admin-voice";
import { canChangeBooking } from "../app/Summer27/booking-policy";
import { lessonConflict } from "../app/Summer27/lesson-slots";
import type { S27MemberSession } from "../app/Summer27/member-session";
import {
  S27_BLOCKS_KEY,
  S27_NOTES_KEY,
  defaultCatalog,
  getProgramBlock,
  weatherClosedForWindow,
  weatherClosedOnDate,
  type S27AdminBlock,
} from "../app/Summer27/schedule";
import {
  formatHour,
  hoursOverlap,
  s27Clinics,
  s27Pros,
  type CourtId,
} from "../app/Summer27/summer27-data";
import {
  KEYS,
  persistCourts,
  saveList,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27PaymentProfile,
  type S27StringingOrder,
} from "../app/Summer27/storage";
import { parseVoiceFallback } from "../app/Summer27/voice-intent";
import { applyVoiceCancel, resolveVoice } from "../app/Summer27/voice-resolve";
import {
  applyWeatherClose,
  weatherAffectedRows,
  weatherAlreadyClosed,
  weatherWindowLabel,
} from "../app/Summer27/weather-close";

const NOW = new Date(2026, 7, 14, 10, 0, 0); // Fri Aug 14 2026
const TODAY = "2026-08-14";
const SAT = "2026-08-15";
const SUN = "2026-08-16";
const MON = "2026-08-17";
const TUE = "2026-08-18";
const WED = "2026-08-19";
const THU = "2026-08-20";
const FAR = "2026-08-22"; // Sat, outside 24h cancel window from NOW

function installEnv() {
  const mem = new Map<string, string>();
  const ls = {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => {
      mem.set(k, String(v));
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
    clear: () => mem.clear(),
    key: (i: number) => [...mem.keys()][i] ?? null,
    get length() {
      return mem.size;
    },
  };
  (globalThis as unknown as { localStorage: typeof ls }).localStorage = ls;
  (globalThis as unknown as { window: typeof globalThis }).window = globalThis;
  (globalThis as unknown as { window: { localStorage: typeof ls } }).window.localStorage = ls;
  (globalThis as unknown as { fetch: typeof fetch }).fetch = (async () => ({
    ok: true,
    json: async () => ({ ok: true, configured: false, emailed: true }),
  })) as unknown as typeof fetch;
}

installEnv();

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

function member(number: string, name: string, children?: { id: string; name: string }[]): S27MemberAccount {
  const first = name.split(" ")[0].toLowerCase();
  return {
    memberNumber: number,
    name,
    email: `${first}@example.com`,
    phone: "845-555-0100",
    password: "tennis",
    createdAt: "2026-05-01T12:00:00.000Z",
    children,
  };
}

const MEMBERS: S27MemberAccount[] = [
  member("101", "Claire Bennett", [{ id: "c1", name: "Emma Bennett" }]),
  member("102", "Owen Hart", [{ id: "c2", name: "Leo Hart" }]),
  member("103", "Priya Shah"),
  member("104", "Miles Ortega"),
  member("105", "Helen Cho"),
  member("106", "James Whitaker"),
  member("107", "Sarah Lang"),
  member("108", "Tom Brennan"),
  member("109", "Nina Patel"),
  member("110", "Anna Cole"),
  member("111", "David Russo", [{ id: "c3", name: "Olivia Russo" }]),
  member("112", "Lucy Hale"),
  member("113", "Ben Calder", [{ id: "c4", name: "Jack Calder" }]),
  member("114", "Marisol Vega"),
];

function court(partial: Omit<S27CourtBooking, "createdAt" | "clientPhone" | "paymentMethod"> & Partial<S27CourtBooking>): S27CourtBooking {
  return {
    clientPhone: "845-555-0100",
    paymentMethod: "manual",
    createdAt: "2026-08-01T12:00:00.000Z",
    durationHours: 1,
    ...partial,
  };
}

function clinic(partial: Omit<S27ClinicBooking, "createdAt" | "paymentMethod"> & Partial<S27ClinicBooking>): S27ClinicBooking {
  return {
    paymentMethod: "manual",
    createdAt: "2026-08-01T12:00:00.000Z",
    ...partial,
  };
}

function lesson(partial: Omit<S27LessonBooking, "createdAt" | "clientPhone" | "paymentMethod" | "focus"> & Partial<S27LessonBooking>): S27LessonBooking {
  return {
    clientPhone: "845-555-0100",
    paymentMethod: "manual",
    focus: "Serve",
    createdAt: "2026-08-01T12:00:00.000Z",
    duration: "60",
    ...partial,
  };
}

function fixture(): AdminVoiceData {
  const courts: S27CourtBooking[] = [
    court({ id: "ct-sarah", date: TODAY, hour: 16, courtId: "court-1", courtName: "Court 3", clientName: "Sarah Lang", clientEmail: "sarah@example.com", memberNumber: "107", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-owen-unpaid", date: TODAY, hour: 11, courtId: "court-2", courtName: "Court 4", clientName: "Owen Hart", clientEmail: "owen@example.com", memberNumber: "102", amount: 50, paymentStatus: "pending" }),
    court({ id: "ct-claire-sat", date: SAT, hour: 9, courtId: "court-1", courtName: "Court 3", clientName: "Claire Bennett", clientEmail: "claire@example.com", memberNumber: "101", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-lucy-am", date: TODAY, hour: 8, courtId: "court-1", courtName: "Court 3", clientName: "Lucy Hale", clientEmail: "lucy@example.com", memberNumber: "112", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-miles-4", date: TODAY, hour: 16, courtId: "court-2", courtName: "Court 4", clientName: "Miles Ortega", clientEmail: "miles@example.com", memberNumber: "104", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-priya-2h", date: TODAY, hour: 17, durationHours: 2, courtId: "court-1", courtName: "Court 3", clientName: "Priya Shah", clientEmail: "priya@example.com", memberNumber: "103", amount: 100, paymentStatus: "paid" }),
    court({ id: "ct-tom-sat", date: SAT, hour: 14, courtId: "court-2", courtName: "Court 4", clientName: "Tom Brennan", clientEmail: "tom@example.com", memberNumber: "108", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-claire-far", date: FAR, hour: 10, courtId: "court-1", courtName: "Court 3", clientName: "Claire Bennett", clientEmail: "claire@example.com", memberNumber: "101", amount: 50, paymentStatus: "paid" }),
    court({ id: "ct-guest-kate", date: SAT, hour: 11, courtId: "court-2", courtName: "Court 4", clientName: "Kate Morelli", clientEmail: "kate.morelli@example.com", amount: 60, paymentStatus: "paid" }),
    court({ id: "ct-anna-sun", date: SUN, hour: 8, courtId: "court-1", courtName: "Court 3", clientName: "Anna Cole", clientEmail: "anna@example.com", memberNumber: "110", amount: 50, paymentStatus: "paid" }),
  ];
  const clinics: S27ClinicBooking[] = [
    clinic({ id: "cl-emma", clinicId: "tue-am-juniors", clinicName: "Tuesday Juniors", date: TUE, clientName: "Emma Bennett", clientEmail: "claire@example.com", memberNumber: "101", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-leo", clinicId: "tue-am-juniors", clinicName: "Tuesday Juniors", date: TUE, clientName: "Leo Hart", clientEmail: "owen@example.com", memberNumber: "102", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-nina-unpaid", clinicId: "thu-am-ladies-doubles", clinicName: "Thursday Ladies Doubles Strategy", date: THU, clientName: "Nina Patel", clientEmail: "nina@example.com", memberNumber: "109", amount: 55, paymentStatus: "pending" }),
    clinic({ id: "cl-sarah-ladies", clinicId: "thu-am-ladies-doubles", clinicName: "Thursday Ladies Doubles Strategy", date: THU, clientName: "Sarah Lang", clientEmail: "sarah@example.com", memberNumber: "107", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-helen-cardio", clinicId: "sat-sun-cardio", clinicName: "Beginner/Intermediate Cardio 2.5–3.5", date: SAT, clientName: "Helen Cho", clientEmail: "helen@example.com", memberNumber: "105", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-james-cardio", clinicId: "sat-sun-cardio", clinicName: "Beginner/Intermediate Cardio 2.5–3.5", date: SAT, clientName: "James Whitaker", clientEmail: "james@example.com", memberNumber: "106", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-lucy-101", clinicId: "tue-am-beginner-fundamentals", clinicName: "Tennis 101", date: TUE, clientName: "Lucy Hale", clientEmail: "lucy@example.com", memberNumber: "112", amount: 55, paymentStatus: "paid" }),
    clinic({ id: "cl-ben-hs", clinicId: "thu-hs-juniors", clinicName: "High School Juniors Clinic", date: THU, clientName: "Jack Calder", clientEmail: "ben@example.com", memberNumber: "113", amount: 55, paymentStatus: "paid" }),
  ];
  const lessons: S27LessonBooking[] = [
    lesson({ id: "ls-miles", date: TODAY, hour: 10, clientName: "Miles Ortega", clientEmail: "miles@example.com", memberNumber: "104", proId: "derek", proName: "Derek DiFazio", amount: 180, paymentStatus: "pending", requestStatus: "requested" }),
    lesson({ id: "ls-helen", date: SAT, hour: 11, clientName: "Helen Cho", clientEmail: "helen@example.com", memberNumber: "105", proId: "maya-ellison", proName: "Maya Ellison", courtId: "court-2", amount: 160, paymentStatus: "paid", requestStatus: "accepted" }),
    lesson({ id: "ls-david-req", date: MON, hour: 9, clientName: "David Russo", clientEmail: "david@example.com", memberNumber: "111", proId: "derek", proName: "Derek DiFazio", amount: 180, paymentStatus: "pending", requestStatus: "requested" }),
    lesson({ id: "ls-declined", date: TODAY, hour: 15, clientName: "Ben Calder", clientEmail: "ben@example.com", memberNumber: "113", proId: "maya-ellison", proName: "Maya Ellison", amount: 160, paymentStatus: "paid", requestStatus: "declined" }),
    lesson({ id: "ls-nina-paid", date: TODAY, hour: 16, clientName: "Nina Patel", clientEmail: "nina@example.com", memberNumber: "109", proId: "maya-ellison", proName: "Maya Ellison", courtId: "court-2", amount: 160, paymentStatus: "paid", requestStatus: "accepted" }),
  ];
  const events: S27EventBooking[] = [
    {
      id: "ev-james",
      eventId: "wimbledon-finals-party",
      eventTitle: "Wimbledon Finals Doubles Tournament & Viewing Party",
      eventDate: "2027-07-11",
      attendeeName: "James Whitaker",
      attendeeEmail: "james@example.com",
      guestCount: 1,
      memberNumber: "106",
      amount: 55,
      paymentStatus: "paid",
      paymentMethod: "manual",
      createdAt: "2026-08-01T12:00:00.000Z",
    },
    {
      id: "ev-marisol-unpaid",
      eventId: "family-play-afternoon",
      eventTitle: "Family Play Afternoon",
      eventDate: "2026-08-23",
      attendeeName: "Marisol Vega",
      attendeeEmail: "marisol@example.com",
      guestCount: 2,
      memberNumber: "114",
      amount: 45,
      paymentStatus: "pending",
      paymentMethod: "manual",
      createdAt: "2026-08-01T12:00:00.000Z",
    },
  ];
  const stringing: S27StringingOrder[] = [
    { id: "st-claire", racket: "Wilson", stringId: "poly", stringName: "Polyester", tension: "52", clientName: "Claire Bennett", clientEmail: "claire@example.com", memberNumber: "101", amount: 82, paymentStatus: "paid", paymentMethod: "manual", createdAt: "", shopStatus: "in_shop" },
    { id: "st-tom", racket: "Babolat", stringId: "gut", stringName: "Natural gut", tension: "55", clientName: "Tom Brennan", clientEmail: "tom@example.com", memberNumber: "108", amount: 115, paymentStatus: "paid", paymentMethod: "manual", createdAt: "", shopStatus: "ready" },
    { id: "st-anna-unpaid", racket: "Head", stringId: "multi", stringName: "Multifilament", tension: "54", clientName: "Anna Cole", clientEmail: "anna@example.com", memberNumber: "110", amount: 78, paymentStatus: "pending", paymentMethod: "manual", createdAt: "", shopStatus: "in_shop" },
    { id: "st-owen", racket: "Yonex", stringId: "poly", stringName: "Polyester", tension: "50", clientName: "Owen Hart", clientEmail: "owen@example.com", memberNumber: "102", amount: 82, paymentStatus: "paid", paymentMethod: "manual", createdAt: "", shopStatus: "in_shop" },
  ];
  const blocks: S27AdminBlock[] = [
    { id: "hold-1", date: TODAY, courtId: "court-1", startHour: 14, durationHours: 1, reason: "Director hold", createdAt: "", kind: "hold" },
  ];
  return {
    members: MEMBERS,
    courts,
    clinics,
    lessons,
    events,
    stringing,
    charges: [],
    blocks,
    notes: [],
    catalog: defaultCatalog(),
    today: TODAY,
  };
}

function cloneData(data: AdminVoiceData): AdminVoiceData {
  return structuredClone(data);
}

function paidCourtConflicts(courts: S27CourtBooking[]) {
  const paid = courts.filter((b) => b.paymentStatus === "paid");
  const hits: string[] = [];
  for (let i = 0; i < paid.length; i++) {
    for (let j = i + 1; j < paid.length; j++) {
      const a = paid[i];
      const b = paid[j];
      if (a.date !== b.date || a.courtId !== b.courtId) continue;
      if (a.hour < b.hour + b.durationHours && b.hour < a.hour + a.durationHours) {
        hits.push(`${a.clientName} vs ${b.clientName} ${a.date} ${a.courtName} ${a.hour}/${b.hour}`);
      }
    }
  }
  return hits;
}

function sessionFor(m: S27MemberAccount): S27MemberSession {
  return {
    memberNumber: m.memberNumber,
    memberEmail: m.email,
    memberName: m.name,
    memberPhone: m.phone,
    signedInAt: NOW.toISOString(),
  };
}

class ClubWorld {
  data: AdminVoiceData;
  opened: string | null = null;

  constructor(data: AdminVoiceData) {
    this.data = cloneData(data);
    this.sync();
  }

  static fresh() {
    return new ClubWorld(fixture());
  }

  sync() {
    persistCourts(this.data.courts);
    saveList(KEYS.clinics, this.data.clinics);
    saveList(KEYS.lessons, this.data.lessons);
    saveList(KEYS.events, this.data.events);
    saveList(KEYS.stringing, this.data.stringing);
    saveList(KEYS.charges, this.data.charges);
    saveList(KEYS.members, this.data.members);
    localStorage.setItem(S27_BLOCKS_KEY, JSON.stringify(this.data.blocks));
    localStorage.setItem(S27_NOTES_KEY, JSON.stringify(this.data.notes));
    const cards: S27PaymentProfile[] = this.data.members.map((m, i) => ({
      memberNumber: m.memberNumber,
      brand: i % 2 ? "Mastercard" : "Visa",
      last4: String(4242 + i),
      expMonth: "12",
      expYear: "28",
      billingZip: "12572",
      oneClick: true,
    }));
    saveList(KEYS.payment, cards);
  }

  actions(): AdminVoiceActions {
    return {
      saveCourts: (next) => {
        this.data.courts = next;
        persistCourts(next);
      },
      saveClinics: (next) => {
        this.data.clinics = next;
        saveList(KEYS.clinics, next);
      },
      saveLessons: (next) => {
        this.data.lessons = next;
        saveList(KEYS.lessons, next);
      },
      saveEvents: (next) => {
        this.data.events = next;
        saveList(KEYS.events, next);
      },
      saveStringing: (next) => {
        this.data.stringing = next;
        saveList(KEYS.stringing, next);
      },
      saveCharges: (next) => {
        this.data.charges = next;
        saveList(KEYS.charges, next);
      },
      saveHolds: (next) => {
        this.data.blocks = next;
        localStorage.setItem(S27_BLOCKS_KEY, JSON.stringify(next));
      },
      saveNotes: (next) => {
        this.data.notes = next;
        localStorage.setItem(S27_NOTES_KEY, JSON.stringify(next));
      },
      markStringingReady: async (id) => {
        const readyAt = NOW.toISOString();
        this.data.stringing = this.data.stringing.map((x) =>
          x.id === id ? { ...x, shopStatus: "ready" as const, readyAt, notifiedAt: readyAt } : x
        );
        saveList(KEYS.stringing, this.data.stringing);
      },
      markStringingPickedUp: (id) => {
        this.data.stringing = this.data.stringing.map((x) => (x.id === id ? { ...x, shopStatus: "picked_up" as const } : x));
        saveList(KEYS.stringing, this.data.stringing);
      },
      onWeatherClose: (result) => {
        this.data.courts = result.courts;
        this.data.clinics = result.clinics;
        this.data.lessons = result.lessons;
        this.data.blocks = result.blocks;
        this.data.charges = [...result.charges, ...this.data.charges];
        this.sync();
      },
      openMember: (memberNumber) => {
        this.opened = memberNumber;
      },
    };
  }

  parse(phrase: string): AdminDraft {
    return parseAdminVoice(phrase, this.data, NOW);
  }

  async speak(phrase: string) {
    const draft = this.parse(phrase);
    const message = await applyAdminDraft(draft, this.data, this.actions());
    const conflicts = paidCourtConflicts(this.data.courts);
    assert(conflicts.length === 0, `paid court overlap after “${phrase}”: ${conflicts.join("; ")}`);
    return { draft, message };
  }

  court(id: string) {
    return this.data.courts.find((b) => b.id === id);
  }

  paidOn(date: string, courtId: CourtId, hour: number) {
    return this.data.courts.find(
      (b) =>
        b.date === date &&
        b.courtId === courtId &&
        b.paymentStatus === "paid" &&
        hour >= b.hour &&
        hour < b.hour + b.durationHours
    );
  }
}

function hourLabel(h: number) {
  if (h === 12) return "noon";
  if (h < 12) return `${h}am`;
  return `${h - 12}pm`;
}

type Scenario = { name: string; run: () => Promise<void> | void };

const scenarios: Scenario[] = [];

function add(name: string, run: () => Promise<void> | void) {
  scenarios.push({ name, run });
}

function first(m: S27MemberAccount) {
  return m.name.split(" ")[0];
}

// --- Lookups (non-mutating) ---
for (const q of [
  "who's on court 3 at 4",
  "who is on court 4 at 11",
  "what's happening at 4",
  "how's the Tuesday juniors looking",
  "roster for Thursday ladies",
  "today's 9am clinic",
  "who's on court 3 at 8am",
  "board at 11",
  "openings at 3 on court 3",
  "Sunday 8am clinic roster",
]) {
  add(`lookup · ${q}`, () => {
    const w = ClubWorld.fresh();
    const d = w.parse(q);
    assert(d.kind === "lookup" || d.kind === "unknown", `${q} → ${d.kind}`);
    if (q.includes("court 3 at 4")) assert(/Sarah/i.test(d.detail), "Sarah should be on court 3 at 4");
    if (q.includes("Tuesday juniors")) assert(/Emma/i.test(d.detail) && /Leo/i.test(d.detail), "juniors roster");
  });
}

// --- Member file ---
for (const m of MEMBERS.slice(0, 8)) {
  add(`open member · ${m.name}`, async () => {
    const w = ClubWorld.fresh();
    const { draft } = await w.speak(`pull up ${first(m)}`);
    assert(draft.kind === "open_member", draft.kind);
    assert(w.opened === m.memberNumber, `opened ${w.opened}`);
  });
}

// --- Court books ---
const bookSlots: { who: string; court: string; hour: number; dateWord?: string }[] = [];
const bookHours = [7, 9, 10, 12, 13, 15, 18, 19];
const bookPeople = ["Helen", "James", "Nina", "Anna", "David", "Ben", "Marisol", "Owen"];
for (const who of bookPeople) {
  for (const courtName of ["court 3", "court 4"]) {
    for (const hour of [7, 10]) {
      bookSlots.push({ who, court: courtName, hour, dateWord: "tomorrow" });
    }
  }
}
bookSlots.push(
  { who: "Helen", court: "court 3", hour: 7 },
  { who: "James", court: "court 4", hour: 7 },
  { who: "Nina", court: "court 3", hour: 12 },
  { who: "Anna", court: "court 4", hour: 12 },
  { who: "David", court: "court 3", hour: 15 },
  { who: "Ben", court: "court 4", hour: 15 },
  { who: "Marisol", court: "court 3", hour: 19 },
  { who: "Lucy", court: "court 4", hour: 7 },
  { who: "Tom", court: "court 3", hour: 10 },
  { who: "Priya", court: "court 4", hour: 9 }
);
for (const slot of bookSlots) {
  const when = slot.dateWord ? `${slot.dateWord} ` : "";
  const q = `book ${slot.who} ${slot.court} ${when}at ${hourLabel(slot.hour)}`;
  add(`book court · ${q}`, async () => {
    const w = ClubWorld.fresh();
    const { draft, message } = await w.speak(q);
    assert(draft.kind === "add_court", `${q} → ${draft.kind}`);
    assert(/Booked/i.test(message), message);
    const cid: CourtId = slot.court.includes("4") ? "court-2" : "court-1";
    const date = slot.dateWord === "tomorrow" ? SAT : TODAY;
    const row = w.paidOn(date, cid, slot.hour);
    assert(row, `missing booking for ${q}`);
    assert(row!.clientName.toLowerCase().includes(slot.who.toLowerCase()), row!.clientName);
    assert(row!.amount === 50, `member rate ${row!.amount}`);
  });
}

add("book court · guest walk-up Kate court 3 at 7am", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("book Kate court 3 at 7am");
  assert(draft.kind === "add_court", draft.kind);
  const row = w.paidOn(TODAY, "court-1", 7);
  assert(row?.clientName === "Kate" || row?.clientName === "Kate Morelli" || /Kate/i.test(row?.clientName || ""), row?.clientName);
  assert(row?.amount === 60, `guest rate ${row?.amount}`);
});

add("book court · refuse double-book Sarah 4pm court 3", async () => {
  const w = ClubWorld.fresh();
  const before = w.data.courts.length;
  const { message } = await w.speak("book Sarah court 3 at 4");
  assert(/already/i.test(message), message);
  assert(w.data.courts.length === before, "should not append a second Sarah 4pm");
  assert(w.data.courts.filter((b) => b.id === "ct-sarah").length === 1, "Sarah original stays");
});

add("book court · refuse Miles 4pm court 4 taken", async () => {
  const w = ClubWorld.fresh();
  const { message } = await w.speak("book Helen court 4 at 4pm");
  assert(/Miles/i.test(message) && /already/i.test(message), message);
  assert(!w.data.courts.some((b) => b.clientName === "Helen Cho" && b.hour === 16 && b.date === TODAY), "Helen should not land on Miles’s hour");
});

add("book court · unpaid Owen 11am court 4 can be booked over", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("book Helen court 4 at 11am");
  assert(draft.kind === "add_court", draft.kind);
  assert(w.paidOn(TODAY, "court-2", 11)?.clientName.includes("Helen"), "Helen paid on unpaid slot");
});

add("book court · 2-hour Priya blocks 6pm court 3", async () => {
  const w = ClubWorld.fresh();
  const { message } = await w.speak("book Anna court 3 at 6pm");
  assert(/Priya/i.test(message), message);
});

// --- Cancels ---
const cancels: { q: string; goneId: string; type: "court" | "clinic" | "lesson" | "event" }[] = [
  { q: "cancel Sarah court 3 at 4", goneId: "ct-sarah", type: "court" },
  { q: "take Lucy off court 3 at 8", goneId: "ct-lucy-am", type: "court" },
  { q: "cancel Miles court 4 at 4", goneId: "ct-miles-4", type: "court" },
  { q: "cancel Claire tomorrow court", goneId: "ct-claire-sat", type: "court" },
  { q: "take Tom off court Saturday", goneId: "ct-tom-sat", type: "court" },
  { q: "cancel Anna Sunday court", goneId: "ct-anna-sun", type: "court" },
  { q: "drop Emma from Tuesday juniors", goneId: "cl-emma", type: "clinic" },
  { q: "take Leo off juniors", goneId: "cl-leo", type: "clinic" },
  { q: "cancel Sarah ladies clinic", goneId: "cl-sarah-ladies", type: "clinic" },
  { q: "drop Helen from Saturday cardio", goneId: "cl-helen-cardio", type: "clinic" },
  { q: "cancel James Saturday clinic", goneId: "cl-james-cardio", type: "clinic" },
  { q: "take Lucy off Tennis 101", goneId: "cl-lucy-101", type: "clinic" },
  { q: "cancel Helen lesson", goneId: "ls-helen", type: "lesson" },
  { q: "cancel Nina lesson", goneId: "ls-nina-paid", type: "lesson" },
  { q: "cancel James event", goneId: "ev-james", type: "event" },
];
for (const c of cancels) {
  add(`cancel · ${c.q}`, async () => {
    const w = ClubWorld.fresh();
    const { draft } = await w.speak(c.q);
    assert(draft.kind === "cancel", `${c.q} → ${draft.kind} ${draft.detail}`);
    if (c.type === "court") assert(!w.court(c.goneId), `${c.goneId} still on courts`);
    if (c.type === "clinic") assert(!w.data.clinics.some((b) => b.id === c.goneId), `${c.goneId} clinic`);
    if (c.type === "lesson") assert(!w.data.lessons.some((b) => b.id === c.goneId), `${c.goneId} lesson`);
    if (c.type === "event") assert(!w.data.events.some((b) => b.id === c.goneId), `${c.goneId} event`);
  });
}

add("cancel · unknown person has nothing", async () => {
  const w = ClubWorld.fresh();
  const d = w.parse("cancel Zorp court 3 at 4");
  assert(d.kind === "unknown" || d.kind === "cancel", d.kind);
  if (d.kind === "cancel") throw new Error("should not cancel a real booking for Zorp");
});

// --- Clinics ---
const clinicAdds: { q: string; clinicId: string; who: string }[] = [
  { q: "add Helen to Thursday ladies", clinicId: "thu-am-ladies-doubles", who: "Helen" },
  { q: "put Owen in Saturday 9am", clinicId: "sat-sun-point-play", who: "Owen" },
  { q: "add Miles to Sunday cardio", clinicId: "sat-sun-cardio", who: "Miles" },
  { q: "walk up Helen to Tennis 101", clinicId: "tue-am-beginner-fundamentals", who: "Helen" },
  { q: "add James to Wednesday cardio", clinicId: "wed-am-beginner", who: "James" },
  { q: "put Tom in Monday 5pm clinic", clinicId: "mon-fri-beginner", who: "Tom" },
  { q: "add Anna to Friday 6pm clinic", clinicId: "mon-fri-int-adv", who: "Anna" },
  { q: "sign Lucy up for Saturday cardio", clinicId: "sat-sun-cardio", who: "Lucy" },
  { q: "add Ben to high performance Tuesday", clinicId: "mon-fri-advanced", who: "Ben" },
  { q: "put Marisol in 9am Saturday", clinicId: "sat-sun-point-play", who: "Marisol" },
  { q: "add David to Sunday 8am clinic", clinicId: "sat-sun-cardio", who: "David" },
  { q: "add Priya to ladies clinic Thursday", clinicId: "thu-am-ladies-doubles", who: "Priya" },
  { q: "add Olivia to Tuesday juniors", clinicId: "tue-am-juniors", who: "Olivia" },
  { q: "add Olivia to high school juniors", clinicId: "thu-hs-juniors", who: "Olivia" },
  { q: "put Emma Bennett in tots", clinicId: "wed-am-tots", who: "Emma" },
  { q: "sign Emma up for toddlers", clinicId: "wed-am-toddlers", who: "Emma" },
  { q: "add Leo to high school juniors", clinicId: "thu-hs-juniors", who: "Leo" },
  { q: "add Claire to Saturday point play", clinicId: "sat-sun-point-play", who: "Claire" },
  { q: "add Nina to Saturday games", clinicId: "sat-sun-point-play", who: "Nina" },
  { q: "add Helen to Sunday 9", clinicId: "sat-sun-point-play", who: "Helen" },
];
for (const c of clinicAdds) {
  add(`clinic add · ${c.q}`, async () => {
    const w = ClubWorld.fresh();
    const before = w.data.clinics.length;
    const { draft, message } = await w.speak(c.q);
    assert(draft.kind === "add_clinic", `${c.q} → ${draft.kind}`);
    assert(/Added/i.test(message), message);
    assert(w.data.clinics.length === before + 1, "roster +1");
    const row = w.data.clinics[w.data.clinics.length - 1];
    assert(row.clinicId === c.clinicId, `${row.clinicId} vs ${c.clinicId}`);
    assert(row.clientName.toLowerCase().includes(c.who.toLowerCase()), row.clientName);
    assert(row.paymentStatus === "paid", row.paymentStatus);
  });
}

add("clinic add · Emma already on Tuesday juniors is idempotent", async () => {
  const w = ClubWorld.fresh();
  const before = w.data.clinics.filter((b) => b.clinicId === "tue-am-juniors" && /Emma/i.test(b.clientName)).length;
  const { message } = await w.speak("add Emma to Tuesday juniors");
  assert(/already/i.test(message), message);
  const after = w.data.clinics.filter((b) => b.clinicId === "tue-am-juniors" && /Emma/i.test(b.clientName)).length;
  assert(after === before, "duplicate Emma");
});

// --- Rain-outs ---
const rainPhrases: { q: string; date: string; start?: number; dur?: number; gone: string[]; keep: string[] }[] = [
  { q: "rain out 4pm", date: TODAY, start: 16, dur: 1, gone: ["ct-sarah", "ct-miles-4", "ls-nina-paid"], keep: ["ct-lucy-am", "ct-owen-unpaid", "ct-priya-2h", "ls-declined"] },
  { q: "rain out 4 to 6", date: TODAY, start: 16, dur: 2, gone: ["ct-sarah", "ct-miles-4", "ct-priya-2h", "ls-nina-paid"], keep: ["ct-lucy-am", "ct-owen-unpaid"] },
  { q: "rain out two hours at 4", date: TODAY, start: 16, dur: 2, gone: ["ct-sarah", "ct-priya-2h"], keep: ["ct-lucy-am"] },
  { q: "rain out 4 and 5 this afternoon", date: TODAY, start: 16, dur: 2, gone: ["ct-sarah", "ct-priya-2h"], keep: ["ct-lucy-am"] },
  { q: "rain out this morning", date: TODAY, start: 7, dur: 5, gone: ["ct-lucy-am"], keep: ["ct-sarah", "ct-miles-4", "ct-priya-2h"] },
  { q: "rain out today", date: TODAY, start: undefined, dur: undefined, gone: ["ct-sarah", "ct-lucy-am", "ct-miles-4", "ct-priya-2h", "ls-nina-paid"], keep: ["ct-owen-unpaid", "ls-declined", "ct-claire-sat"] },
  { q: "wash out Saturday", date: SAT, gone: ["ct-claire-sat", "ct-tom-sat", "ct-guest-kate", "cl-helen-cardio", "cl-james-cardio", "ls-helen"], keep: ["ct-sarah"] },
  { q: "wash out Saturday morning", date: SAT, start: 7, dur: 5, gone: ["ct-claire-sat", "cl-helen-cardio", "cl-james-cardio"], keep: ["ct-tom-sat"] },
  { q: "weather close Sunday", date: SUN, gone: ["ct-anna-sun"], keep: ["ct-sarah"] },
  { q: "rain out 5pm", date: TODAY, start: 17, dur: 1, gone: ["ct-priya-2h"], keep: ["ct-sarah", "ct-lucy-am"] },
  { q: "rain out 8am", date: TODAY, start: 8, dur: 1, gone: ["ct-lucy-am"], keep: ["ct-sarah"] },
  { q: "close the courts for weather", date: TODAY, gone: ["ct-sarah", "ct-lucy-am"], keep: ["ct-claire-sat"] },
  { q: "rainout Monday", date: MON, gone: [], keep: ["ct-sarah"] },
  { q: "weather close Tuesday", date: TUE, gone: ["cl-emma", "cl-leo", "cl-lucy-101"], keep: ["ct-sarah"] },
];
for (const r of rainPhrases) {
  add(`rain · ${r.q}`, async () => {
    const w = ClubWorld.fresh();
    const { draft } = await w.speak(r.q);
    assert(draft.kind === "rain", `${r.q} → ${draft.kind}`);
    for (const id of r.gone) {
      assert(!w.court(id) && !w.data.clinics.some((b) => b.id === id) && !w.data.lessons.some((b) => b.id === id), `${id} should be cleared by “${r.q}”`);
    }
    for (const id of r.keep) {
      assert(
        !!w.court(id) || w.data.clinics.some((b) => b.id === id) || w.data.lessons.some((b) => b.id === id),
        `${id} should survive “${r.q}”`
      );
    }
    const hold = w.data.blocks.find((b) => /weather/i.test(b.reason || "") && b.date === r.date);
    assert(hold, "weather hold missing");
    if (r.start != null && r.dur != null && r.dur < 12) {
      assert(hold!.startHour === r.start, `start ${hold!.startHour}`);
      assert(hold!.durationHours === r.dur, `dur ${hold!.durationHours}`);
      assert(!weatherClosedOnDate(r.date), "hourly rain is not a full-day close");
      assert(weatherClosedForWindow(r.date, r.start, r.dur), "window should be closed");
    }
    for (const row of w.data.charges.filter((c) => c.description.startsWith("Weather refund"))) {
      assert(row.amount < 0, `refund ${row.amount}`);
    }
  });
}

add("rain · unpaid Owen is not refunded", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out today");
  assert(w.court("ct-owen-unpaid"), "unpaid court stays");
  assert(!w.data.charges.some((c) => /Owen/i.test(c.clientName) && c.amount < 0), "no Owen refund");
});

add("rain · declined lesson is not cleared", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out 3pm");
  assert(w.data.lessons.some((l) => l.id === "ls-declined"), "declined lesson stays");
});

add("rain · second full-day is already closed", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out today");
  const second = w.parse("rain out today");
  assert(second.kind === "lookup" && /already/i.test(second.title + second.detail), second.kind);
});

add("rain · hourly then later hour still bookable", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out 4pm");
  assert(getProgramBlock(TODAY, "court-1", 16)?.type === "hold", "4pm held");
  assert(!getProgramBlock(TODAY, "court-1", 7), "7am not weather-held");
  const { draft, message } = await w.speak("book Helen court 3 at 7am");
  assert(draft.kind === "add_court", draft.kind);
  assert(/Booked/i.test(message), message);
});

add("rain · cannot book into weather window", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out 4 to 6");
  const { message } = await w.speak("book Helen court 3 at 4pm");
  assert(/weather/i.test(message), message);
});

add("rain · overlapping hourly holds stack, full day replaces", async () => {
  const w = ClubWorld.fresh();
  await w.speak("rain out 8am");
  await w.speak("rain out 4pm");
  const weather = w.data.blocks.filter((b) => /weather/i.test(b.reason || "") && b.date === TODAY);
  assert(weather.length >= 2, `hourly holds ${weather.length}`);
  await w.speak("rain out today");
  const after = w.data.blocks.filter((b) => /weather/i.test(b.reason || "") && b.date === TODAY);
  assert(after.length === 1, `full day should replace ${after.map((b) => b.id).join(",")}`);
  assert(after[0].durationHours >= 12, "full day hours");
});

add("rain · affected rows match 4–6 window", () => {
  const data = fixture();
  const rows = weatherAffectedRows({
    date: TODAY,
    courts: data.courts,
    clinics: data.clinics,
    lessons: data.lessons,
    startHour: 16,
    durationHours: 2,
  });
  const ids = rows.map((r) => r.bookingId);
  assert(ids.includes("ct-sarah"), "sarah");
  assert(ids.includes("ct-miles-4"), "miles");
  assert(ids.includes("ct-priya-2h"), "priya 2h overlaps 4–6");
  assert(!ids.includes("ct-lucy-am"), "lucy 8am");
  assert(!ids.includes("ct-owen-unpaid"), "unpaid");
  assert(ids.includes("ls-nina-paid"), "nina lesson 4pm");
  assert(!ids.includes("ls-declined"), "declined");
});

add("rain · window label 4–6", () => {
  assert(weatherWindowLabel(16, 2) === `${formatHour(16)}–${formatHour(18)}`, weatherWindowLabel(16, 2));
  assert(weatherWindowLabel(7, 14, true) === "all day", "all day");
});

add("rain · already-closed helper", () => {
  const blocks: S27AdminBlock[] = [
    { id: "w", date: TODAY, courtId: "both", startHour: 16, durationHours: 1, reason: "Weather — 4:00 PM–5:00 PM", createdAt: "", kind: "hold" },
  ];
  assert(weatherAlreadyClosed(blocks, TODAY, 16, 1), "same hour");
  assert(!weatherAlreadyClosed(blocks, TODAY, 17, 1), "later hour");
  assert(!weatherAlreadyClosed(blocks, TODAY, null, null), "full day not covered by 1h");
});

// --- Holds ---
add("hold · court 3 at 10", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("hold court 3 at 10");
  assert(draft.kind === "hold", draft.kind);
  assert(w.data.blocks.some((b) => b.startHour === 10 && b.courtId === "court-1"), "hold placed");
});

add("hold · both courts at 1pm", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("hold both courts at 1pm");
  assert(draft.kind === "hold", draft.kind);
  assert(w.data.blocks.some((b) => b.courtId === "both" && b.startHour === 13), "both");
});

add("hold · release court 3 at 2", async () => {
  const w = ClubWorld.fresh();
  assert(w.data.blocks.some((b) => b.id === "hold-1"), "fixture hold");
  const { draft } = await w.speak("release the hold on court 3 at 2");
  assert(draft.kind === "release_hold", draft.kind);
  assert(!w.data.blocks.some((b) => b.id === "hold-1"), "released");
});

add("hold · program block at 2pm court 3", () => {
  const w = ClubWorld.fresh();
  const block = getProgramBlock(TODAY, "court-1", 14);
  assert(block?.type === "hold", JSON.stringify(block));
});

// --- Charges / notes / paid / lessons / stringing ---
for (const q of [
  "charge Sarah $5 for balls",
  "charge Claire five dollars for balls",
  "charge Priya $8 grip",
  "charge Helen $3 drink",
  "charge Nina $25 demo",
  "charge Tom $3 water",
  "sold Owen a can of balls",
  "Sarah owes $5 for balls",
]) {
  add(`charge · ${q}`, async () => {
    const w = ClubWorld.fresh();
    const { draft } = await w.speak(q);
    assert(draft.kind === "charge", `${q} → ${draft.kind}`);
    assert(w.data.charges.length === 1, "one charge");
    assert(w.data.charges[0].amount > 0, "positive");
    assert(w.data.charges[0].paymentStatus === "paid", "desk paid");
  });
}

add("note · remember Sarah brings a guest", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("note for Sarah: brings a guest Saturday");
  assert(draft.kind === "note", draft.kind);
  assert(/guest/i.test(w.data.notes.find((n) => n.memberNumber === "107")?.note || ""), "note body");
});

add("note · append second note", async () => {
  const w = ClubWorld.fresh();
  await w.speak("note for Sarah: first");
  await w.speak("note for Sarah: second");
  const note = w.data.notes.find((n) => n.memberNumber === "107")?.note || "";
  assert(/first/.test(note) && /second/.test(note), note);
});

add("mark paid · Owen court", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("mark Owen paid for court");
  assert(draft.kind === "mark_paid", draft.kind);
  assert(w.court("ct-owen-unpaid")?.paymentStatus === "paid", "owen paid");
});

add("mark paid · Nina clinic", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("mark Nina paid for clinic");
  assert(draft.kind === "mark_paid", draft.kind);
  assert(w.data.clinics.find((b) => b.id === "cl-nina-unpaid")?.paymentStatus === "paid", "nina clinic");
});

add("mark paid · Anna stringing", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("mark Anna paid for stringing");
  assert(draft.kind === "mark_paid", draft.kind);
  assert(w.data.stringing.find((b) => b.id === "st-anna-unpaid")?.paymentStatus === "paid", "anna string");
});

add("lesson · accept Miles", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("accept Miles lesson");
  assert(draft.kind === "lesson_status", draft.kind);
  assert(w.data.lessons.find((l) => l.id === "ls-miles")?.requestStatus === "accepted", "accepted");
});

add("lesson · decline David", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("decline David lesson");
  assert(draft.kind === "lesson_status", draft.kind);
  assert(w.data.lessons.find((l) => l.id === "ls-david-req")?.requestStatus === "declined", "declined");
});

add("stringing · Claire ready", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("Claire's racket is ready");
  assert(draft.kind === "string_ready", draft.kind);
  assert(w.data.stringing.find((s) => s.id === "st-claire")?.shopStatus === "ready", "ready");
});

add("stringing · Tom pickup", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("Tom picked up his racket");
  assert(draft.kind === "string_pickup", draft.kind);
  assert(w.data.stringing.find((s) => s.id === "st-tom")?.shopStatus === "picked_up", "picked up");
});

add("stringing · Owen ready then pickup", async () => {
  const w = ClubWorld.fresh();
  await w.speak("Owen's racket is ready");
  assert(w.data.stringing.find((s) => s.id === "st-owen")?.shopStatus === "ready", "ready");
  await w.speak("Owen picked up his racket");
  assert(w.data.stringing.find((s) => s.id === "st-owen")?.shopStatus === "picked_up", "picked up");
});

// --- Member voice ---
add("member · Sarah my day includes 4pm court", () => {
  const w = ClubWorld.fresh();
  const intent = parseVoiceFallback("what's on my book today", NOW);
  const result = resolveVoice(intent, sessionFor(MEMBERS.find((m) => m.memberNumber === "107")!));
  assert(/Court 3/i.test(result.spoken + result.detail), result.spoken);
});

add("member · Sarah cannot cancel 4pm inside 24h", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("cancel my court at 4", NOW);
  const result = resolveVoice(intent, sessionFor(MEMBERS.find((m) => m.memberNumber === "107")!));
  assert(!result.cancel, "locked cancel");
  assert(/window|stays on the book/i.test(result.spoken + result.detail), result.spoken);
});

add("member · Claire far court can cancel", () => {
  ClubWorld.fresh();
  assert(canChangeBooking(FAR, 10), "far slot is outside 24h");
  const intent = parseVoiceFallback("cancel my court Saturday", NOW);
  // FAR is Aug 22 Saturday; parseSpokenDate("Saturday") from Fri Aug 14 is Aug 15.
  const farIntent = parseVoiceFallback("cancel my court", NOW);
  farIntent.date = FAR;
  farIntent.hour = 10;
  const result = resolveVoice(farIntent, sessionFor(MEMBERS.find((m) => m.memberNumber === "101")!));
  assert(result.cancel?.id === "ct-claire-far", JSON.stringify(result));
  applyVoiceCancel(result.cancel!);
  const left = uniqueCourts(
    JSON.parse(localStorage.getItem(KEYS.courts) || "{}") as Record<string, S27CourtBooking>
  );
  assert(!left.some((b) => b.id === "ct-claire-far"), "far court gone");
});

add("member · Claire Saturday 9am is still inside 24h from Fri 10am", () => {
  ClubWorld.fresh();
  assert(!canChangeBooking(SAT, 9), "Sat 9am is inside 24h from Fri 10am");
});

add("member · check court 3 at 4 is taken", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("is court 3 open at 4", NOW);
  const result = resolveVoice(intent, sessionFor(MEMBERS[0]));
  assert(/nothing open|no open/i.test(result.spoken) || !/Court 3 4:00 PM/.test(result.detail), result.spoken + result.detail);
});

add("member · check court 3 at 7 is open", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("is court 3 open at 7am", NOW);
  const result = resolveVoice(intent, sessionFor(MEMBERS[0]));
  assert(/Court 3/i.test(result.spoken + result.detail) && /7/i.test(result.spoken + result.detail), result.spoken);
});

add("member · Emma clinic spots Tuesday juniors", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("is there room in Tuesday juniors", NOW);
  const claire = MEMBERS.find((m) => m.memberNumber === "101")!;
  const result = resolveVoice(intent, sessionFor(claire));
  assert(/juniors/i.test(result.spoken), result.spoken);
  assert(/6 spots|6 spot/i.test(result.spoken) || /open/.test(result.spoken + result.detail), result.spoken);
});

add("member · prices courts", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("how much is a court", NOW);
  const result = resolveVoice(intent, null);
  assert(/\$50/.test(result.spoken + result.detail), result.spoken);
});

add("member · unsigned cancel asks to sign in", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("cancel my court", NOW);
  const result = resolveVoice(intent, null);
  assert(/sign in/i.test(result.spoken), result.spoken);
});

add("member · drop Emma from juniors when far enough", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("take Emma off Tuesday juniors", NOW);
  intent.date = TUE;
  const result = resolveVoice(intent, sessionFor(MEMBERS.find((m) => m.memberNumber === "101")!));
  if (result.cancel) {
    applyVoiceCancel(result.cancel);
    const clinics = JSON.parse(localStorage.getItem(KEYS.clinics) || "[]") as S27ClinicBooking[];
    assert(!clinics.some((b) => b.id === "cl-emma"), "emma dropped");
  } else {
    assert(/window|stays on the book|don't see/i.test(result.spoken + result.detail), result.spoken);
  }
});

// --- Lesson conflicts ---
add("lesson · Maya conflict with Helen Saturday 11", () => {
  const data = fixture();
  const maya = s27Pros.find((p) => p.id === "maya-ellison")!;
  const msg = lessonConflict({
    pro: maya,
    date: SAT,
    hour: 11,
    duration: "60",
    lessons: data.lessons,
    courts: data.courts,
  });
  assert(msg, "should conflict");
});

add("lesson · Maya Monday 10 is open", () => {
  const data = fixture();
  const maya = s27Pros.find((p) => p.id === "maya-ellison")!;
  const msg = lessonConflict({
    pro: maya,
    date: MON,
    hour: 10,
    duration: "60",
    lessons: data.lessons,
    courts: data.courts,
  });
  assert(!msg, msg || "ok");
});

add("lesson · Jonah does not teach Friday", () => {
  const jonah = s27Pros.find((p) => p.id === "jonah-berkowitz")!;
  const msg = lessonConflict({
    pro: jonah,
    date: TODAY,
    hour: 10,
    duration: "60",
    lessons: [],
  });
  assert(/does not teach/i.test(msg || ""), msg || "missing");
});

add("lesson · clinic blocks court 2 Tuesday 5pm for Jonah", () => {
  const jonah = s27Pros.find((p) => p.id === "jonah-berkowitz")!;
  const msg = lessonConflict({
    pro: jonah,
    date: TUE,
    hour: 17,
    duration: "60",
    lessons: [],
  });
  assert(/reserved|clinic|hold/i.test(msg || ""), msg || "missing");
});

// --- Direct weather apply (no voice) ---
add("weather apply · 1 hour 4pm sendEmail false", async () => {
  const data = fixture();
  const result = await applyWeatherClose({
    date: TODAY,
    courts: data.courts,
    clinics: data.clinics,
    lessons: data.lessons,
    blocks: data.blocks,
    sendEmail: false,
    startHour: 16,
    durationHours: 1,
  });
  assert(result.emailed === 0, `emailed ${result.emailed}`);
  assert(!result.courts.some((b) => b.id === "ct-sarah"), "sarah gone");
  assert(result.courts.some((b) => b.id === "ct-lucy-am"), "lucy stays");
  assert(result.charges.every((c) => c.amount < 0), "refunds");
});

add("weather apply · 2h court fully removed on 1h overlap", async () => {
  const data = fixture();
  const result = await applyWeatherClose({
    date: TODAY,
    courts: data.courts,
    clinics: data.clinics,
    lessons: data.lessons,
    blocks: data.blocks,
    sendEmail: false,
    startHour: 18,
    durationHours: 1,
  });
  assert(!result.courts.some((b) => b.id === "ct-priya-2h"), "2h 5–7 overlaps 6pm");
  assert(result.courts.some((b) => b.id === "ct-sarah"), "4pm stays");
});

// --- Sequential busy desk ---
add("sequential · Friday desk day", async () => {
  const w = ClubWorld.fresh();
  await w.speak("book Helen court 3 at 7am");
  await w.speak("book James court 4 at 7am");
  await w.speak("charge Helen $5 for balls");
  await w.speak("hold court 4 at 1pm");
  await w.speak("add Priya to Thursday ladies");
  await w.speak("Claire's racket is ready");
  await w.speak("accept Miles lesson");
  await w.speak("rain out 4 to 6");
  assert(!w.court("ct-sarah"), "sarah rained out");
  assert(w.court("ct-lucy-am"), "8am stands");
  assert(w.paidOn(TODAY, "court-1", 7)?.clientName.includes("Helen"), "helen 7am");
  assert(w.data.stringing.find((s) => s.id === "st-claire")?.shopStatus === "ready", "claire ready");
  assert(w.data.lessons.find((l) => l.id === "ls-miles")?.requestStatus === "accepted", "miles accepted");
  await w.speak("cancel Helen court 3 at 7");
  assert(!w.paidOn(TODAY, "court-1", 7), "helen cancelled");
  await w.speak("book Anna court 3 at 7am");
  assert(w.paidOn(TODAY, "court-1", 7)?.clientName.includes("Anna"), "anna takes 7am");
  await w.speak("release the hold on court 3 at 2");
  assert(!w.data.blocks.some((b) => b.id === "hold-1"), "2pm hold gone");
  await w.speak("note for Owen: guest fee Saturday");
  await w.speak("mark Owen paid for court");
  assert(w.court("ct-owen-unpaid")?.paymentStatus === "paid", "owen paid");
  await w.speak("Tom picked up his racket");
  assert(w.data.stringing.find((s) => s.id === "st-tom")?.shopStatus === "picked_up", "tom pickup");
});

// Generated member × court books on Sunday (empty-ish)
const sundayPeople = MEMBERS.map(first);
const sundayHours = [7, 9, 10, 12, 13, 15, 16, 18];
let sundayCount = 0;
for (const who of sundayPeople) {
  for (const [courtName, cid] of [
    ["court 3", "court-1"],
    ["court 4", "court-2"],
  ] as const) {
    for (const hour of sundayHours) {
      if (cid === "court-1" && hour === 8) continue; // Anna 8am Sunday
      if (sundayCount >= 70) break;
      const q = `book ${who} ${courtName} Sunday at ${hourLabel(hour)}`;
      add(`sunday book · ${q}`, async () => {
        const w = ClubWorld.fresh();
        const { draft, message } = await w.speak(q);
        assert(draft.kind === "add_court", `${q} → ${draft.kind} ${draft.detail}`);
        assert(/Booked/i.test(message), message);
        const row = w.paidOn(SUN, cid, hour);
        assert(row, `missing ${q}`);
        assert(row!.clientName.toLowerCase().includes(who.toLowerCase()), row!.clientName);
      });
      sundayCount += 1;
    }
  }
}

// Extra clinic rain / cancel / charge combos to fill remaining if needed
const extraClinics = s27Clinics.map((c) => c.id);
for (const id of extraClinics) {
  const def = s27Clinics.find((c) => c.id === id)!;
  add(`clinic catalog · ${def.id} has capacity and price`, () => {
    assert(def.capacity > 0, def.id);
    assert(def.memberPrice > 0 && def.guestPrice > def.memberPrice, def.id);
    assert(def.blockCourts.length > 0, def.id);
  });
}

add("event · mark Marisol paid", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("mark Marisol paid for event");
  assert(draft.kind === "mark_paid", draft.kind);
  assert(w.data.events.find((b) => b.id === "ev-marisol-unpaid")?.paymentStatus === "paid", "marisol event");
});

add("rain · afternoon window keeps 8am Lucy", async () => {
  const w = ClubWorld.fresh();
  const { draft } = await w.speak("rain out this afternoon");
  assert(draft.kind === "rain", draft.kind);
  assert(w.court("ct-lucy-am"), "morning court stays");
  const hold = w.data.blocks.find((b) => /weather/i.test(b.reason || "") && b.date === TODAY);
  assert(hold && hold.startHour === 12, `afternoon start ${hold?.startHour}`);
});

add("member · Owen my day does not include Sarah’s court", () => {
  ClubWorld.fresh();
  const intent = parseVoiceFallback("what's on my book today", NOW);
  const result = resolveVoice(intent, sessionFor(MEMBERS.find((m) => m.memberNumber === "102")!));
  assert(!/Sarah/i.test(result.spoken + result.detail), result.spoken);
});

add("invariant · fixture starts with no paid overlaps", () => {
  const hits = paidCourtConflicts(fixture().courts);
  assert(hits.length === 0, hits.join("; "));
});

add("hoursOverlap · 2h 5pm covers 6pm not 4pm", () => {
  assert(hoursOverlap(17, 2, 17), "5pm");
  assert(hoursOverlap(17, 2, 18), "6pm");
  assert(!hoursOverlap(17, 2, 16), "4pm");
  assert(!hoursOverlap(17, 2, 19), "7pm");
});

async function main() {
  if (scenarios.length < 250) {
    throw new Error(`Need 250 scenarios, built ${scenarios.length}`);
  }
  const slice = scenarios.slice(0, 250);
  let failed = 0;
  const errors: string[] = [];
  for (let i = 0; i < slice.length; i++) {
    const s = slice[i];
    try {
      await s.run();
    } catch (err) {
      failed += 1;
      errors.push(`${i + 1}. ${s.name}: ${(err as Error).message}`);
    }
  }
  if (failed) {
    console.error(`FAILED ${failed}/${slice.length}`);
    for (const e of errors.slice(0, 40)) console.error("  •", e);
    if (errors.length > 40) console.error(`  …and ${errors.length - 40} more`);
    process.exit(1);
  }
  console.log(`ok ${slice.length} scenarios (${scenarios.length} defined)`);
}

main();
