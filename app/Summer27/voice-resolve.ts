import {
  BOOKING_HOURS,
  COURTS,
  COURT_RATES,
  STRING_OPTIONS,
  STRINGING_LABOR,
  clinicTimeLabel,
  clinicsSuspendedOnDate,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  lessonRateForPro,
  parseDateInput,
  proHoursOnDate,
  proScheduleLabel,
  proUsesLessonRequests,
  type ClinicDef,
  type CourtId,
  type ProDef,
} from "./summer27-data";
import { getLiveClinics, getLiveCourtRates, getLiveEvents, getLivePros, getLiveStringingLabor, getProgramBlock } from "./schedule";
import { canChangeBooking, CANCEL_WINDOW_HOURS } from "./booking-policy";
import {
  KEYS,
  courtBookingKey,
  lfgCapacity,
  loadList,
  loadRecord,
  memberOnCourt,
  persistCourts,
  saveList,
  stringingShopStatus,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27LfgPost,
  type S27StringingOrder,
} from "./storage";
import type { S27MemberSession } from "./member-session";
import { parseHour } from "./voice-intent";
import type { VoiceIntent } from "./voice-intent";

export type VoiceLink = { href: string; label: string };

export type VoiceCancel = {
  kind: "court" | "clinic" | "lesson" | "event";
  id: string;
  label: string;
};

export type VoiceResult = {
  spoken: string;
  detail: string;
  links: VoiceLink[];
  cancel?: VoiceCancel;
};

function hoursFor(intent: VoiceIntent): number[] {
  if (typeof intent.hour === "number" && BOOKING_HOURS.includes(intent.hour)) return [intent.hour];
  if (intent.timeOfDay === "morning") return BOOKING_HOURS.filter((h) => h < 12);
  if (intent.timeOfDay === "afternoon") return BOOKING_HOURS.filter((h) => h >= 12 && h < 17);
  if (intent.timeOfDay === "evening") return BOOKING_HOURS.filter((h) => h >= 17);
  return BOOKING_HOURS;
}

function courtsFor(intent: VoiceIntent) {
  if (intent.courtId) return COURTS.filter((c) => c.id === intent.courtId);
  return [...COURTS];
}

function courtOpen(date: string, courtId: CourtId, hour: number, bookings: Record<string, S27CourtBooking>) {
  if (!BOOKING_HOURS.includes(hour)) return false;
  if (getProgramBlock(date, courtId, hour)) return false;
  const existing = bookings[courtBookingKey(date, courtId, hour)];
  return existing?.paymentStatus !== "paid";
}

function clinicHintMatch(clinic: ClinicDef, hint: string | null) {
  if (!hint) return true;
  const h = hint.toLowerCase();
  const blob = `${clinic.name} ${clinic.level} ${clinic.id} ${clinic.kind}`.toLowerCase();
  const keys = [
    "101",
    "cardio",
    "point play",
    "ladies",
    "juniors",
    "junior",
    "high performance",
    "weeknight",
    "beginner",
    "high school",
    "tots",
  ];
  const hits = keys.filter((k) => h.includes(k));
  if (h.includes("junior") || h.includes("juniors")) return clinic.kind === "junior";
  if (hits.length === 0) return true;
  return hits.some((k) => blob.includes(k));
}

function nextClinicDates(clinic: ClinicDef, from: Date, count = 2): string[] {
  const events = getLiveEvents();
  const out: string[] = [];
  for (let i = 0; i < 21 && out.length < count; i++) {
    const d = new Date(from);
    d.setHours(0, 0, 0, 0);
    d.setDate(from.getDate() + i);
    if (!clinic.days.includes(d.getDay())) continue;
    const iso = formatDateInput(d);
    if (clinicsSuspendedOnDate(iso, events)) continue;
    out.push(iso);
  }
  return out;
}

function firstName(pro: ProDef) {
  return (pro.name.split(" ")[0] || pro.name).trim();
}

function namedPros(pros: ProDef[], hint: string | null): ProDef[] {
  if (!hint) return [];
  const h = hint.toLowerCase();
  return pros.filter((p) => {
    const first = firstName(p).toLowerCase();
    const last = p.name.split(" ").slice(1).join(" ").toLowerCase();
    return h === p.id || h.includes(p.id) || h.includes(first) || (last.length > 2 && h.includes(last));
  });
}

function proTeaches(pro: ProDef, date: string | null, hour: number | null) {
  if (proUsesLessonRequests(pro)) return false;
  if (!date) return true;
  const hours = proHoursOnDate(pro, date);
  if (!hours.length) return false;
  if (hour == null) return true;
  return hours.includes(Math.floor(hour));
}

function lessonLinks(pros: ProDef[], date: string, hour: number | null) {
  return pros.map((p) => {
    const qs = new URLSearchParams({ pro: p.id, date });
    if (hour != null) qs.set("hour", String(Math.floor(hour)));
    const request = proUsesLessonRequests(p);
    return {
      href: `/Summer27/lessons?${qs.toString()}`,
      label: request ? `Request ${firstName(p)}` : `Book ${firstName(p)}`,
    };
  });
}

function needSignIn(spoken: string): VoiceResult {
  return {
    spoken,
    detail: spoken,
    links: [{ href: "/Summer27/member", label: "Sign in / Join" }],
  };
}

function mineFilter(session: S27MemberSession | null) {
  return {
    court: (b: S27CourtBooking) => !!session && memberOnCourt(b, session.memberNumber, session.memberEmail),
    clinic: (b: S27ClinicBooking) =>
      !!session && (b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail),
    lesson: (b: S27LessonBooking) =>
      !!session &&
      b.requestStatus !== "declined" &&
      (b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail),
    event: (b: S27EventBooking) =>
      !!session && (b.memberNumber === session.memberNumber || b.attendeeEmail === session.memberEmail),
    string: (b: S27StringingOrder) =>
      !!session && (b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail),
  };
}

export function applyVoiceCancel(cancel: VoiceCancel): VoiceResult {
  if (cancel.kind === "court") {
    persistCourts(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)).filter((b) => b.id !== cancel.id));
  } else if (cancel.kind === "clinic") {
    saveList(KEYS.clinics, loadList<S27ClinicBooking>(KEYS.clinics).filter((b) => b.id !== cancel.id));
  } else if (cancel.kind === "lesson") {
    saveList(KEYS.lessons, loadList<S27LessonBooking>(KEYS.lessons).filter((b) => b.id !== cancel.id));
  } else {
    saveList(KEYS.events, loadList<S27EventBooking>(KEYS.events).filter((b) => b.id !== cancel.id));
  }
  const spoken = `Cancelled ${cancel.label}.`;
  return {
    spoken,
    detail: `${spoken} Refunds follow the 24-hour policy when a card charge exists.`,
    links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
  };
}

function eventMatch(hint: string | null) {
  const events = getLiveEvents();
  if (!hint) return events;
  const h = hint.toLowerCase();
  const scored = events.filter((e) => {
    const blob = `${e.title} ${e.category} ${e.id}`.toLowerCase();
    return (
      (blob.includes("105") && h.includes("105")) ||
      (blob.includes("championship") && /champ/.test(h)) ||
      (blob.includes("wimbledon") && /wimbledon/.test(h)) ||
      (blob.includes("family") && /family/.test(h)) ||
      (blob.includes("mixed") && /mixed/.test(h)) ||
      (blob.includes("season") && /season|close/.test(h)) ||
      e.title.toLowerCase().includes(h.slice(0, 18))
    );
  });
  return scored.length ? scored : events;
}

export function resolveVoice(intent: VoiceIntent, session: S27MemberSession | null): VoiceResult {
  const now = new Date();
  const bookings = loadRecord<S27CourtBooking>(KEYS.courts);
  const clinicBookings = loadList<S27ClinicBooking>(KEYS.clinics);
  const lessons = loadList<S27LessonBooking>(KEYS.lessons);
  const eventBookings = loadList<S27EventBooking>(KEYS.events);
  const stringing = loadList<S27StringingOrder>(KEYS.stringing);
  const lfg = loadList<S27LfgPost>(KEYS.lfg);
  const clinics = getLiveClinics();
  const mine = mineFilter(session);
  const today = formatDateInput(now);

  if (intent.intent === "prices") {
    const court = getLiveCourtRates();
    const labor = getLiveStringingLabor();
    const topic = intent.priceTopic || "all";
    const lines: string[] = [];
    if (topic === "all" || topic === "court") {
      lines.push(`Courts $${court.member || COURT_RATES.member}/hour members · $${court.guest || COURT_RATES.guest} guests.`);
    }
    if (topic === "all" || topic === "clinic") {
      lines.push("Clinics $35 half hour · $55 one hour · $80 for 90 minutes (members). Guests a bit more.");
    }
    if (topic === "all" || topic === "lesson") {
      const pros = getLivePros();
      const bits = pros.map((p) => `${p.name.split(" ")[0]} $${lessonRateForPro(p, true)}`);
      lines.push(`Lessons ${bits.join(" · ")} members. Guests a bit more. Derek is by request; Maya and Jonah have open calendars.`);
    }
    if (topic === "all" || topic === "stringing") {
      lines.push(`Stringing $${labor || STRINGING_LABOR} labor plus string (poly +$${STRING_OPTIONS.find((s) => s.id === "poly")?.extra || 32}).`);
    }
    if (topic === "all" || topic === "event") {
      lines.push("Events are usually $45–$55 members, 10 players max.");
    }
    return {
      spoken: lines[0],
      detail: lines.join("\n"),
      links: [
        { href: "/Summer27/book", label: "Courts" },
        { href: "/Summer27/clinics", label: "Clinics" },
        { href: "/Summer27/lessons", label: "Lessons" },
      ],
    };
  }

  if (intent.intent === "my_day") {
    if (!session) return needSignIn("Sign in and I can read your bookings.");
    const from = intent.date || today;
    const to = intent.dateTo || intent.date || today;
    const items: string[] = [];
    for (const b of uniqueCourts(bookings)) {
      if (!mine.court(b) || b.paymentStatus !== "paid") continue;
      if (b.date < from || b.date > to) continue;
      items.push(`${formatPrettyDate(b.date)} · ${b.courtName} ${formatHour(b.hour)}`);
    }
    for (const b of clinicBookings) {
      if (!mine.clinic(b) || b.paymentStatus !== "paid") continue;
      if (b.date < from || b.date > to) continue;
      items.push(`${formatPrettyDate(b.date)} · ${b.clinicName}${b.clientName ? ` (${b.clientName})` : ""}`);
    }
    for (const b of lessons) {
      if (!mine.lesson(b)) continue;
      if (b.date < from || b.date > to) continue;
      const st = b.requestStatus === "requested" ? " (awaiting Derek)" : "";
      items.push(`${formatPrettyDate(b.date)} · Lesson ${formatHour(b.hour)}${st}`);
    }
    for (const b of eventBookings) {
      if (!mine.event(b) || b.paymentStatus !== "paid") continue;
      if (b.eventDate < from || b.eventDate > to) continue;
      items.push(`${formatPrettyDate(b.eventDate)} · ${b.eventTitle}`);
    }
    if (items.length === 0) {
      return {
        spoken: `Nothing on your book ${from === to ? formatPrettyDate(from) : "for that stretch"}.`,
        detail: "No upcoming bookings in that window.",
        links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
      };
    }
    return {
      spoken: `You have ${items.length} thing${items.length === 1 ? "" : "s"}: ${items[0]}.`,
      detail: items.join("\n"),
      links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
    };
  }

  if (intent.intent === "cancel" || intent.intent === "move") {
    if (!session) return needSignIn("Sign in to change a booking.");
    const date = intent.date || today;
    const hour = intent.hour;
    const courtsMine = uniqueCourts(bookings).filter((b) => {
      if (!mine.court(b) || b.paymentStatus !== "paid") return false;
      if (b.date !== date) return false;
      if (hour != null && b.hour !== hour) return false;
      return true;
    });
    const clinicsMine = clinicBookings.filter((b) => {
      if (!mine.clinic(b) || b.paymentStatus !== "paid") return false;
      if (b.date !== date) return false;
      if (intent.childName && b.clientName.toLowerCase() !== intent.childName.toLowerCase()) return false;
      if (hour != null) {
        const def = clinics.find((c) => c.id === b.clinicId);
        if (!def || Math.abs(def.startHour - hour) >= 0.26) return false;
      }
      return true;
    });
    const lessonsMine = lessons.filter((b) => {
      if (!mine.lesson(b)) return false;
      if (b.date !== date) return false;
      if (hour != null && b.hour !== hour) return false;
      return true;
    });
    const clinicHour = (row: S27ClinicBooking) => clinics.find((c) => c.id === row.clinicId)?.startHour ?? 8;
    const target = courtsMine[0]
      ? { kind: "court" as const, id: courtsMine[0].id, label: `${courtsMine[0].courtName} ${formatHour(courtsMine[0].hour)}`, hour: courtsMine[0].hour, date: courtsMine[0].date }
      : clinicsMine[0]
        ? {
            kind: "clinic" as const,
            id: clinicsMine[0].id,
            label: clinicsMine[0].clinicName,
            hour: clinicHour(clinicsMine[0]),
            date: clinicsMine[0].date,
          }
        : lessonsMine[0]
          ? { kind: "lesson" as const, id: lessonsMine[0].id, label: `Lesson ${formatHour(lessonsMine[0].hour)}`, hour: lessonsMine[0].hour, date: lessonsMine[0].date }
          : null;
    if (!target) {
      return {
        spoken: `I don’t see a booking of yours on ${formatPrettyDate(date)}${hour != null ? ` at ${formatHour(hour)}` : ""}.`,
        detail: "Nothing matched. You can cancel from My Account.",
        links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
      };
    }
    if (intent.intent === "move") {
      const newHour = intent.hourTo;
      const newDate = intent.dateTo || date;
      if (target.kind === "court" && typeof newHour === "number") {
        const open = courtsFor(intent).filter((c) => courtOpen(newDate, c.id, newHour, bookings));
        if (!open.length) {
          return {
            spoken: `${formatHour(newHour)} on ${formatPrettyDate(newDate)} isn’t open.`,
            detail: `Your current booking: ${target.label}. That new time is taken or held.`,
            links: [{ href: `/Summer27/book?date=${newDate}`, label: "Court grid" }],
          };
        }
        const c = open[0];
        return {
          spoken: `I can move you to ${c.name} at ${formatHour(newHour)}. Confirm the new slot, then cancel the old one if you want.`,
          detail: `Now: ${target.label}. Suggested: ${c.name} ${formatHour(newHour)} on ${formatPrettyDate(newDate)}.`,
          links: [
            { href: `/Summer27/book?date=${newDate}&hour=${newHour}&court=${c.id}`, label: `Book ${c.name} ${formatHour(newHour)}` },
            { href: "/Summer27/member/portal?tab=bookings", label: "Cancel the old time" },
          ],
        };
      }
      return {
        spoken: "I can open your bookings so you can move that session.",
        detail: `Found ${target.label}. Use My Account to change it, or pick a new court time.`,
        links: [
          { href: "/Summer27/member/portal?tab=bookings", label: "My bookings" },
          { href: `/Summer27/book?date=${newDate}`, label: "Court grid" },
        ],
      };
    }
    const locked = !canChangeBooking(target.date, target.hour);
    if (locked) {
      return {
        spoken: `That one’s inside the ${CANCEL_WINDOW_HOURS}-hour window, so it stays on the book.`,
        detail: `${target.label} is locked. Weather closes are still refunded.`,
        links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
      };
    }
    return {
      spoken: `I found ${target.label}. Confirm and I’ll cancel it.`,
      detail: `${target.label} on ${formatPrettyDate(target.date)}. Full refund if we’re outside ${CANCEL_WINDOW_HOURS} hours.`,
      links: [{ href: "/Summer27/member/portal?tab=bookings", label: "My bookings" }],
      cancel: { kind: target.kind, id: target.id, label: target.label },
    };
  }

  if (intent.intent === "check_court" || intent.intent === "book_court") {
    const date = intent.date || today;
    const hours = hoursFor(intent);
    const courts = courtsFor(intent);
    const open: { courtId: CourtId; name: string; hour: number }[] = [];
    for (const hour of hours) {
      for (const court of courts) {
        if (courtOpen(date, court.id, hour, bookings)) open.push({ courtId: court.id, name: court.name, hour });
      }
    }
    const pretty = formatPrettyDate(date);
    if (open.length === 0) {
      return {
        spoken: `Nothing open ${intent.hour != null ? `at ${formatHour(intent.hour)} ` : ""}on ${pretty}.`,
        detail: `No open court time ${intent.hour != null ? `at ${formatHour(intent.hour)} ` : ""}on ${pretty}.`,
        links: [{ href: `/Summer27/book?date=${date}`, label: "See the court grid" }],
      };
    }
    const first = open[0];
    const names = [...new Set(open.map((o) => `${o.name} ${formatHour(o.hour)}`))].slice(0, 6);
    return {
      spoken:
        intent.intent === "book_court"
          ? `${first.name} is open at ${formatHour(first.hour)} on ${pretty}. Confirm on the next screen.`
          : `Open on ${pretty}: ${names.join(", ")}.`,
      detail: names.join(" · "),
      links: [
        {
          href: `/Summer27/book?date=${date}&hour=${first.hour}&court=${first.courtId}`,
          label: intent.intent === "book_court" ? `Book ${first.name} ${formatHour(first.hour)}` : `Open ${first.name}`,
        },
        { href: `/Summer27/book?date=${date}`, label: "Full court grid" },
      ],
    };
  }

  if (intent.intent === "check_clinic" || intent.intent === "book_clinic") {
    const date = intent.date;
    const hour = intent.hour ?? (intent.clinicHint ? parseHour(intent.clinicHint) : null);
    let list = clinics.filter((c) => clinicHintMatch(c, intent.clinicHint));
    if (intent.childName) {
      const juniors = list.filter((c) => c.kind === "junior");
      list = juniors.length ? juniors : clinics.filter((c) => c.kind === "junior");
    }
    if (intent.timeOfDay === "morning") list = list.filter((c) => c.startHour < 12);
    if (intent.timeOfDay === "afternoon") list = list.filter((c) => c.startHour >= 12 && c.startHour < 17);
    if (intent.timeOfDay === "evening") list = list.filter((c) => c.startHour >= 17);
    if (date) {
      const day = parseDateInput(date).getDay();
      list = list.filter((c) => c.days.includes(day));
    }
    if (hour != null) {
      const exact = list.filter((c) => Math.abs(c.startHour - hour) < 0.26);
      const near = list.filter((c) => Math.abs(c.startHour - hour) < 1);
      list = exact.length ? exact : near;
    }

    const rows: { clinic: ClinicDef; date: string; open: number }[] = [];
    for (const clinic of list) {
      const dates = date ? [date] : nextClinicDates(clinic, now, 1);
      for (const d of dates) {
        if (!clinic.days.includes(parseDateInput(d).getDay())) continue;
        const taken = clinicBookings.filter(
          (b) => b.clinicId === clinic.id && b.date === d && b.paymentStatus === "paid"
        ).length;
        rows.push({ clinic, date: d, open: Math.max(0, clinic.capacity - taken) });
      }
    }
    rows.sort((a, b) => a.date.localeCompare(b.date) || a.clinic.startHour - b.clinic.startHour);
    if (hour != null) {
      rows.sort((a, b) => Math.abs(a.clinic.startHour - hour) - Math.abs(b.clinic.startHour - hour));
    }
    if (rows.length === 0) {
      return {
        spoken: hour != null && date
          ? `No clinic at ${formatHour(hour)} on ${formatPrettyDate(date)}.`
          : "I couldn’t match that clinic.",
        detail: "No matching clinic found.",
        links: [{ href: "/Summer27/clinics", label: "All clinics" }],
      };
    }
    const first = rows[0];
    const childQ = intent.childName ? `&child=${encodeURIComponent(intent.childName)}` : "";
    const book = intent.intent === "book_clinic";
    const lines = rows
      .slice(0, 4)
      .map((r) => `${r.clinic.name} · ${formatPrettyDate(r.date)} ${clinicTimeLabel(r.clinic)} · ${r.open} open`);
    const who = intent.childName ? ` for ${intent.childName}` : "";
    const joinLinks = rows.slice(0, 4).map((r) => ({
      href: `/Summer27/clinics?clinic=${encodeURIComponent(r.clinic.id)}&date=${r.date}${childQ}`,
      label:
        rows.length === 1
          ? intent.childName
            ? `Enroll ${intent.childName}`
            : book
              ? `Join ${formatHour(r.clinic.startHour)}`
              : `View ${formatHour(r.clinic.startHour)}`
          : `${book ? "Join" : "View"} ${formatHour(r.clinic.startHour)}`,
    }));
    return {
      spoken: `${first.clinic.name}${who} at ${formatHour(first.clinic.startHour)} on ${formatPrettyDate(first.date)} has ${first.open} ${
        first.open === 1 ? "spot" : "spots"
      } left.`,
      detail: lines.join("\n"),
      links: [...joinLinks, { href: "/Summer27/clinics", label: "All clinics" }],
    };
  }

  if (intent.intent === "check_lesson" || intent.intent === "request_lesson") {
    const date = intent.date || today;
    const hour = intent.hour;
    const all = getLivePros();
    const named = namedPros(all, intent.proHint);
    const juniorAsk = !!(intent.childName || /\bjunior/.test((intent.proHint || "").toLowerCase()));
    let picks = named;
    if (!picks.length && juniorAsk) {
      picks = all.filter((p) => /junior/.test(`${p.focus} ${p.title}`.toLowerCase()));
    }
    if (!picks.length) {
      const onCalendar = all.filter((p) => proTeaches(p, date, hour));
      picks = onCalendar.length ? onCalendar : all;
    }
    const lines = picks.map((p) => {
      const request = proUsesLessonRequests(p);
      const when = request ? "by request" : proScheduleLabel(p);
      return `${p.name} · $${lessonRateForPro(p, !!session)}/hr · ${when}`;
    });
    const pretty = formatPrettyDate(date);
    const timeBit = hour != null ? ` at ${formatHour(hour)}` : "";
    return {
      spoken:
        picks.length === 1
          ? `${firstName(picks[0])}${timeBit} on ${pretty}. Confirm on the next screen.`
          : `${picks.map((p) => firstName(p)).join(", ")} take lessons${timeBit ? timeBit : ""} on ${pretty}.`,
      detail: lines.join("\n"),
      links: [...lessonLinks(picks, date, hour), { href: "/Summer27/lessons", label: "All pros" }],
    };
  }

  if (intent.intent === "check_stringing" || intent.intent === "order_stringing") {
    if (intent.intent === "check_stringing") {
      if (!session) return needSignIn("Sign in to check a restring.");
      const mineOrders = stringing.filter((o) => mine.string(o) && o.paymentStatus === "paid" && stringingShopStatus(o) !== "picked_up");
      if (!mineOrders.length) {
        return {
          spoken: "I don’t see a racket in the shop for you.",
          detail: "No open stringing orders.",
          links: [{ href: "/Summer27/stringing", label: "Order a restring" }],
        };
      }
      const o = mineOrders[0];
      const st = stringingShopStatus(o);
      const spoken = st === "ready" ? "Your racket is ready for pickup." : "Your racket is still in the shop.";
      return {
        spoken,
        detail: `${o.racket || "Racket"} · ${o.stringName} · ${o.tension} · ${st === "ready" ? "Ready" : "In shop"}`,
        links: [{ href: "/Summer27/stringing", label: "Stringing" }],
      };
    }
    const params = new URLSearchParams();
    if (intent.stringHint) params.set("string", intent.stringHint);
    if (intent.tension) params.set("tension", intent.tension);
    const q = params.toString();
    return {
      spoken: `I’ll open stringing${intent.stringHint ? ` with ${intent.stringHint}` : ""}${intent.tension ? ` at ${intent.tension}` : ""}. Confirm there.`,
      detail: "Drop-off is at the pro shop after you confirm.",
      links: [{ href: `/Summer27/stringing${q ? `?${q}` : ""}`, label: "Stringing order" }],
    };
  }

  if (intent.intent === "check_event" || intent.intent === "book_event") {
    const matches = eventMatch(intent.eventHint);
    const e = matches[0];
    const taken = eventBookings
      .filter((b) => b.eventId === e.id && b.paymentStatus === "paid")
      .reduce((sum, b) => sum + (b.guestCount || 1), 0);
    const open = Math.max(0, e.capacity - taken);
    return {
      spoken: `${e.title} has ${open} ${open === 1 ? "spot" : "spots"} left. 10 max.`,
      detail: `${e.title} · ${formatPrettyDate(e.date)} · ${e.timeLabel} · ${open} open · $${e.memberPrice} members`,
      links: [{ href: `/Summer27/events/${e.id}`, label: intent.intent === "book_event" ? "Sign up" : "View event" }],
    };
  }

  if (intent.intent === "check_play") {
    if (!session) return needSignIn("Play is for members — sign in to see who’s looking.");
    const date = intent.date || today;
    const posts = lfg.filter((p) => p.status === "open" && p.date === date && (intent.hour == null || p.hour === intent.hour));
    if (!posts.length) {
      return {
        spoken: `Nobody posted for ${formatPrettyDate(date)} yet.`,
        detail: "You can post that you’re looking.",
        links: [{ href: "/Summer27/play", label: "Looking for a game" }],
      };
    }
    const lines = posts.map((p) => {
      const left = Math.max(0, lfgCapacity(p.format) - p.players.length);
      return `${formatHour(p.hour)} · ${p.format} · ${p.hostName} · ${left} spot${left === 1 ? "" : "s"}`;
    });
    return {
      spoken: `${posts.length} post${posts.length === 1 ? "" : "s"} on ${formatPrettyDate(date)}. ${lines[0]}.`,
      detail: lines.join("\n"),
      links: [{ href: "/Summer27/play", label: "Open Play" }],
    };
  }

  return {
    spoken: "Try court time, a clinic, your day, a lesson, stringing, or an event.",
    detail: "I can check openings, prices, your bookings, and send you to confirm.",
    links: [
      { href: "/Summer27/book", label: "Courts" },
      { href: "/Summer27/clinics", label: "Clinics" },
      { href: "/Summer27/member/portal?tab=bookings", label: "My bookings" },
    ],
  };
}
