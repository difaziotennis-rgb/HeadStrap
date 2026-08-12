import {
  COURT_RATES,
  LESSON_RATES,
  PRIME_TEACHING,
  STRINGING_LABOR,
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

export const S27_CATALOG_KEY = "s27_catalog_v6";
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
};

export type S27MemberNote = {
  memberNumber: string;
  note: string;
  updatedAt: string;
};

export type S27Catalog = {
  clinics: ClinicDef[];
  events: EventDef[];
  pros: ProDef[];
  courtRates: { member: number; guest: number };
  lessonRates: { member: number; guest: number };
  stringingLabor: number;
  primeTeaching: {
    morning: { start: number; end: number };
    afternoon: { start: number; end: number };
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
      morning: { ...PRIME_TEACHING.morning },
      afternoon: { ...PRIME_TEACHING.afternoon },
    },
  };
}

function usableClinics(clinics: unknown, fallback: ClinicDef[]): ClinicDef[] {
  if (!Array.isArray(clinics) || clinics.length === 0) return fallback;
  const ok = clinics.filter(
    (c): c is ClinicDef =>
      !!c &&
      typeof c === "object" &&
      typeof (c as ClinicDef).id === "string" &&
      typeof (c as ClinicDef).name === "string" &&
      Array.isArray((c as ClinicDef).days)
  );
  return ok.length ? ok : fallback;
}

function usableEvents(events: unknown, fallback: EventDef[]): EventDef[] {
  if (!Array.isArray(events) || events.length === 0) return fallback;
  const ok = events.filter(
    (e): e is EventDef => !!e && typeof e === "object" && typeof (e as EventDef).id === "string"
  );
  return ok.length ? ok : fallback;
}

function usablePros(pros: unknown, fallback: ProDef[]): ProDef[] {
  if (!Array.isArray(pros) || pros.length === 0) return fallback;
  const ok = pros.filter(
    (p): p is ProDef =>
      !!p &&
      typeof p === "object" &&
      typeof (p as ProDef).id === "string" &&
      typeof (p as ProDef).name === "string" &&
      Array.isArray((p as ProDef).days) &&
      Array.isArray((p as ProDef).windows)
  );
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
    primeTeaching: saved.primeTeaching || defaults.primeTeaching,
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

  for (const clinic of catalog.clinics) {
    if (!clinic.days.includes(day)) continue;
    if (
      clinic.blockCourts.includes(courtId) &&
      hoursOverlap(clinic.startHour, clinic.durationHours, hour)
    ) {
      return { type: "clinic", label: clinic.name };
    }
  }

  for (const event of catalog.events.filter((e) => e.date === dateStr)) {
    const match = event.timeLabel.match(
      /(\d{1,2}):(\d{2})\s*(AM|PM).*?(\d{1,2}):(\d{2})\s*(AM|PM)/i
    );
    let start = 16;
    let duration = 3;
    if (match) {
      const toHour = (h: string, m: string, p: string) => {
        let hr = Number(h) % 12;
        if (p.toUpperCase() === "PM") hr += 12;
        return hr + Number(m) / 60;
      };
      start = toHour(match[1], match[2], match[3]);
      duration = Math.max(1, toHour(match[4], match[5], match[6]) - start);
    }
    if (hoursOverlap(start, duration, hour)) {
      return { type: "event", label: event.title };
    }
  }

  for (const block of getAdminBlocks()) {
    if (block.date !== dateStr) continue;
    if (block.courtId !== "both" && block.courtId !== courtId) continue;
    if (hoursOverlap(block.startHour, block.durationHours, hour)) {
      return { type: "hold", label: block.reason || "Director hold" };
    }
  }

  if (PRIME_TEACHING.weekdays.includes(day) && courtId === PRIME_TEACHING.courtId) {
    const { morning, afternoon } = catalog.primeTeaching;
    if (hour >= morning.start && hour < morning.end) {
      return { type: "lesson", label: "Private lesson hold" };
    }
    if (hour >= afternoon.start && hour < afternoon.end) {
      return { type: "lesson", label: "Private lesson hold" };
    }
  }

  return null;
}
