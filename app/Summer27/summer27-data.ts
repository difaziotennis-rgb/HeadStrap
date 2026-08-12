export const s27Nav: { href: string; label: string; memberOnly?: boolean; end?: boolean }[] = [
  { href: "/Summer27", label: "Home" },
  { href: "/Summer27/book", label: "Courts" },
  { href: "/Summer27/clinics", label: "Clinics" },
  { href: "/Summer27/lessons", label: "Lessons" },
  { href: "/Summer27/juniors", label: "Juniors" },
  { href: "/Summer27/events", label: "Events" },
  { href: "/Summer27/stringing", label: "Stringing" },
  { href: "/Summer27/play", label: "Play", memberOnly: true, end: true },
  { href: "/Summer27/members", label: "Members", memberOnly: true, end: true },
];

/** Update when the club Instagram handle is live. */
export const S27_INSTAGRAM_URL = "https://www.instagram.com/difaziotennis";
export const S27_INSTAGRAM_HANDLE = "@difaziotennis";

export const COURTS = [
  { id: "court-1", name: "Court 3" },
  { id: "court-2", name: "Court 4" },
] as const;

export type CourtId = (typeof COURTS)[number]["id"];

export const BOOKING_HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM – 8 PM

export const COURT_RATES = {
  member: 50,
  guest: 60,
} as const;

export const LESSON_RATES = {
  member: 160,
  guest: 175,
} as const;

export const STRINGING_LABOR = 50;

export const PRIME_TEACHING = {
  weekdays: [1, 2, 3, 4, 5],
  courtId: "court-1" as CourtId,
  morning: { start: 8, end: 12 },
  afternoon: { start: 15, end: 17 },
};

export type ProWindow = { start: number; end: number };

export type ProDef = {
  id: string;
  name: string;
  title: string;
  bio: string;
  /** Longer copy for the pro bio page. */
  longBio?: string;
  quote?: string;
  focus: string;
  courtId: CourtId;
  days: number[];
  windows: ProWindow[];
  memberRate: number;
  guestRate: number;
  /** Optional headshot under /public. */
  image?: string;
  /**
   * `request` = members submit preferred times (no open calendar).
   * Default `schedule` uses teaching windows.
   */
  lessonMode?: "request" | "schedule";
};

export function lessonRateForPro(
  pro: { memberRate?: number; guestRate?: number } | null | undefined,
  isMember: boolean
): number {
  if (isMember) return Number(pro?.memberRate) || LESSON_RATES.member;
  return Number(pro?.guestRate) || LESSON_RATES.guest;
}

export const s27Pros: ProDef[] = [
  {
    id: "derek",
    name: "Derek DiFazio",
    title: "Director of Tennis",
    focus: "Advanced adults and juniors",
    bio: "Private instruction on Court 3. Advanced adults, college-bound juniors, and serious club players.",
    longBio:
      "A native New Yorker, Derek has over 15 years of coaching experience from the beginner to Division I and professional levels and loves working with players of all ages and abilities. A national doubles champion as both a junior and an adult, Derek was ranked as high as #1 in New York and the Eastern Section, before playing #1 singles and doubles at Division I Clemson University where he achieved a top 25 ITA ranking and an ATP singles ranking while competing professionally.",
    quote: "Movement is medicine. Play is essential.",
    image: "/derek-bio.png",
    courtId: "court-1",
    memberRate: 200,
    guestRate: 215,
    lessonMode: "request",
    days: [1, 2, 3, 4, 5],
    windows: [
      { start: 8, end: 12 },
      { start: 15, end: 17 },
    ],
  },
  {
    id: "maya-ellison",
    name: "Maya Ellison",
    title: "Teaching Professional",
    focus: "Recreational adults & doubles",
    bio: "Rally, doubles, and returning to the game.",
    longBio:
      "Maya works with recreational adults and doubles partners who want clearer patterns, better communication, and more enjoyable match play. Sessions emphasize live-ball feeding, court positioning, and the habits that make club doubles click.",
    quote: "Good doubles is a conversation.",
    courtId: "court-2",
    memberRate: 160,
    guestRate: 175,
    days: [1, 2, 3, 4],
    windows: [
      { start: 9, end: 12 },
      { start: 16, end: 19 },
    ],
  },
  {
    id: "jonah-berkowitz",
    name: "Jonah Berkowitz",
    title: "Junior Development Coach",
    focus: "Juniors & technique",
    bio: "Hudson Valley native. Clean mechanics, measurable progress, and junior development.",
    longBio:
      "Hudson Valley native with years of experience coaching players of all ages. Jonah went undefeated in match play at FDR High School and competed at Brown University. His coaching is technique-first — clear cues, repeatable strokes, and steady progress for juniors and adults who want cleaner mechanics.",
    quote: "Clean mechanics. Repeatable strokes.",
    courtId: "court-2",
    memberRate: 140,
    guestRate: 155,
    days: [2, 4, 6],
    windows: [
      { start: 9, end: 12 },
      { start: 15, end: 18 },
    ],
  },
];

export type ClinicKind = "adult" | "junior";

export type ClinicDef = {
  id: string;
  name: string;
  kind: ClinicKind;
  level: string;
  days: number[];
  startHour: number;
  durationHours: number;
  capacity: number;
  memberPrice: number;
  guestPrice: number;
  description: string;
  blockCourts: CourtId[];
};

export const s27Clinics: ClinicDef[] = [
  {
    id: "sat-sun-cardio",
    name: "Weekend Cardio & Drills",
    kind: "adult",
    level: "3.0–3.5 or by pro invitation",
    days: [0, 6],
    startHour: 8,
    durationHours: 1,
    capacity: 10,
    memberPrice: 50,
    guestPrice: 65,
    description: "Footwork, live-ball feeding, and cooperative drills.",
    blockCourts: ["court-1", "court-2"],
  },
  {
    id: "sat-sun-point-play",
    name: "Weekend Point Play",
    kind: "adult",
    level: "4.0+ or by pro invitation",
    days: [0, 6],
    startHour: 9,
    durationHours: 1.5,
    capacity: 10,
    memberPrice: 80,
    guestPrice: 100,
    description: "Match-tempo points, serve + 1 patterns, and competitive games.",
    blockCourts: ["court-1", "court-2"],
  },
  {
    id: "tue-thu-beginner",
    name: "Midweek Beginner Clinic",
    kind: "adult",
    level: "2.5–3.0 · new players welcome",
    days: [2, 4],
    startHour: 12,
    durationHours: 1,
    capacity: 10,
    memberPrice: 50,
    guestPrice: 65,
    description: "Rally, serve, and court positioning. New players welcome.",
    blockCourts: ["court-1", "court-2"],
  },
  {
    id: "mon-fri-beginner",
    name: "Weeknight Beginner Clinic",
    kind: "adult",
    level: "2.5–3.0 · new players welcome",
    days: [1, 5],
    startHour: 17,
    durationHours: 1,
    capacity: 10,
    memberPrice: 50,
    guestPrice: 65,
    description: "Rally fundamentals and easy live-ball games.",
    blockCourts: ["court-1", "court-2"],
  },
  {
    id: "mon-fri-int-adv",
    name: "Weeknight Clinic",
    kind: "adult",
    level: "3.5+ or by pro invitation",
    days: [1, 5],
    startHour: 18,
    durationHours: 1.5,
    capacity: 10,
    memberPrice: 80,
    guestPrice: 100,
    description: "Drills into competitive points. Rotating partners, doubles focus.",
    blockCourts: ["court-1", "court-2"],
  },
  {
    id: "sat-junior-fundamentals",
    name: "Saturday Junior Fundamentals",
    kind: "junior",
    level: "Ages 8–12 · developing players",
    days: [6],
    startHour: 11,
    durationHours: 1,
    capacity: 8,
    memberPrice: 50,
    guestPrice: 65,
    description: "Rally, serve, and the habits of good tennis.",
    blockCourts: ["court-2"],
  },
  {
    id: "wed-junior-afterschool",
    name: "Wednesday After-School Juniors",
    kind: "junior",
    level: "Ages 10–14 · developing players",
    days: [3],
    startHour: 16,
    durationHours: 1,
    capacity: 8,
    memberPrice: 50,
    guestPrice: 65,
    description: "After-school movement, consistency, and point play.",
    blockCourts: ["court-2"],
  },
];

export type EventDef = {
  id: string;
  title: string;
  date: string;
  timeLabel: string;
  category: string;
  capacity: number;
  memberPrice: number;
  guestPrice: number;
  description: string;
  highlights: string[];
  /** Unsplash (or similar) hero for event cards / detail. */
  image: string;
  /** Soft wash used behind cards and detail chrome. */
  theme: {
    wash: string;
    soft: string;
    accent: string;
  };
};

export const s27Events: EventDef[] = [
  {
    id: "mixed-rr-may",
    title: "Opening Mixed Doubles Round Robin",
    date: "2027-05-15",
    timeLabel: "Saturday · 4:00–6:30 PM",
    category: "Tennis Social",
    capacity: 16,
    memberPrice: 45,
    guestPrice: 60,
    description:
      "Rotating mixed doubles on Courts 3 & 4. Partner optional — we’ll pair you. Water and a quick gathering in the clubhouse after.",
    highlights: ["Rotating partners", "Both courts", "Clubhouse after"],
    image: "/s27/events/opening-mixed.jpg",
    theme: { wash: "#2f4a3a", soft: "#eef2ea", accent: "#4a6b52" },
  },
  {
    id: "ladies-morning-rr",
    title: "Ladies Morning Round Robin",
    date: "2027-06-10",
    timeLabel: "Thursday · 9:00–11:00 AM",
    category: "Ladies Play",
    capacity: 12,
    memberPrice: 40,
    guestPrice: 55,
    description: "Ladies doubles on both courts, then coffee in the clubhouse. Members and guests welcome.",
    highlights: ["Doubles only", "Coffee in the clubhouse", "Members + guests"],
    image: "/s27/events/ladies-morning.jpg",
    theme: { wash: "#3d5a2c", soft: "#eef1ea", accent: "#5f734f" },
  },
  {
    id: "member-guest-mixer",
    title: "Member–Guest Twilight Mixer",
    date: "2027-07-10",
    timeLabel: "Saturday · 5:00–8:00 PM",
    category: "Member–Guest",
    capacity: 16,
    memberPrice: 55,
    guestPrice: 70,
    description: "Bring a guest for doubles on Courts 3 & 4, then a toast in the clubhouse.",
    highlights: ["One guest with each member", "Round-robin draw", "Clubhouse toast"],
    image: "/s27/events/member-guest.jpg",
    theme: { wash: "#3d4a38", soft: "#f0f2ec", accent: "#5a6b4a" },
  },
  {
    id: "family-play-afternoon",
    title: "Family Play Afternoon",
    date: "2027-07-25",
    timeLabel: "Sunday · 11:00 AM–1:00 PM",
    category: "Family",
    capacity: 16,
    memberPrice: 30,
    guestPrice: 40,
    description: "Parent–child games and easy round robins across both courts. Casual and welcoming.",
    highlights: ["Parent–child games", "Both courts", "All ages welcome"],
    image: "/s27/events/family-play.jpg",
    theme: { wash: "#35503a", soft: "#eef3ea", accent: "#4f7358" },
  },
  {
    id: "mixed-rr-august",
    title: "August Mixed Doubles Round Robin",
    date: "2027-08-14",
    timeLabel: "Saturday · 4:00–6:30 PM",
    category: "Tennis Social",
    capacity: 16,
    memberPrice: 45,
    guestPrice: 60,
    description: "Mid-summer mixed doubles with rotating partners on Courts 3 & 4. Courtside water and fruit.",
    highlights: ["Rotating mixed doubles", "Both courts", "Water & fruit"],
    image: "/s27/events/august-mixed.jpg",
    theme: { wash: "#2f4a3a", soft: "#eef2ea", accent: "#4a6b52" },
  },
  {
    id: "season-close-social",
    title: "Season Close Club Social",
    date: "2027-09-11",
    timeLabel: "Saturday · 5:00–8:00 PM",
    category: "Social",
    capacity: 20,
    memberPrice: 55,
    guestPrice: 75,
    description:
      "Optional mixed play on both courts, then a simple season-end gathering in the clubhouse — not a banquet, just the club.",
    highlights: ["Optional tennis block", "Clubhouse gathering", "Season toast"],
    image: "/s27/events/season-close.jpg",
    theme: { wash: "#3a4634", soft: "#f1f3ec", accent: "#5c6e4d" },
  },
];

export const STRING_OPTIONS = [
  { id: "synthetic", name: "Synthetic gut", extra: 18 },
  { id: "multifilament", name: "Multifilament", extra: 28 },
  { id: "poly", name: "Polyester", extra: 32 },
  { id: "hybrid", name: "Hybrid (poly + multi)", extra: 34 },
  { id: "hybrid-gut", name: "Hybrid (poly + natural)", extra: 50 },
  { id: "gut", name: "Natural gut", extra: 65 },
  { id: "own", name: "Own string", extra: 0 },
];

export function formatHour(hour: number): string {
  const totalMinutes = Math.round(hour * 60);
  const h24 = Math.floor((((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60)) / 60);
  const minutes = Math.round(hour * 60) % 60;
  const h12 = h24 > 12 ? h24 - 12 : h24 === 0 ? 12 : h24;
  return `${h12}:${String(minutes).padStart(2, "0")} ${h24 >= 12 ? "PM" : "AM"}`;
}

export function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatPrettyDate(value: string): string {
  return parseDateInput(value).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function clinicDayLabel(days: number[] | undefined | null): string {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  if (!Array.isArray(days) || days.length === 0) return "TBA";
  return days.map((d) => names[d] || "").filter(Boolean).join(" / ");
}

export function clinicTimeLabel(clinic: Pick<ClinicDef, "startHour" | "durationHours">): string {
  const start = Number(clinic.startHour) || 0;
  const duration = Number(clinic.durationHours) || 1;
  return `${formatHour(start)}–${formatHour(start + duration)}`;
}

export function proHoursOnDate(pro: ProDef, dateStr: string): number[] {
  const day = parseDateInput(dateStr).getDay();
  if (!Array.isArray(pro.days) || !pro.days.includes(day)) return [];
  const hours: number[] = [];
  for (const window of pro.windows || []) {
    const start = Number(window.start);
    const end = Number(window.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
    for (let h = start; h < end; h += 1) hours.push(h);
  }
  return hours;
}

export function proScheduleLabel(pro: ProDef): string {
  if (pro.lessonMode === "request") return "By request";
  const times = (pro.windows || [])
    .map((w) => `${formatHour(Number(w.start) || 0)}–${formatHour(Number(w.end) || 0)}`)
    .join(" & ");
  return `${clinicDayLabel(pro.days)}${times ? ` · ${times}` : ""}`;
}

export function lessonProLabel(booking: { proName?: string }) {
  return booking.proName || "Derek DiFazio";
}

export function proUsesLessonRequests(pro: Pick<ProDef, "lessonMode"> | null | undefined) {
  return pro?.lessonMode === "request";
}

export type SlotBlockReason =
  | { type: "clinic"; label: string; clinicId: string; kind: ClinicKind }
  | { type: "lesson"; label: string }
  | { type: "event"; label: string }
  | { type: "hold"; label: string }
  | { type: "booked"; label: string };

export function hoursOverlap(startA: number, durA: number, hour: number): boolean {
  return hour >= startA && hour < startA + durA;
}

