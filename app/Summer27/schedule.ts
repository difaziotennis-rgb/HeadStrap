import {
  COURT_RATES,
  LESSON_RATES,
  PRIME_TEACHING,
  STRINGING_LABOR,
  clinicsSuspendedOnDate,
  eventSpansDate,
  hoursOverlap,
  parseDateInput,
  s27Clinics,
  s27Events,
  s27Pros,
  type ClinicDef,
  type CourtId,
  type EventDef,
  type ProDef,
  type SlotBlockReason,
} from "./summer27-data";

export const S27_CATALOG_KEY = "s27_catalog_v31";
export const S27_BLOCKS_KEY = "s27_admin_blocks_v1";
export const S27_NOTES_KEY = "s27_member_notes_v1";

export type S27AdminBlock = {
  id: string;
  date: string;
  courtId: CourtId | "both";
  startHour: number;
  durationHours: number;
  reason: string;
  createdAt: string;
  /** `hold` blocks booking; `open` releases a recurring lesson hold for that window. */
  kind?: "hold" | "open";
};

export type S27MemberNote = {
  memberNumber: string;
  note: string;
  updatedAt: string;
};

export type TeachingWindow = {
  start: number;
  end: number;
  label: string;
};

export type S27Catalog = {
  clinics: ClinicDef[];
  events: EventDef[];
  pros: ProDef[];
  courtRates: { member: number; guest: number };
  lessonRates: { member: number; guest: number };
  stringingLabor: number;
  primeTeaching: {
    windows: TeachingWindow[];
  };
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function defaultCatalog(): S27Catalog {
  return {
    clinics: s27Clinics,
    events: s27Events,
    pros: s27Pros,
    courtRates: { ...COURT_RATES },
    lessonRates: { ...LESSON_RATES },
    stringingLabor: STRINGING_LABOR,
    primeTeaching: {
      windows: [
        { start: PRIME_TEACHING.morning.start, end: PRIME_TEACHING.morning.end, label: "Morning lessons" },
        { start: PRIME_TEACHING.afternoon.start, end: PRIME_TEACHING.afternoon.end, label: "Afternoon lessons" },
      ],
    },
  };
}

export function normalizePrimeTeaching(raw: unknown): S27Catalog["primeTeaching"] {
  const defaults = defaultCatalog().primeTeaching;
  if (!raw || typeof raw !== "object") return defaults;
  const r = raw as {
    windows?: TeachingWindow[];
    morning?: { start: number; end: number };
    afternoon?: { start: number; end: number };
  };
  if (Array.isArray(r.windows)) {
    const windows = r.windows
      .filter((w) => w && Number.isFinite(Number(w.start)) && Number.isFinite(Number(w.end)))
      .map((w) => ({
        start: Number(w.start),
        end: Number(w.end),
        label: String(w.label || "Hold").trim() || "Hold",
      }))
      .filter((w) => w.end > w.start);
    return { windows };
  }
  const windows: TeachingWindow[] = [];
  if (r.morning && Number(r.morning.end) > Number(r.morning.start)) {
    windows.push({ start: Number(r.morning.start), end: Number(r.morning.end), label: "Morning lessons" });
  }
  if (r.afternoon && Number(r.afternoon.end) > Number(r.afternoon.start)) {
    windows.push({
      start: Number(r.afternoon.start),
      end: Number(r.afternoon.end),
      label: "Afternoon lessons",
    });
  }
  return windows.length ? { windows } : defaults;
}

function usableClinics(clinics: unknown, fallback: ClinicDef[]): ClinicDef[] {
  if (!Array.isArray(clinics) || clinics.length === 0) return fallback;
  const fallbackIds = new Set(fallback.map((f) => f.id));
  const ok = clinics
    .filter(
      (c): c is ClinicDef =>
        !!c &&
        typeof c === "object" &&
        typeof (c as ClinicDef).id === "string" &&
        fallbackIds.has((c as ClinicDef).id) &&
        typeof (c as ClinicDef).name === "string" &&
        Array.isArray((c as ClinicDef).days)
    )
    .map((c) => {
      const base = fallback.find((f) => f.id === c.id);
      if (!base) return c;
      // Keep admin price/capacity edits; sync names and schedule from defaults.
      return {
        ...c,
        name: base.name,
        kind: base.kind,
        level: base.level,
        description: base.description,
        days: base.days,
        startHour: base.startHour,
        durationHours: base.durationHours,
        blockCourts: base.blockCourts,
        memberPrice: base.memberPrice,
        guestPrice: base.guestPrice,
        capacity: base.capacity,
      };
    });
  const ids = new Set(ok.map((c) => c.id));
  for (const clinic of fallback) {
    if (!ids.has(clinic.id)) ok.push(clinic);
  }
  return ok.length ? ok : fallback;
}

function eventImagePath(raw: string | undefined, fallback: string | undefined) {
  const value = (raw || fallback || "").trim();
  if (!value) return fallback || "";
  // Old paths under /summer27/* were swallowed by the lowercase Summer27 rewrite.
  if (value.startsWith("/summer27/")) return value.replace(/^\/summer27\//, "/s27/");
  return value;
}

function usableEvents(events: unknown, fallback: EventDef[]): EventDef[] {
  if (!Array.isArray(events) || events.length === 0) return fallback;
  const fallbackIds = new Set(fallback.map((f) => f.id));
  const ok = events
    .filter(
      (e): e is EventDef =>
        !!e &&
        typeof e === "object" &&
        typeof (e as EventDef).id === "string" &&
        fallbackIds.has((e as EventDef).id)
    )
    .map((e) => {
      const base = fallback.find((f) => f.id === e.id);
      return {
        ...base,
        ...e,
        image: eventImagePath(e.image, base?.image || fallback[0]?.image),
        theme: e.theme || base?.theme || fallback[0]?.theme,
        highlights: Array.isArray(e.highlights) && e.highlights.length ? e.highlights : base?.highlights || [],
      } as EventDef;
    });
  // Ensure new default events appear even if an older saved catalog omitted them.
  const ids = new Set(ok.map((e) => e.id));
  for (const event of fallback) {
    if (!ids.has(event.id)) ok.push(event);
  }
  return ok.length ? ok : fallback;
}

function usablePros(pros: unknown, fallback: ProDef[]): ProDef[] {
  if (!Array.isArray(pros) || pros.length === 0) return fallback;
  const ok = pros
    .filter(
      (p): p is ProDef =>
        !!p &&
        typeof p === "object" &&
        typeof (p as ProDef).id === "string" &&
        typeof (p as ProDef).name === "string" &&
        Array.isArray((p as ProDef).days) &&
        Array.isArray((p as ProDef).windows)
    )
    .map((p) => {
      const def = fallback.find((f) => f.id === p.id);
      return {
        ...def,
        ...p,
        memberRate: typeof p.memberRate === "number" ? p.memberRate : def?.memberRate ?? LESSON_RATES.member,
        guestRate: typeof p.guestRate === "number" ? p.guestRate : def?.guestRate ?? LESSON_RATES.guest,
        longBio: p.longBio || def?.longBio,
        quote: p.quote || def?.quote,
        image: p.image || def?.image,
        bio: p.bio || def?.bio || "",
        focus: p.focus || def?.focus || "",
        title: p.title || def?.title || "Teaching Professional",
        lessonMode: p.lessonMode || def?.lessonMode,
      } as ProDef;
    });
  // Ensure new default pros appear even if an older saved catalog omitted them.
  const ids = new Set(ok.map((p) => p.id));
  for (const pro of fallback) {
    if (!ids.has(pro.id)) ok.push(pro);
  }
  return ok.length ? ok : fallback;
}

export function getCatalog(): S27Catalog {
  const saved = readJson<Partial<S27Catalog> | null>(S27_CATALOG_KEY, null);
  const defaults = defaultCatalog();
  if (!saved) return defaults;
  return {
    clinics: usableClinics(saved.clinics, defaults.clinics),
    events: usableEvents(saved.events, defaults.events),
    pros: usablePros(saved.pros, defaults.pros),
    courtRates: saved.courtRates || defaults.courtRates,
    lessonRates: saved.lessonRates || defaults.lessonRates,
    stringingLabor: typeof saved.stringingLabor === "number" ? saved.stringingLabor : defaults.stringingLabor,
    primeTeaching: normalizePrimeTeaching(saved.primeTeaching),
  };
}

export function saveCatalog(catalog: S27Catalog) {
  if (typeof window === "undefined") return;
  localStorage.setItem(S27_CATALOG_KEY, JSON.stringify(catalog));
}

export function getLiveClinics(): ClinicDef[] {
  try {
    const clinics = getCatalog().clinics;
    return Array.isArray(clinics) && clinics.length ? clinics : s27Clinics;
  } catch {
    return s27Clinics;
  }
}

export function getLiveEvents(): EventDef[] {
  try {
    const events = getCatalog().events;
    return Array.isArray(events) && events.length ? events : s27Events;
  } catch {
    return s27Events;
  }
}

export function getLivePros(): ProDef[] {
  try {
    const pros = getCatalog().pros;
    return Array.isArray(pros) && pros.length ? pros : s27Pros;
  } catch {
    return s27Pros;
  }
}

export function getLiveCourtRates() {
  return getCatalog().courtRates;
}

export function getLiveLessonRates() {
  return getCatalog().lessonRates;
}

export function getLiveStringingLabor() {
  return getCatalog().stringingLabor;
}

export function getAdminBlocks(): S27AdminBlock[] {
  return readJson<S27AdminBlock[]>(S27_BLOCKS_KEY, []);
}

export function saveAdminBlocks(blocks: S27AdminBlock[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(S27_BLOCKS_KEY, JSON.stringify(blocks));
}

export function getMemberNotes(): S27MemberNote[] {
  return readJson<S27MemberNote[]>(S27_NOTES_KEY, []);
}

export function saveMemberNotes(notes: S27MemberNote[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(S27_NOTES_KEY, JSON.stringify(notes));
}

export function getProgramBlock(
  dateStr: string,
  courtId: CourtId,
  hour: number
): SlotBlockReason | null {
  const catalog = getCatalog();
  const day = parseDateInput(dateStr).getDay();
  const clinicsOff = clinicsSuspendedOnDate(dateStr, catalog.events);

  if (!clinicsOff) {
    for (const clinic of catalog.clinics) {
      if (!clinic.days.includes(day)) continue;
      if (
        clinic.blockCourts.includes(courtId) &&
        hoursOverlap(clinic.startHour, clinic.durationHours, hour)
      ) {
        return { type: "clinic", label: clinic.name, clinicId: clinic.id, kind: clinic.kind };
      }
    }
  }

  for (const event of catalog.events.filter((e) => eventSpansDate(e, dateStr))) {
    let start = 16;
    let duration = 3;
    if (event.suspendClinics || event.endDate) {
      // Multi-day / championship weekends reserve daytime court hours.
      start = 8;
      duration = 10;
    } else {
      const match = event.timeLabel.match(
        /(\d{1,2}):(\d{2})\s*(AM|PM).*?(\d{1,2}):(\d{2})\s*(AM|PM)/i
      );
      if (match) {
        const toHour = (h: string, m: string, p: string) => {
          let hr = Number(h) % 12;
          if (p.toUpperCase() === "PM") hr += 12;
          return hr + Number(m) / 60;
        };
        start = toHour(match[1], match[2], match[3]);
        duration = Math.max(1, toHour(match[4], match[5], match[6]) - start);
      }
    }
    if (hoursOverlap(start, duration, hour)) {
      return { type: "event", label: event.title };
    }
  }

  const matchingBlocks = getAdminBlocks().filter((block) => {
    if (block.date !== dateStr) return false;
    if (block.courtId !== "both" && block.courtId !== courtId) return false;
    return hoursOverlap(block.startHour, block.durationHours, hour);
  });
  if (matchingBlocks.some((b) => b.kind === "open")) {
    // Explicitly release this slot (e.g. open Court 3 during a recurring lesson hold).
    return null;
  }
  const hold = matchingBlocks.find((b) => b.kind !== "open");
  if (hold) {
    return { type: "hold", label: hold.reason || "Reserved" };
  }

  if (PRIME_TEACHING.weekdays.includes(day) && courtId === PRIME_TEACHING.courtId) {
    for (const window of catalog.primeTeaching.windows) {
      if (hour >= window.start && hour < window.end) {
        return { type: "lesson", label: window.label || "Private lesson" };
      }
    }
  }

  return null;
}
