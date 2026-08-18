import {
  COURT_RATES,
  STRINGING_LABOR,
  formatDateInput,
  lessonRateForPro,
  s27Clinics,
  s27Events,
  s27Pros,
  type CourtId,
} from "./summer27-data";
import { courtSlotConflict, getCatalog, getProgramBlock, saveCatalog } from "./schedule";
import { persistLessons } from "./pro-clients";
import {
  DEREK_MEMBER,
  KEYS,
  ensureDerekMember,
  loadList,
  loadRecord,
  persistCourts,
  rememberStringing,
  saveList,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27LfgPost,
  type S27MemberAccount,
  type S27PaymentProfile,
  type S27StringingOrder,
} from "./storage";

const MOCK_FLAG = "s27_mock_bookings_v9";

type Person = {
  name: string;
  email: string;
  phone: string;
  memberNumber?: string;
};

const MEMBERS: Person[] = [
  { memberNumber: "101", name: "Claire Bennett", email: "claire.bennett@example.com", phone: "845-555-0142" },
  { memberNumber: "102", name: "Owen Hart", email: "owen.hart@example.com", phone: "845-555-0198" },
  { memberNumber: "103", name: "Priya Shah", email: "priya.shah@example.com", phone: "845-555-0117" },
  { memberNumber: "104", name: "Miles Ortega", email: "miles.ortega@example.com", phone: "845-555-0164" },
  { memberNumber: "105", name: "Helen Cho", email: "helen.cho@example.com", phone: "845-555-0188" },
  { memberNumber: "106", name: "James Whitaker", email: "james.whitaker@example.com", phone: "845-555-0129" },
  { memberNumber: "107", name: "Sarah Lang", email: "sarah.lang@example.com", phone: "845-555-0173" },
  { memberNumber: "108", name: "Tom Brennan", email: "tom.brennan@example.com", phone: "845-555-0104" },
  { memberNumber: "109", name: "Nina Patel", email: "nina.patel@example.com", phone: "845-555-0156" },
  { memberNumber: "110", name: "Anna Cole", email: "anna.cole@example.com", phone: "845-555-0131" },
  { memberNumber: "111", name: "David Russo", email: "david.russo@example.com", phone: "845-555-0190" },
  { memberNumber: "112", name: "Lucy Hale", email: "lucy.hale@example.com", phone: "845-555-0122" },
  { memberNumber: "113", name: "Ben Calder", email: "ben.calder@example.com", phone: "845-555-0181" },
  { memberNumber: "114", name: "Marisol Vega", email: "marisol.vega@example.com", phone: "845-555-0149" },
];

const GUESTS: Person[] = [
  { name: "Kate Morelli", email: "kate.morelli@example.com", phone: "917-555-2201" },
  { name: "Jon Alvarez", email: "jon.alvarez@example.com", phone: "917-555-2288" },
  { name: "Rita Solano", email: "rita.solano@example.com", phone: "646-555-3310" },
  { name: "Paul Keene", email: "paul.keene@example.com", phone: "212-555-4472" },
];

const JUNIORS = [
  { name: "Emma Bennett", email: "claire.bennett@example.com", memberNumber: "101" },
  { name: "Leo Hart", email: "owen.hart@example.com", memberNumber: "102" },
  { name: "Maya Shah", email: "priya.shah@example.com", memberNumber: "103" },
  { name: "Theo Ortega", email: "miles.ortega@example.com", memberNumber: "104" },
  { name: "Willa Cho", email: "helen.cho@example.com", memberNumber: "105" },
  { name: "Sam Lang", email: "sarah.lang@example.com", memberNumber: "107" },
  { name: "Olivia Russo", email: "david.russo@example.com", memberNumber: "111" },
  { name: "Jack Calder", email: "ben.calder@example.com", memberNumber: "113" },
];

const FOCUS = ["Serve + 1", "Backhand depth", "Return of serve", "Volley patterns", "Footwork", "Match play", "Kick serve", "Doubles poach"];

function dayOffset(n: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  return d;
}

function nextDatesForDays(days: number[], count: number) {
  const dates: string[] = [];
  for (let i = 0; i < 60 && dates.length < count; i++) {
    const d = dayOffset(i);
    if (days.includes(d.getDay())) dates.push(formatDateInput(d));
  }
  return dates;
}

/** Past occurrences so admin week nav can refer back to prior signups. */
function pastDatesForDays(days: number[], count: number) {
  const dates: string[] = [];
  for (let i = 1; i < 60 && dates.length < count; i++) {
    const d = dayOffset(-i);
    if (days.includes(d.getDay())) dates.push(formatDateInput(d));
  }
  return dates;
}

function wrapIndex<T>(list: T[], i: number): T {
  const n = list.length;
  return list[((i % n) + n) % n];
}

function personAt(i: number): Person {
  return wrapIndex(MEMBERS, i);
}

function guestAt(i: number): Person {
  return wrapIndex(GUESTS, i);
}

function paid(_i: number): "paid" | "pending" {
  return "paid";
}

function method(_i: number): "stripe" | "saved-card" | "manual" | "paypal" | "venmo" {
  return "saved-card";
}

function keepReal<T extends { id: string }>(existing: T[], mock: T[]) {
  return [
    ...existing.filter((x) => x?.id && !x.id.startsWith("mock-") && !x.id.startsWith("seed-")),
    ...mock,
  ];
}

function seedMembers() {
  ensureDerekMember();
  const existing = loadList<S27MemberAccount>(KEYS.members);
  const byNumber = new Map(existing.map((m) => [m.memberNumber, m]));
  for (const [i, person] of MEMBERS.entries()) {
    if (!person.memberNumber) continue;
    const prev = byNumber.get(person.memberNumber);
    if (prev) {
      byNumber.set(person.memberNumber, {
        ...prev,
        directoryVisible: prev.directoryVisible ?? i % 5 !== 0,
        preferredContact: prev.preferredContact ?? (i % 3 === 0 ? "email" : i % 3 === 1 ? "phone" : "either"),
        directoryNote:
          prev.directoryNote ??
          (i % 4 === 0 ? "3.5 · mornings" : i % 4 === 1 ? "Doubles preferred" : i % 4 === 2 ? "Hit anytime" : undefined),
      });
      continue;
    }
    byNumber.set(person.memberNumber, {
      memberNumber: person.memberNumber,
      name: person.name,
      email: person.email,
      phone: person.phone,
      password: "tennis",
      createdAt: "2026-05-01T12:00:00.000Z",
      directoryVisible: i % 5 !== 0,
      preferredContact: i % 3 === 0 ? "email" : i % 3 === 1 ? "phone" : "either",
      directoryNote: i % 4 === 0 ? "3.5 · mornings" : i % 4 === 1 ? "Doubles preferred" : i % 4 === 2 ? "Hit anytime" : undefined,
    });
  }
  // Derek listed in directory for demos
  const derek = byNumber.get(DEREK_MEMBER.memberNumber);
  if (derek) {
    byNumber.set(DEREK_MEMBER.memberNumber, {
      ...derek,
      directoryVisible: true,
      preferredContact: "either",
      directoryNote: "Club pro · always around",
    });
  }
  saveList(KEYS.members, [...byNumber.values()]);

  const payments = loadList<S27PaymentProfile>(KEYS.payment);
  const have = new Set(payments.map((p) => p.memberNumber));
  const extra: S27PaymentProfile[] = [];
  for (const [i, person] of MEMBERS.entries()) {
    if (!person.memberNumber || have.has(person.memberNumber)) continue;
    extra.push({
      memberNumber: person.memberNumber,
      brand: i % 3 === 0 ? "Amex" : i % 2 === 0 ? "Mastercard" : "Visa",
      last4: String(4200 + i).slice(-4),
      expMonth: String((i % 12) + 1).padStart(2, "0"),
      expYear: "28",
      billingZip: "12572",
      oneClick: true,
    });
  }
  if (extra.length) saveList(KEYS.payment, [...payments, ...extra]);
}

function seedLfg(): S27LfgPost[] {
  const a = MEMBERS[0];
  const b = MEMBERS[1];
  const c = MEMBERS[2];
  if (!a.memberNumber || !b.memberNumber || !c.memberNumber) return [];
  return [
    {
      id: "mock-lfg-1",
      date: formatDateInput(dayOffset(1)),
      hour: 10,
      format: "singles",
      levelNote: "3.5+ · solid hitting",
      courtPref: "either",
      hostMemberNumber: a.memberNumber,
      hostName: a.name,
      players: [
        { memberNumber: a.memberNumber, name: a.name },
        { memberNumber: b.memberNumber, name: b.name },
      ],
      status: "open",
      createdAt: new Date().toISOString(),
    },
    {
      id: "mock-lfg-2",
      date: formatDateInput(dayOffset(2)),
      hour: 17,
      format: "doubles",
      levelNote: "Friendly doubles",
      courtPref: "court-2",
      hostMemberNumber: c.memberNumber,
      hostName: c.name,
      players: [{ memberNumber: c.memberNumber, name: c.name }],
      status: "open",
      createdAt: new Date().toISOString(),
    },
  ];
}

function seedCourts(): S27CourtBooking[] {
  const out: S27CourtBooking[] = [];
  let n = 0;

  function add(date: string, hour: number, durationHours: 1 | 2, courtId: CourtId, who: Person, i: number) {
    if (
      courtSlotConflict({
        date,
        courtId,
        hour,
        durationHours,
        bookings: out,
      })
    ) {
      return;
    }
    const member = !!who.memberNumber;
    out.push({
      id: `mock-court-${++n}`,
      date,
      hour,
      durationHours,
      courtId,
      courtName: courtId === "court-1" ? "Court 3" : "Court 4",
      clientName: who.name,
      clientEmail: who.email,
      clientPhone: who.phone,
      memberNumber: who.memberNumber,
      amount: (member ? COURT_RATES.member : COURT_RATES.guest) * durationHours,
      paymentStatus: paid(i),
      paymentMethod: method(i),
      createdAt: new Date().toISOString(),
    });
  }

  for (let offset = -21; offset <= 14; offset++) {
    const d = dayOffset(offset);
    const date = formatDateInput(d);
    const dow = d.getDay();
    const base = Math.abs(offset) * 7;

    if (dow === 0 || dow === 6) {
      add(date, 11, 1, "court-1", personAt(base), base);
      if (dow === 0) add(date, 11, 1, "court-2", personAt(base + 1), base + 1);
      add(date, 12, 2, "court-1", personAt(base + 2), base + 2);
      add(date, 12, 1, "court-2", guestAt(offset), base + 3);
      add(date, 14, 1, "court-1", personAt(base + 4), base + 4);
      add(date, 14, 2, "court-2", personAt(base + 5), base + 5);
      add(date, 16, 1, "court-1", personAt(base + 6), base + 6);
      add(date, 17, 1, "court-2", personAt(base + 7), base + 7);
      continue;
    }

    add(date, 8, 1, "court-2", personAt(base), base);
    add(date, 9, 1, "court-2", personAt(base + 1), base + 1);
    add(date, 10, 2, "court-2", personAt(base + 2), base + 2);

    if (dow === 2 || dow === 4) {
      add(date, 13, 1, "court-1", personAt(base + 3), base + 3);
      add(date, 13, 1, "court-2", personAt(base + 4), base + 4);
      add(date, 14, 1, "court-1", guestAt(base + 5), base + 5);
      add(date, 17, 1, "court-2", personAt(base + 6), base + 6);
      add(date, 18, 1, "court-1", personAt(base + 7), base + 7);
      add(date, 19, 1, "court-2", personAt(base + 8), base + 8);
    } else if (dow === 3) {
      add(date, 12, 1, "court-1", personAt(base + 3), base + 3);
      add(date, 13, 2, "court-2", personAt(base + 4), base + 4);
      add(date, 14, 1, "court-1", personAt(base + 5), base + 5);
      add(date, 17, 1, "court-2", personAt(base + 6), base + 6);
      add(date, 18, 1, "court-1", guestAt(base + 7), base + 7);
      add(date, 19, 1, "court-2", personAt(base + 8), base + 8);
    } else {
      add(date, 12, 1, "court-1", personAt(base + 3), base + 3);
      add(date, 12, 1, "court-2", personAt(base + 4), base + 4);
      add(date, 13, 1, "court-1", personAt(base + 5), base + 5);
      add(date, 14, 1, "court-2", guestAt(base + 6), base + 6);
    }
  }

  return out;
}

function clinicBlocksCourt(date: string, courtId: CourtId, hour: number, durationHours = 1) {
  for (let t = 0; t < durationHours - 1e-9; t += 0.5) {
    const program = getProgramBlock(date, courtId, hour + t);
    if (program && program.type !== "lesson") return true;
  }
  return false;
}

function seedLessons(courts: S27CourtBooking[]): S27LessonBooking[] {
  const out: S27LessonBooking[] = [];
  let n = 0;
  const derek = s27Pros.find((p) => p.id === "derek") || s27Pros[0];
  const maya = s27Pros.find((p) => p.id === "maya-ellison");
  const jonah = s27Pros.find((p) => p.id === "jonah-berkowitz");

  function fits(courtId: CourtId, date: string, hour: number, durationHours = 1) {
    if (clinicBlocksCourt(date, courtId, hour, durationHours)) return false;
    return !courtSlotConflict({
      date,
      courtId,
      hour,
      durationHours,
      bookings: courts,
      lessons: out,
    });
  }
  for (let offset = -21; offset <= 14; offset++) {
    const d = dayOffset(offset);
    const day = d.getDay();
    const date = formatDateInput(d);
    if (day >= 1 && day <= 5) {
      const hours = day === 2 || day === 4 ? [15] : [10];
      hours.forEach((hour, hi) => {
        const who = personAt(offset * 6 + hi + 3);
        const duration = "60" as const;
        if (!fits(derek.courtId, date, hour)) return;
        out.push({
          id: `mock-lesson-${++n}`,
          date,
          hour,
          duration,
          clientName: who.name,
          clientEmail: who.email,
          clientPhone: who.phone,
          memberNumber: who.memberNumber,
          proId: derek.id,
          proName: derek.name,
          courtId: derek.courtId,
          focus: FOCUS[(offset + hi) % FOCUS.length],
          amount: lessonRateForPro(derek, !!who.memberNumber),
          paymentStatus: paid(offset + hi),
          paymentMethod: method(offset + hi),
          requestStatus: "accepted",
          createdAt: new Date().toISOString(),
        });
      });
    }
    if (maya && [1, 3].includes(day) && offset % 2 === 0 && fits(maya.courtId, date, 16)) {
      const who = personAt(offset + 11);
      out.push({
        id: `mock-lesson-${++n}`,
        date,
        hour: 16,
        duration: "60",
        clientName: who.name,
        clientEmail: who.email,
        clientPhone: who.phone,
        memberNumber: who.memberNumber,
        proId: maya.id,
        proName: maya.name,
        courtId: maya.courtId,
        focus: "Doubles patterns",
        amount: lessonRateForPro(maya, !!who.memberNumber),
        paymentStatus: paid(offset + 2),
        paymentMethod: method(offset + 2),
        createdAt: new Date().toISOString(),
      });
    }
    if (jonah && [2, 4, 6].includes(day)) {
      const hours = day === 6 ? [11, 16] : [11, 15];
      hours.forEach((hour, hi) => {
        if (!fits(jonah.courtId, date, hour)) return;
        const kid = JUNIORS[Math.abs(offset * 2 + hi) % JUNIORS.length];
        out.push({
          id: `mock-lesson-${++n}`,
          date,
          hour,
          duration: "60",
          clientName: kid.name,
          clientEmail: kid.email,
          clientPhone: "",
          memberNumber: kid.memberNumber,
          proId: jonah.id,
          proName: jonah.name,
          courtId: jonah.courtId,
          focus: hi === 0 ? "Junior fundamentals" : "Match play",
          amount: lessonRateForPro(jonah, !!kid.memberNumber),
          paymentStatus: paid(offset + hi),
          paymentMethod: method(offset + hi),
          requestStatus: "accepted",
          createdAt: new Date().toISOString(),
        });
      });
    }
  }
  // A few open requests for the director desk.
  for (let i = 0; i < 3; i++) {
    const who = personAt(40 + i);
    const d = dayOffset(3 + i * 2);
    out.push({
      id: `mock-lesson-req-${i + 1}`,
      date: formatDateInput(d),
      hour: [9, 10, 15][i],
      duration: "60",
      clientName: who.name,
      clientEmail: who.email,
      clientPhone: who.phone,
      memberNumber: who.memberNumber,
      proId: derek.id,
      proName: derek.name,
      courtId: derek.courtId,
      focus: FOCUS[i % FOCUS.length],
      amount: lessonRateForPro(derek, true),
      paymentStatus: "paid",
      paymentMethod: "saved-card",
      requestStatus: "requested",
      createdAt: new Date().toISOString(),
    });
  }
  if (jonah) {
    nextDatesForDays([4], 2).forEach((date, i) => {
      const kid = JUNIORS[(i + 3) % JUNIORS.length];
      const hour = i === 0 ? 10 : 16;
      out.push({
        id: `mock-lesson-req-jonah-${i + 1}`,
        date,
        hour,
        duration: "60",
        clientName: kid.name,
        clientEmail: kid.email,
        clientPhone: "",
        memberNumber: kid.memberNumber,
        proId: jonah.id,
        proName: jonah.name,
        courtId: jonah.courtId,
        focus: "Junior fundamentals",
        amount: lessonRateForPro(jonah, true),
        paymentStatus: "paid",
        paymentMethod: "saved-card",
        requestStatus: "requested",
        createdAt: new Date().toISOString(),
      });
    });
  }
  return out;
}

function seedClinics(): S27ClinicBooking[] {
  const out: S27ClinicBooking[] = [];
  let n = 0;
  for (const clinic of s27Clinics) {
    const dates = [
      ...pastDatesForDays(clinic.days, 4).reverse(),
      ...nextDatesForDays(clinic.days, 3),
    ];
    dates.forEach((date, di) => {
      const rosterSize = clinic.kind === "junior" ? 5 + (di % 2) : 6 + ((di + clinic.startHour) % 3);
      for (let i = 0; i < rosterSize; i++) {
        if (clinic.kind === "junior") {
          const kid = JUNIORS[(di * 3 + i) % JUNIORS.length];
          out.push({
            id: `mock-clinic-${++n}`,
            clinicId: clinic.id,
            clinicName: clinic.name,
            date,
            clientName: kid.name,
            clientEmail: kid.email,
            memberNumber: kid.memberNumber,
            amount: clinic.memberPrice,
            paymentStatus: paid(i + di),
            paymentMethod: method(i),
            createdAt: new Date().toISOString(),
          });
        } else {
          const who = i === rosterSize - 1 && di === 0 ? GUESTS[i % GUESTS.length] : personAt(di * 5 + i + clinic.startHour);
          out.push({
            id: `mock-clinic-${++n}`,
            clinicId: clinic.id,
            clinicName: clinic.name,
            date,
            clientName: who.name,
            clientEmail: who.email,
            memberNumber: who.memberNumber,
            amount: who.memberNumber ? clinic.memberPrice : clinic.guestPrice,
            paymentStatus: paid(i + di),
            paymentMethod: method(i + di),
            createdAt: new Date().toISOString(),
          });
        }
      }
    });
  }
  return out;
}

function seedEvents(): S27EventBooking[] {
  const out: S27EventBooking[] = [];
  let n = 0;
  s27Events.forEach((event, ei) => {
    const count = event.capacity > 16 ? 11 : 8 + (ei % 3);
    for (let i = 0; i < count; i++) {
      const who = i === count - 1 ? GUESTS[ei % GUESTS.length] : personAt(ei * 4 + i);
      const guestCount = event.category === "Family" ? 2 + (i % 2) : 1 + (i % 2);
      out.push({
        id: `mock-event-${++n}`,
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        attendeeName: who.name,
        attendeeEmail: who.email,
        guestCount,
        memberNumber: who.memberNumber,
        amount: (who.memberNumber ? event.memberPrice : event.guestPrice) * guestCount,
        paymentStatus: paid(i + ei),
        paymentMethod: method(i),
        createdAt: new Date().toISOString(),
      });
    }
  });
  return out;
}

function seedStringing(): S27StringingOrder[] {
  const rackets = [
    ["Wilson Blade 98", "Polyester", "52", 32],
    ["Babolat Pure Drive", "Multifilament", "55", 28],
    ["Head Gravity Tour", "Hybrid (poly + multi)", "50", 34],
    ["Yonex Ezone 100", "Synthetic gut", "54", 18],
    ["Prince Phantom", "Polyester", "48", 32],
    ["Wilson Pro Staff", "Hybrid (poly + multi)", "53", 34],
    ["Head Radical MP", "Polyester", "51", 32],
    ["Babolat Pure Aero", "Multifilament", "56", 28],
  ] as const;

  return rackets.map((racket, i) => {
    const who = i === 5
      ? { name: DEREK_MEMBER.name, email: DEREK_MEMBER.email, memberNumber: DEREK_MEMBER.memberNumber }
      : personAt(i + 2);
    return {
      id: `mock-string-${i + 1}`,
      racket: racket[0],
      stringId: "custom",
      stringName: racket[1],
      tension: racket[2],
      pickupDate: formatDateInput(dayOffset(i + 1)),
      clientName: who.name,
      clientEmail: who.email,
      memberNumber: who.memberNumber,
      amount: STRINGING_LABOR + racket[3],
      paymentStatus: paid(i),
      paymentMethod: method(i),
      shopStatus: i < 5 ? ("in_shop" as const) : i === 5 ? ("ready" as const) : ("picked_up" as const),
      readyAt: i >= 5 ? new Date().toISOString() : undefined,
      notifiedAt: i === 5 ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    } satisfies S27StringingOrder;
  });
}

function assignJonahClinics() {
  const jonahClinics = new Set(["tue-am-juniors", "thu-hs-juniors", "wed-am-tots", "wed-am-toddlers"]);
  const catalog = getCatalog();
  saveCatalog({
    ...catalog,
    clinics: catalog.clinics.map((c) =>
      jonahClinics.has(c.id) ? { ...c, proIds: ["jonah-berkowitz"] } : c
    ),
  });
}

export function seedMockBookings() {
  if (typeof window === "undefined") return;
  // Production flag — set NEXT_PUBLIC_S27_LIVE=1 in Vercel when you go live.
  if (process.env.NEXT_PUBLIC_S27_LIVE === "1") return;
  if (localStorage.getItem("s27_disable_mocks") === "1") return;
  if (localStorage.getItem(MOCK_FLAG) === "1") return;

  try {
    seedMembers();
    persistCourts(keepReal(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)), seedCourts()));
    saveList(KEYS.clinics, keepReal(loadList<S27ClinicBooking>(KEYS.clinics), seedClinics()));
    persistLessons(keepReal(loadList<S27LessonBooking>(KEYS.lessons), seedLessons(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)))));
    assignJonahClinics();
    saveList(KEYS.events, keepReal(loadList<S27EventBooking>(KEYS.events), seedEvents()));
    const stringOrders = keepReal(loadList<S27StringingOrder>(KEYS.stringing), seedStringing());
    saveList(KEYS.stringing, stringOrders);
    for (const order of stringOrders) rememberStringing(order.memberNumber, order);
    saveList(KEYS.lfg, keepReal(loadList<S27LfgPost>(KEYS.lfg), seedLfg()));
  } catch (err) {
    console.error("Summer27 mock seed failed", err);
  } finally {
    try {
      localStorage.setItem(MOCK_FLAG, "1");
    } catch {
      // ignore
    }
  }
}
