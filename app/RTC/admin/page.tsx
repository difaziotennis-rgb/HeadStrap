"use client";

import { useEffect, useMemo, useState } from "react";
import { rtcCoaches } from "../rtc-data";

const ADMIN_AUTH_KEY = "rtc_admin_auth_v1";
const ADMIN_PASSWORD = "admin";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const ADMIN_COURT_BLOCKS_KEY = "rtc_admin_court_blocks_v1";
const ADMIN_MEMBER_NOTES_KEY = "rtc_admin_member_notes_v1";
const ADMIN_PRO_PAYOUTS_KEY = "rtc_admin_pro_payouts_v1";
const ADMIN_PRO_PROFILES_KEY = "rtc_admin_pro_profiles_v1";
const ADMIN_QUARTERLY_EMAIL_LOG_KEY = "rtc_admin_quarterly_email_log_v1";

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7);
const COURTS = [
  { id: "indoor-1", name: "Indoor Court" },
  { id: "outdoor-1", name: "Court 1" },
  { id: "outdoor-2", name: "Court 2" },
  { id: "outdoor-3", name: "Court 3" },
  { id: "outdoor-4", name: "Court 4" },
  { id: "outdoor-5", name: "Court 5" },
];

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2 | 3;
  courtId?: string;
  courtName: string;
  memberNumber?: string;
  clientName: string;
  clientEmail?: string;
  totalAmount: number;
  paymentStatus?: "pending" | "paid";
  createdAt: string;
};

type LessonBooking = {
  id: string;
  coachName: string;
  slot: string;
  clientName: string;
  clientEmail: string;
  memberNumber?: string;
  createdAt: string;
};

type ClinicBooking = {
  id: string;
  clinicNames: string[];
  clinicCount: number;
  total: number;
  clientName: string;
  memberNumber?: string;
  createdAt: string;
};

type EventReservation = {
  id: string;
  eventTitle: string;
  eventDateLabel: string;
  guestCount: number;
  total: number;
  attendeeName: string;
  memberNumber?: string;
  createdAt: string;
};

type AdminCourtBlock = {
  id: string;
  date: string;
  courtId: string;
  startHour: number;
  durationHours: 1 | 2 | 3;
  reason: string;
  createdAt: string;
};

type MemberNote = {
  memberNumber: string;
  note: string;
  updatedAt: string;
};

type ProPayout = {
  id: string;
  proName: string;
  amount: number;
  payDate: string;
  method: "check" | "ach" | "cash" | "other";
  category: "clinic" | "lesson" | "event" | "other";
  taxYear: number;
  notes: string;
};

type ProProfile = {
  id: string;
  displayName: string;
  legalName: string;
  email: string;
  address: string;
  taxIdLast4: string;
  w9OnFile: boolean;
  active: boolean;
  updatedAt: string;
};

type MonthStat = {
  key: string;
  label: string;
  revenue: number;
  visits: number;
  paid: number;
  pending: number;
};

type MemberDirectoryRow = {
  memberNumber: string;
  name: string;
  email: string;
  courtBookings: number;
  courtHours: number;
  courtSpend: number;
  outstanding: number;
  lessonRequests: number;
  clinicSignups: number;
  eventReservations: number;
  clinicSpend: number;
  eventSpend: number;
  totalSpend: number;
  clinics: string[];
  events: string[];
  lastActivity: string | null;
  note: string;
};

type StatementLineItem = {
  sortAt: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  status: "Paid" | "Pending";
};

type QuarterlyStatement = {
  memberNumber: string;
  memberName: string;
  memberEmail: string;
  quarterKey: string;
  quarterLabel: string;
  totalBilled: number;
  totalPaid: number;
  outstanding: number;
  lineItems: StatementLineItem[];
};

type AdminWorkspace = "overview" | "operations" | "programs" | "members" | "finance";

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatHour(hour: number): string {
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${h12}:00 ${hour >= 12 ? "PM" : "AM"}`;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function seasonLabel(date: Date): string {
  const month = date.getMonth() + 1;
  if (month >= 3 && month <= 5) return "Spring";
  if (month >= 6 && month <= 8) return "Summer";
  if (month >= 9 && month <= 11) return "Fall";
  return "Winter";
}

function makeDate(monthOffset: number, day: number, hour = 12): string {
  const now = new Date();
  const dt = new Date(now.getFullYear(), now.getMonth() + monthOffset, day, hour, 0, 0, 0);
  return dt.toISOString();
}

function getQuarter(date: Date): { year: number; quarter: 1 | 2 | 3 | 4; key: string; label: string } {
  const year = date.getFullYear();
  const quarter = (Math.floor(date.getMonth() / 3) + 1) as 1 | 2 | 3 | 4;
  const key = `${year}-Q${quarter}`;
  const label = `Q${quarter} ${year}`;
  return { year, quarter, key, label };
}

function quarterStart(quarterKey: string): Date {
  const [yearStr, qPart] = quarterKey.split("-Q");
  const year = Number(yearStr);
  const quarter = Number(qPart);
  const month = Math.max(0, (quarter - 1) * 3);
  return new Date(year, month, 1, 0, 0, 0, 0);
}

function quarterEnd(quarterKey: string): Date {
  const start = quarterStart(quarterKey);
  return new Date(start.getFullYear(), start.getMonth() + 3, 0, 23, 59, 59, 999);
}

function previousQuarterKey(): string {
  const now = new Date();
  const current = getQuarter(now);
  if (current.quarter === 1) return `${current.year - 1}-Q4`;
  return `${current.year}-Q${current.quarter - 1}`;
}

function quarterLabelFromKey(key: string): string {
  const [year, q] = key.split("-Q");
  return `Q${q} ${year}`;
}

function quarterOptions(count = 8): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < count; i += 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i * 3, 1);
    options.push(getQuarter(d).key);
  }
  return Array.from(new Set(options));
}

function mod(value: number, base: number): number {
  return ((value % base) + base) % base;
}

function createMockData() {
  const courts: CourtBooking[] = [];
  const lessons: LessonBooking[] = [];
  const clinics: ClinicBooking[] = [];
  const events: EventReservation[] = [];
  const payouts: ProPayout[] = [];
  const proProfiles: ProProfile[] = [];
  const notes: MemberNote[] = [
    { memberNumber: "101", note: "Prefers indoor evening slots.", updatedAt: makeDate(-1, 11) },
    { memberNumber: "318", note: "Interested in recurring Sunday clinics.", updatedAt: makeDate(-2, 8) },
  ];
  const coaches = rtcCoaches.map((coach) => coach.name);
  coaches.forEach((coach, idx) => {
    proProfiles.push({
      id: `mock-pro-${idx}`,
      displayName: coach,
      legalName: `${coach} LLC`,
      email: `${coach.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      address: "2 Salisbury Ct, Rhinebeck, NY 12572",
      taxIdLast4: String(1200 + idx).slice(-4),
      w9OnFile: idx % 2 === 0,
      active: true,
      updatedAt: makeDate(-1, 1 + idx),
    });
  });

  const courtNames = COURTS.map((c) => c.name);
  const members = [
    { number: "101", name: "Jenni Ruiz", email: "jenni.ruiz@example.com" },
    { number: "204", name: "Shane Carter", email: "shane.carter@example.com" },
    { number: "318", name: "Emily Thompson", email: "emily.thompson@example.com" },
    { number: "427", name: "Mark Reynolds", email: "mark.reynolds@example.com" },
    { number: "536", name: "Sarah Kaplan", email: "sarah.kaplan@example.com" },
    { number: "642", name: "David Morales", email: "david.morales@example.com" },
  ];

  for (let i = -14; i <= 0; i += 1) {
    const dt = new Date();
    dt.setMonth(dt.getMonth() + i);
    const dateValue = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      (i * -3) % 20 + 5
    ).padStart(2, "0")}`;
    for (let j = 0; j < 3; j += 1) {
      const id = `mock-court-${i}-${j}`;
      const member = members[mod(i + j, members.length)];
      const amount = 58 + ((i + j + 9) % 4) * 8;
      const courtIdx = mod(j + i + 9, COURTS.length);
      courts.push({
        id,
        date: dateValue,
        hour: 9 + j * 2,
        blockStartHour: 9 + j * 2,
        durationHours: (j % 3 === 0 ? 2 : 1) as 1 | 2 | 3,
        courtId: COURTS[courtIdx].id,
        courtName: courtNames[courtIdx],
        memberNumber: member.number,
        clientName: member.name,
        clientEmail: member.email,
        totalAmount: amount,
        paymentStatus: (j + i) % 5 === 0 ? "pending" : "paid",
        createdAt: makeDate(i, 5 + j),
      });
    }
    const lessonMember = members[mod(i + 2, members.length)];
    lessons.push({
      id: `mock-lesson-${i}`,
      coachName: coaches[mod(i, coaches.length)],
      slot: "Tue 5:00 PM",
      clientName: lessonMember.name,
      clientEmail: lessonMember.email,
      memberNumber: lessonMember.number,
      createdAt: makeDate(i, 10),
    });
    const clinicMember = members[mod(i + 3, members.length)];
    clinics.push({
      id: `mock-clinic-${i}`,
      clinicNames: ["Monday Nights with Derek"],
      clinicCount: 1,
      total: 75,
      clientName: clinicMember.name,
      memberNumber: clinicMember.number,
      createdAt: makeDate(i, 12),
    });
    const eventMember = members[mod(i + 4, members.length)];
    events.push({
      id: `mock-event-${i}`,
      eventTitle: i % 2 === 0 ? "Summer White Party" : "Twilight Mixed Doubles Mixer",
      eventDateLabel: "Aug 16",
      guestCount: 2 + (Math.abs(i) % 3),
      total: 120 + (Math.abs(i) % 3) * 30,
      attendeeName: eventMember.name,
      memberNumber: eventMember.number,
      createdAt: makeDate(i, 15),
    });
    payouts.push({
      id: `mock-payout-${i}`,
      proName: coaches[mod(i, coaches.length)],
      amount: 240 + (Math.abs(i) % 4) * 40,
      payDate: makeDate(i, 20),
      method: "check",
      category: i % 2 === 0 ? "clinic" : "lesson",
      taxYear: new Date(makeDate(i, 20)).getFullYear(),
      notes: "Weekly contractor payout",
    });
  }

  return { courts, lessons, clinics, events, payouts, notes, proProfiles };
}

export default function RTCAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState<string | null>(null);
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([]);
  const [lessonBookings, setLessonBookings] = useState<LessonBooking[]>([]);
  const [clinicBookings, setClinicBookings] = useState<ClinicBooking[]>([]);
  const [eventReservations, setEventReservations] = useState<EventReservation[]>([]);
  const [adminBlocks, setAdminBlocks] = useState<AdminCourtBlock[]>([]);
  const [memberNotes, setMemberNotes] = useState<MemberNote[]>([]);
  const [proPayouts, setProPayouts] = useState<ProPayout[]>([]);
  const [proProfiles, setProProfiles] = useState<ProProfile[]>([]);
  const [quarterlyEmailLog, setQuarterlyEmailLog] = useState<Record<string, string>>({});
  const [useMockData, setUseMockData] = useState(true);
  const [selectedTaxYear, setSelectedTaxYear] = useState(new Date().getFullYear());
  const [selectedStatementQuarter, setSelectedStatementQuarter] = useState(previousQuarterKey());
  const [statementStatus, setStatementStatus] = useState<string | null>(null);
  const [sendingStatements, setSendingStatements] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<AdminWorkspace>("overview");
  const [selectedClinic, setSelectedClinic] = useState("All Clinics");
  const [selectedEvent, setSelectedEvent] = useState("All Events");
  const [selectedMemberNumber, setSelectedMemberNumber] = useState<string | null>(null);

  const [newBlock, setNewBlock] = useState({
    date: formatDateInput(new Date()),
    courtId: COURTS[0].id,
    startHour: HOURS[0],
    durationHours: 1 as 1 | 2 | 3,
    reason: "Maintenance",
  });
  const [manualBooking, setManualBooking] = useState({
    date: formatDateInput(new Date()),
    courtId: COURTS[0].id,
    startHour: HOURS[0],
    durationHours: 1 as 1 | 2 | 3,
    clientName: "",
    clientEmail: "",
    memberNumber: "",
    paymentStatus: "paid" as "paid" | "pending",
    totalAmount: "0",
  });
  const [noteForm, setNoteForm] = useState({ memberNumber: "", note: "" });
  const [payoutForm, setPayoutForm] = useState({
    proName: rtcCoaches[0]?.name || "Derek DiFazio",
    amount: "",
    payDate: formatDateInput(new Date()),
    method: "check" as ProPayout["method"],
    category: "clinic" as ProPayout["category"],
    notes: "",
  });
  const [proProfileForm, setProProfileForm] = useState({
    displayName: rtcCoaches[0]?.name || "Derek DiFazio",
    legalName: "",
    email: "",
    address: "",
    taxIdLast4: "",
    w9OnFile: true,
    active: true,
  });

  function loadLiveData() {
    if (typeof window === "undefined") return;
    const map = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
    const seen = new Set<string>();
    const uniqueCourts = Object.values(map).filter((booking) => {
      if (booking.hour !== booking.blockStartHour) return false;
      if (seen.has(booking.id)) return false;
      seen.add(booking.id);
      return true;
    });
    setCourtBookings(uniqueCourts);
    setLessonBookings(safeParse<LessonBooking[]>(localStorage.getItem(LESSON_KEY), []));
    setClinicBookings(safeParse<ClinicBooking[]>(localStorage.getItem(CLINIC_KEY), []));
    setEventReservations(safeParse<EventReservation[]>(localStorage.getItem(EVENT_KEY), []));
    setAdminBlocks(safeParse<AdminCourtBlock[]>(localStorage.getItem(ADMIN_COURT_BLOCKS_KEY), []));
    setMemberNotes(safeParse<MemberNote[]>(localStorage.getItem(ADMIN_MEMBER_NOTES_KEY), []));
    setProPayouts(safeParse<ProPayout[]>(localStorage.getItem(ADMIN_PRO_PAYOUTS_KEY), []));
    setProProfiles(safeParse<ProProfile[]>(localStorage.getItem(ADMIN_PRO_PROFILES_KEY), []));
    setQuarterlyEmailLog(
      safeParse<Record<string, string>>(localStorage.getItem(ADMIN_QUARTERLY_EMAIL_LOG_KEY), {})
    );
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(localStorage.getItem(ADMIN_AUTH_KEY) === "true");
    loadLiveData();
  }, []);

  const mergedData = useMemo(() => {
    const mock = createMockData();
    return {
      courts: useMockData ? [...mock.courts, ...courtBookings] : courtBookings,
      lessons: useMockData ? [...mock.lessons, ...lessonBookings] : lessonBookings,
      clinics: useMockData ? [...mock.clinics, ...clinicBookings] : clinicBookings,
      events: useMockData ? [...mock.events, ...eventReservations] : eventReservations,
      payouts: useMockData ? [...mock.payouts, ...proPayouts] : proPayouts,
      notes: useMockData ? [...mock.notes, ...memberNotes] : memberNotes,
      proProfiles: useMockData ? [...mock.proProfiles, ...proProfiles] : proProfiles,
    };
  }, [
    courtBookings,
    lessonBookings,
    clinicBookings,
    eventReservations,
    proPayouts,
    memberNotes,
    proProfiles,
    useMockData,
  ]);

  const kpis = useMemo(() => {
    const revenueCourts = mergedData.courts.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const revenueClinics = mergedData.clinics.reduce((sum, b) => sum + (b.total || 0), 0);
    const revenueEvents = mergedData.events.reduce((sum, b) => sum + (b.total || 0), 0);
    const contractorPayouts = mergedData.payouts.reduce((sum, p) => sum + p.amount, 0);
    const totalRevenue = revenueCourts + revenueClinics + revenueEvents;
    const outstanding = mergedData.courts
      .filter((b) => b.paymentStatus !== "paid")
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);

    const memberSet = new Set<string>();
    [...mergedData.courts, ...mergedData.lessons, ...mergedData.clinics, ...mergedData.events].forEach(
      (entry: any) => {
        if (entry.memberNumber) memberSet.add(entry.memberNumber);
      }
    );

    return {
      totalRevenue,
      outstanding,
      contractorPayouts,
      netAfterPayouts: totalRevenue - contractorPayouts,
      totalBookings:
        mergedData.courts.length +
        mergedData.lessons.length +
        mergedData.clinics.length +
        mergedData.events.length,
      membersActive: memberSet.size,
    };
  }, [mergedData]);

  const monthly = useMemo(() => {
    const map = new Map<string, MonthStat>();
    for (let i = -11; i <= 0; i += 1) {
      const dt = new Date();
      dt.setMonth(dt.getMonth() + i);
      const key = monthKey(dt);
      map.set(key, {
        key,
        label: monthLabel(dt),
        revenue: 0,
        visits: 0,
        paid: 0,
        pending: 0,
      });
    }
    mergedData.courts.forEach((item) => {
      const dt = new Date(item.createdAt || `${item.date}T12:00:00`);
      const key = monthKey(dt);
      const month = map.get(key);
      if (!month) return;
      month.revenue += item.totalAmount || 0;
      month.visits += 1;
      if (item.paymentStatus === "paid") month.paid += 1;
      else month.pending += 1;
    });
    mergedData.clinics.forEach((item) => {
      const month = map.get(monthKey(new Date(item.createdAt)));
      if (!month) return;
      month.revenue += item.total || 0;
      month.visits += item.clinicCount || 1;
    });
    mergedData.events.forEach((item) => {
      const month = map.get(monthKey(new Date(item.createdAt)));
      if (!month) return;
      month.revenue += item.total || 0;
      month.visits += Math.max(1, item.guestCount || 1);
    });
    mergedData.lessons.forEach((item) => {
      const month = map.get(monthKey(new Date(item.createdAt)));
      if (!month) return;
      month.visits += 1;
    });
    return Array.from(map.values());
  }, [mergedData]);

  const seasonal = useMemo(() => {
    const map = new Map<string, { label: string; revenue: number; visits: number }>();
    monthly.forEach((month) => {
      const dt = new Date(`${month.key}-01T12:00:00`);
      const label = `${seasonLabel(dt)} ${dt.getFullYear()}`;
      if (!map.has(label)) map.set(label, { label, revenue: 0, visits: 0 });
      const row = map.get(label)!;
      row.revenue += month.revenue;
      row.visits += month.visits;
    });
    return Array.from(map.values()).slice(-6);
  }, [monthly]);

  const yearly = useMemo(() => {
    const map = new Map<number, { year: number; revenue: number; visits: number }>();
    monthly.forEach((month) => {
      const dt = new Date(`${month.key}-01T12:00:00`);
      const year = dt.getFullYear();
      if (!map.has(year)) map.set(year, { year, revenue: 0, visits: 0 });
      const row = map.get(year)!;
      row.revenue += month.revenue;
      row.visits += month.visits;
    });
    return Array.from(map.values()).sort((a, b) => a.year - b.year);
  }, [monthly]);

  const recentActivity = useMemo(() => {
    const rows: Array<{ label: string; detail: string; at: string }> = [];
    mergedData.courts.forEach((item) =>
      rows.push({
        label: "Court booking",
        detail: `${item.clientName} · ${item.courtName} · ${formatCurrency(item.totalAmount || 0)}`,
        at: item.createdAt,
      })
    );
    mergedData.lessons.forEach((item) =>
      rows.push({
        label: "Lesson request",
        detail: `${item.clientName} with ${item.coachName}`,
        at: item.createdAt,
      })
    );
    mergedData.clinics.forEach((item) =>
      rows.push({
        label: "Clinic booking",
        detail: `${item.clientName} · ${item.clinicNames.join(", ")}`,
        at: item.createdAt,
      })
    );
    mergedData.events.forEach((item) =>
      rows.push({
        label: "Event RSVP",
        detail: `${item.attendeeName} · ${item.eventTitle}`,
        at: item.createdAt,
      })
    );
    mergedData.payouts.forEach((item) =>
      rows.push({
        label: "Pro payout",
        detail: `${item.proName} · ${formatCurrency(item.amount)} · ${item.category}`,
        at: item.payDate,
      })
    );
    return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 18);
  }, [mergedData]);

  const clinicMonitor = useMemo(() => {
    const map = new Map<string, { name: string; signups: number; revenue: number; attendees: Set<string> }>();
    mergedData.clinics.forEach((booking) => {
      booking.clinicNames.forEach((clinicName) => {
        const row = map.get(clinicName) || {
          name: clinicName,
          signups: 0,
          revenue: 0,
          attendees: new Set<string>(),
        };
        row.signups += 1;
        row.revenue += booking.total / Math.max(booking.clinicNames.length, 1);
        row.attendees.add(
          booking.memberNumber
            ? `${booking.clientName} (Member #${booking.memberNumber})`
            : booking.clientName
        );
        map.set(clinicName, row);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.signups - a.signups);
  }, [mergedData.clinics]);

  const eventMonitor = useMemo(() => {
    const map = new Map<
      string,
      { title: string; bookings: number; guests: number; revenue: number; attendees: Set<string> }
    >();
    mergedData.events.forEach((reservation) => {
      const row = map.get(reservation.eventTitle) || {
        title: reservation.eventTitle,
        bookings: 0,
        guests: 0,
        revenue: 0,
        attendees: new Set<string>(),
      };
      row.bookings += 1;
      row.guests += Math.max(reservation.guestCount || 1, 1);
      row.revenue += reservation.total || 0;
      row.attendees.add(
        reservation.memberNumber
          ? `${reservation.attendeeName} (Member #${reservation.memberNumber})`
          : reservation.attendeeName
      );
      map.set(reservation.eventTitle, row);
    });
    return Array.from(map.values()).sort((a, b) => b.guests - a.guests);
  }, [mergedData.events]);

  const memberDirectory = useMemo(() => {
    const map = new Map<string, MemberDirectoryRow>();
    const noteMap = new Map(mergedData.notes.map((n) => [n.memberNumber, n.note]));
    function ensureMember(memberNumber: string, nameHint?: string, emailHint?: string): MemberDirectoryRow {
      const existing = map.get(memberNumber);
      if (existing) {
        if (nameHint && existing.name.startsWith("Member ")) existing.name = nameHint;
        if (emailHint && !existing.email) existing.email = emailHint;
        return existing;
      }
      const row: MemberDirectoryRow = {
        memberNumber,
        name: nameHint || `Member ${memberNumber}`,
        email: emailHint || "",
        courtBookings: 0,
        courtHours: 0,
        courtSpend: 0,
        outstanding: 0,
        lessonRequests: 0,
        clinicSignups: 0,
        eventReservations: 0,
        clinicSpend: 0,
        eventSpend: 0,
        totalSpend: 0,
        clinics: [],
        events: [],
        lastActivity: null,
        note: "",
      };
      map.set(memberNumber, row);
      return row;
    }
    function bumpActivity(row: MemberDirectoryRow, at: string) {
      if (!row.lastActivity || new Date(at).getTime() > new Date(row.lastActivity).getTime()) row.lastActivity = at;
    }

    mergedData.courts.forEach((item) => {
      if (!item.memberNumber) return;
      const row = ensureMember(item.memberNumber, item.clientName, item.clientEmail);
      row.courtBookings += 1;
      row.courtHours += item.durationHours;
      row.courtSpend += item.totalAmount || 0;
      if (item.paymentStatus !== "paid") row.outstanding += item.totalAmount || 0;
      bumpActivity(row, item.createdAt);
    });
    mergedData.lessons.forEach((item) => {
      if (!item.memberNumber) return;
      const row = ensureMember(item.memberNumber, item.clientName, item.clientEmail);
      row.lessonRequests += 1;
      bumpActivity(row, item.createdAt);
    });
    mergedData.clinics.forEach((item) => {
      if (!item.memberNumber) return;
      const row = ensureMember(item.memberNumber, item.clientName);
      row.clinicSignups += item.clinicCount || 1;
      row.clinicSpend += item.total || 0;
      row.clinics = Array.from(new Set([...row.clinics, ...item.clinicNames]));
      bumpActivity(row, item.createdAt);
    });
    mergedData.events.forEach((item) => {
      if (!item.memberNumber) return;
      const row = ensureMember(item.memberNumber, item.attendeeName);
      row.eventReservations += item.guestCount || 1;
      row.eventSpend += item.total || 0;
      row.events = Array.from(new Set([...row.events, item.eventTitle]));
      bumpActivity(row, item.createdAt);
    });

    const rows = Array.from(map.values()).map((row) => ({
      ...row,
      totalSpend: row.courtSpend + row.clinicSpend + row.eventSpend,
      note: noteMap.get(row.memberNumber) || "",
    }));
    return rows.sort((a, b) => b.totalSpend - a.totalSpend);
  }, [mergedData]);

  const selectedMember = useMemo(() => {
    if (!selectedMemberNumber) return memberDirectory[0] || null;
    return memberDirectory.find((m) => m.memberNumber === selectedMemberNumber) || memberDirectory[0] || null;
  }, [memberDirectory, selectedMemberNumber]);

  const clinicOptions = useMemo(
    () => ["All Clinics", ...clinicMonitor.map((c) => c.name)],
    [clinicMonitor]
  );
  const eventOptions = useMemo(
    () => ["All Events", ...eventMonitor.map((e) => e.title)],
    [eventMonitor]
  );
  const proNameOptions = useMemo(() => {
    const names = new Set<string>([...rtcCoaches.map((coach) => coach.name)]);
    mergedData.proProfiles.forEach((pro) => names.add(pro.displayName));
    return Array.from(names);
  }, [mergedData.proProfiles]);
  const visibleClinics = useMemo(
    () => clinicMonitor.filter((item) => selectedClinic === "All Clinics" || item.name === selectedClinic),
    [clinicMonitor, selectedClinic]
  );
  const visibleEvents = useMemo(
    () => eventMonitor.filter((item) => selectedEvent === "All Events" || item.title === selectedEvent),
    [eventMonitor, selectedEvent]
  );

  const payoutSummary = useMemo(() => {
    const byPro = new Map<string, { total: number; count: number }>();
    mergedData.payouts
      .filter((item) => item.taxYear === selectedTaxYear)
      .forEach((item) => {
        const existing = byPro.get(item.proName) || { total: 0, count: 0 };
        existing.total += item.amount;
        existing.count += 1;
        byPro.set(item.proName, existing);
      });
    return Array.from(byPro.entries()).map(([proName, data]) => ({ proName, ...data }));
  }, [mergedData.payouts, selectedTaxYear]);

  const statementQuarterOptions = useMemo(() => quarterOptions(10), []);
  const quarterlyStatements = useMemo(() => {
    const start = quarterStart(selectedStatementQuarter);
    const end = quarterEnd(selectedStatementQuarter);
    const rows = memberDirectory.map((member): QuarterlyStatement => {
      const lineItems: StatementLineItem[] = [];
      let totalBilled = 0;
      let totalPaid = 0;
      let outstanding = 0;
      mergedData.courts.forEach((item) => {
        if (item.memberNumber !== member.memberNumber) return;
        const at = new Date(item.createdAt || `${item.date}T12:00:00`);
        if (at < start || at > end) return;
        const status = item.paymentStatus === "paid" ? "Paid" : "Pending";
        lineItems.push({
          sortAt: at.toISOString(),
          date: at.toLocaleDateString(),
          category: "Court",
          description: `${item.courtName} (${item.durationHours} hr)`,
          amount: item.totalAmount || 0,
          status,
        });
        totalBilled += item.totalAmount || 0;
        if (status === "Paid") totalPaid += item.totalAmount || 0;
        else outstanding += item.totalAmount || 0;
      });
      mergedData.clinics.forEach((item) => {
        if (item.memberNumber !== member.memberNumber) return;
        const at = new Date(item.createdAt);
        if (at < start || at > end) return;
        lineItems.push({
          sortAt: at.toISOString(),
          date: at.toLocaleDateString(),
          category: "Clinic",
          description: item.clinicNames.join(", "),
          amount: item.total || 0,
          status: "Paid",
        });
        totalBilled += item.total || 0;
        totalPaid += item.total || 0;
      });
      mergedData.events.forEach((item) => {
        if (item.memberNumber !== member.memberNumber) return;
        const at = new Date(item.createdAt);
        if (at < start || at > end) return;
        lineItems.push({
          sortAt: at.toISOString(),
          date: at.toLocaleDateString(),
          category: "Event",
          description: item.eventTitle,
          amount: item.total || 0,
          status: "Paid",
        });
        totalBilled += item.total || 0;
        totalPaid += item.total || 0;
      });

      lineItems.sort((a, b) => new Date(a.sortAt).getTime() - new Date(b.sortAt).getTime());
      return {
        memberNumber: member.memberNumber,
        memberName: member.name,
        memberEmail: member.email,
        quarterKey: selectedStatementQuarter,
        quarterLabel: quarterLabelFromKey(selectedStatementQuarter),
        totalBilled,
        totalPaid,
        outstanding,
        lineItems,
      };
    });
    return rows.filter((row) => row.lineItems.length > 0);
  }, [memberDirectory, mergedData, selectedStatementQuarter]);

  const statementSendable = useMemo(
    () => quarterlyStatements.filter((row) => row.memberEmail.trim().length > 0),
    [quarterlyStatements]
  );
  const statementMissingEmail = useMemo(
    () => quarterlyStatements.filter((row) => !row.memberEmail.trim()),
    [quarterlyStatements]
  );
  const proCompliance = useMemo(() => {
    return mergedData.proProfiles.map((pro) => {
      const yearTotal = mergedData.payouts
        .filter((p) => p.proName === pro.displayName && p.taxYear === selectedTaxYear)
        .reduce((sum, item) => sum + item.amount, 0);
      return {
        ...pro,
        yearTotal,
        needs1099: yearTotal >= 600,
      };
    });
  }, [mergedData.payouts, mergedData.proProfiles, selectedTaxYear]);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      if (typeof window !== "undefined") localStorage.setItem(ADMIN_AUTH_KEY, "true");
      setAuthed(true);
      setLoginMsg(null);
      setPassword("");
      return;
    }
    setLoginMsg("Incorrect password.");
  }

  function signOut() {
    if (typeof window !== "undefined") localStorage.removeItem(ADMIN_AUTH_KEY);
    setAuthed(false);
  }

  function createCourtBlock(e: React.FormEvent) {
    e.preventDefault();
    const block: AdminCourtBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: newBlock.date,
      courtId: newBlock.courtId,
      startHour: newBlock.startHour,
      durationHours: newBlock.durationHours,
      reason: newBlock.reason.trim() || "Admin hold",
      createdAt: new Date().toISOString(),
    };
    const next = [block, ...adminBlocks];
    setAdminBlocks(next);
    localStorage.setItem(ADMIN_COURT_BLOCKS_KEY, JSON.stringify(next));
    setAdminMsg("Court block created.");
  }

  function removeCourtBlock(blockId: string) {
    const next = adminBlocks.filter((item) => item.id !== blockId);
    setAdminBlocks(next);
    localStorage.setItem(ADMIN_COURT_BLOCKS_KEY, JSON.stringify(next));
    setAdminMsg("Court block removed.");
  }

  function createManualCourtBooking(e: React.FormEvent) {
    e.preventDefault();
    const clientName = manualBooking.clientName.trim();
    if (!clientName) {
      setAdminMsg("Client name is required.");
      return;
    }
    const totalAmount = Number(manualBooking.totalAmount || 0);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      setAdminMsg("Enter a valid booking total.");
      return;
    }
    const map = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
    const court = COURTS.find((item) => item.id === manualBooking.courtId);
    const bookingId = `admin-booking-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    for (let i = 0; i < manualBooking.durationHours; i += 1) {
      const hour = manualBooking.startHour + i;
      const key = `${manualBooking.date}|${manualBooking.courtId}|${hour}`;
      map[key] = {
        id: bookingId,
        date: manualBooking.date,
        hour,
        blockStartHour: manualBooking.startHour,
        durationHours: manualBooking.durationHours,
        courtId: manualBooking.courtId,
        courtName: court?.name || manualBooking.courtId,
        clientName,
        clientEmail: manualBooking.clientEmail.trim(),
        memberNumber: manualBooking.memberNumber.trim(),
        totalAmount,
        paymentStatus: manualBooking.paymentStatus,
        createdAt: new Date().toISOString(),
      };
    }
    localStorage.setItem(COURT_KEY, JSON.stringify(map));
    loadLiveData();
    setAdminMsg("Manual court booking added.");
    setManualBooking((prev) => ({
      ...prev,
      clientName: "",
      clientEmail: "",
      memberNumber: "",
      totalAmount: "0",
    }));
  }

  function markCourtBookingPaid(bookingId: string) {
    const map = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
    Object.keys(map).forEach((key) => {
      if (map[key].id === bookingId) map[key].paymentStatus = "paid";
    });
    localStorage.setItem(COURT_KEY, JSON.stringify(map));
    loadLiveData();
    setAdminMsg("Booking marked as paid.");
  }

  function cancelCourtBooking(bookingId: string) {
    const map = safeParse<Record<string, CourtBooking>>(localStorage.getItem(COURT_KEY), {});
    Object.keys(map).forEach((key) => {
      if (map[key].id === bookingId) delete map[key];
    });
    localStorage.setItem(COURT_KEY, JSON.stringify(map));
    loadLiveData();
    setAdminMsg("Booking cancelled.");
  }

  function saveMemberNote(e: React.FormEvent) {
    e.preventDefault();
    const memberNumber = noteForm.memberNumber.trim();
    const note = noteForm.note.trim();
    if (!memberNumber || !note) {
      setAdminMsg("Member number and note are required.");
      return;
    }
    const next = [...memberNotes.filter((item) => item.memberNumber !== memberNumber), {
      memberNumber,
      note,
      updatedAt: new Date().toISOString(),
    }];
    setMemberNotes(next);
    localStorage.setItem(ADMIN_MEMBER_NOTES_KEY, JSON.stringify(next));
    setNoteForm({ memberNumber: "", note: "" });
    setAdminMsg("Member note saved.");
  }

  function recordProPayout(e: React.FormEvent) {
    e.preventDefault();
    const amount = Number(payoutForm.amount || 0);
    if (!Number.isFinite(amount) || amount <= 0) {
      setAdminMsg("Enter a valid payout amount.");
      return;
    }
    const payDate = new Date(payoutForm.payDate);
    if (Number.isNaN(payDate.getTime())) {
      setAdminMsg("Enter a valid payout date.");
      return;
    }
    const payout: ProPayout = {
      id: `payout-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      proName: payoutForm.proName,
      amount,
      payDate: payDate.toISOString(),
      method: payoutForm.method,
      category: payoutForm.category,
      taxYear: payDate.getFullYear(),
      notes: payoutForm.notes.trim(),
    };
    const next = [payout, ...proPayouts];
    setProPayouts(next);
    localStorage.setItem(ADMIN_PRO_PAYOUTS_KEY, JSON.stringify(next));
    setPayoutForm((prev) => ({ ...prev, amount: "", notes: "" }));
    setSelectedTaxYear(payDate.getFullYear());
    setAdminMsg("Pro payout recorded.");
  }

  function export1099Csv() {
    const rows = mergedData.payouts.filter((item) => item.taxYear === selectedTaxYear);
    const header = "pro_name,amount,pay_date,method,category,tax_year,notes";
    const lines = rows.map((row) =>
      [
        `"${row.proName.replace(/"/g, '""')}"`,
        row.amount.toFixed(2),
        `"${new Date(row.payDate).toISOString().slice(0, 10)}"`,
        row.method,
        row.category,
        row.taxYear,
        `"${row.notes.replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rtc-1099-payouts-${selectedTaxYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setAdminMsg(`Exported ${rows.length} payout rows for ${selectedTaxYear}.`);
  }

  function saveProProfile(e: React.FormEvent) {
    e.preventDefault();
    const displayName = proProfileForm.displayName.trim();
    const legalName = proProfileForm.legalName.trim();
    if (!displayName || !legalName) {
      setAdminMsg("Display name and legal name are required.");
      return;
    }
    if (proProfileForm.taxIdLast4 && !/^\d{4}$/.test(proProfileForm.taxIdLast4.trim())) {
      setAdminMsg("Tax ID last4 must be 4 digits.");
      return;
    }
    const profile: ProProfile = {
      id: `pro-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      displayName,
      legalName,
      email: proProfileForm.email.trim(),
      address: proProfileForm.address.trim(),
      taxIdLast4: proProfileForm.taxIdLast4.trim(),
      w9OnFile: proProfileForm.w9OnFile,
      active: proProfileForm.active,
      updatedAt: new Date().toISOString(),
    };
    const next = [profile, ...proProfiles.filter((p) => p.displayName !== displayName)];
    setProProfiles(next);
    localStorage.setItem(ADMIN_PRO_PROFILES_KEY, JSON.stringify(next));
    setProProfileForm((prev) => ({ ...prev, legalName: "", email: "", address: "", taxIdLast4: "" }));
    setAdminMsg("Pro profile saved.");
  }

  async function sendQuarterlyStatements(mode: "manual" | "auto") {
    if (!statementSendable.length) {
      setStatementStatus("No quarterly statements to send (missing emails or no activity).");
      return;
    }
    setSendingStatements(true);
    setStatementStatus(mode === "auto" ? "Auto-sending quarterly statements..." : "Sending quarterly statements...");
    try {
      const res = await fetch("/api/rtc/send-quarterly-statements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statements: statementSendable }),
      });
      const data = (await res.json()) as {
        mode?: "live" | "preview";
        sent: number;
        failed: number;
        wouldSend?: number;
      };
      if (!res.ok) throw new Error("Failed to send statements.");
      if (data.mode === "preview") {
        setStatementStatus(
          `Preview mode only: no emails sent. ${data.wouldSend || 0} statement emails are queued for preview in ${quarterLabelFromKey(
            selectedStatementQuarter
          )}.`
        );
        return;
      }
      const stamp = new Date().toISOString();
      const nextLog = { ...quarterlyEmailLog, [selectedStatementQuarter]: stamp };
      setQuarterlyEmailLog(nextLog);
      localStorage.setItem(ADMIN_QUARTERLY_EMAIL_LOG_KEY, JSON.stringify(nextLog));
      setStatementStatus(
        `${mode === "auto" ? "Auto-send complete" : "Send complete"}: ${data.sent} sent, ${data.failed} failed for ${quarterLabelFromKey(
          selectedStatementQuarter
        )}.`
      );
    } catch {
      setStatementStatus("Quarterly statement send failed.");
    } finally {
      setSendingStatements(false);
    }
  }

  useEffect(() => {
    if (!authed) return;
    if (typeof window === "undefined") return;
    const prevKey = previousQuarterKey();
    if (selectedStatementQuarter !== prevKey) return;
    if (quarterlyEmailLog[prevKey]) return;
    if (!statementSendable.length) return;
    void sendQuarterlyStatements("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authed, selectedStatementQuarter, quarterlyEmailLog, statementSendable.length]);

  if (!authed) {
    return (
      <main className="mx-auto w-full max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_12px_28px_rgba(26,26,26,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">RTC Admin</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight">Manager Login</h2>
          <p className="mt-2 text-[13px] text-[#6b665e]">
            Enter your admin password to open the club operations dashboard.
          </p>
          <form onSubmit={handleLogin} className="mt-4 grid gap-2">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Open Dashboard
            </button>
            {loginMsg && <p className="text-[12px] text-[#7f1d1d]">{loginMsg}</p>}
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_12px_30px_rgba(26,26,26,0.05)] sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">RTC Admin Console</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">Club Management Dashboard</h2>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Full operations control for courts, members, lessons, clinics, events, payments, and pro payouts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setUseMockData((v) => !v)}
              className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
            >
              {useMockData ? "Mock Data: On" : "Mock Data: Off"}
            </button>
            <button
              type="button"
              onClick={signOut}
              className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
            >
              Sign out
            </button>
          </div>
        </div>

        {adminMsg && <p className="mt-3 rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[12px] text-[#2d5016]">{adminMsg}</p>}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Total Revenue</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(kpis.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Outstanding</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(kpis.outstanding)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Contractor Payouts</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(kpis.contractorPayouts)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Net After Payouts</p>
            <p className="mt-1 text-[22px] font-semibold">{formatCurrency(kpis.netAfterPayouts)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Active Members</p>
            <p className="mt-1 text-[22px] font-semibold">{kpis.membersActive}</p>
          </div>
        </div>

        {activeWorkspace === "overview" && (
          <div id="performance-overview" className="mt-5 grid gap-4 xl:grid-cols-3">
          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Seasonal Performance</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-[12px]">
                <thead className="text-[#8a8477]">
                  <tr>
                    <th className="py-1">Season</th>
                    <th className="py-1">Revenue</th>
                    <th className="py-1">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonal.map((row) => (
                    <tr key={row.label} className="border-t border-[#f0ede8]">
                      <td className="py-1.5">{row.label}</td>
                      <td className="py-1.5">{formatCurrency(row.revenue)}</td>
                      <td className="py-1.5">{row.visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Yearly Performance</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[280px] text-left text-[12px]">
                <thead className="text-[#8a8477]">
                  <tr>
                    <th className="py-1">Year</th>
                    <th className="py-1">Revenue</th>
                    <th className="py-1">Visits</th>
                  </tr>
                </thead>
                <tbody>
                  {yearly.map((row) => (
                    <tr key={row.year} className="border-t border-[#f0ede8]">
                      <td className="py-1.5">{row.year}</td>
                      <td className="py-1.5">{formatCurrency(row.revenue)}</td>
                      <td className="py-1.5">{row.visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Monthly Performance</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[360px] text-left text-[12px]">
                <thead className="text-[#8a8477]">
                  <tr>
                    <th className="py-1">Month</th>
                    <th className="py-1">Revenue</th>
                    <th className="py-1">Visits</th>
                    <th className="py-1">Pending</th>
                  </tr>
                </thead>
                <tbody>
                  {[...monthly].reverse().map((row) => (
                    <tr key={row.key} className="border-t border-[#f0ede8]">
                      <td className="py-1.5">{row.label}</td>
                      <td className="py-1.5">{formatCurrency(row.revenue)}</td>
                      <td className="py-1.5">{row.visits}</td>
                      <td className="py-1.5">{row.pending}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          </div>
        )}

        <div className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Workspace Navigation</p>
              <p className="mt-1 text-[12px] text-[#6b665e]">
                Open one focused workspace at a time to reduce clutter.
              </p>
            </div>
            <p className="text-[11px] text-[#8a8477]">
              Active:{" "}
              <span className="font-medium text-[#4a4a4a]">
                {activeWorkspace === "overview" && "Overview"}
                {activeWorkspace === "operations" && "Operations"}
                {activeWorkspace === "programs" && "Programs"}
                {activeWorkspace === "members" && "Members"}
                {activeWorkspace === "finance" && "Finance"}
              </span>
            </p>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["overview", "Overview", "KPI + performance + activity"],
                ["operations", "Operations", "Court controls + booking actions"],
                ["programs", "Programs", "Clinics + events monitoring"],
                ["members", "Members", "Directory + quarterly statements"],
                ["finance", "Finance", "Pro registry + payouts + 1099"],
              ] as Array<[AdminWorkspace, string, string]>
            ).map(([key, label, hint]) => {
              const active = activeWorkspace === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveWorkspace(key)}
                  className={`rounded-md border px-3 py-1.5 text-left text-[12px] transition-colors ${
                    active
                      ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                      : "border-[#d9d5cf] bg-white hover:bg-[#fdfcfb]"
                  }`}
                  title={hint}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {activeWorkspace === "operations" && (
          <div className="mt-5 grid gap-4 xl:grid-cols-3">
          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Court Control Panel</p>
            <form onSubmit={createCourtBlock} className="mt-3 grid gap-2">
              <input type="date" value={newBlock.date} onChange={(e) => setNewBlock((p) => ({ ...p, date: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <select value={newBlock.courtId} onChange={(e) => setNewBlock((p) => ({ ...p, courtId: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                {COURTS.map((court) => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={newBlock.startHour} onChange={(e) => setNewBlock((p) => ({ ...p, startHour: Number(e.target.value) }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  {HOURS.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                </select>
                <select value={newBlock.durationHours} onChange={(e) => setNewBlock((p) => ({ ...p, durationHours: Number(e.target.value) as 1 | 2 | 3 }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  <option value={1}>1 hr</option>
                  <option value={2}>2 hr</option>
                  <option value={3}>3 hr</option>
                </select>
              </div>
              <input value={newBlock.reason} onChange={(e) => setNewBlock((p) => ({ ...p, reason: e.target.value }))} placeholder="Reason (maintenance, event setup...)" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">Add Court Block</button>
            </form>
            <div className="mt-3 space-y-2">
              {adminBlocks.slice(0, 6).map((block) => (
                <div key={block.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                  <p className="font-medium">{COURTS.find((c) => c.id === block.courtId)?.name || block.courtId}</p>
                  <p className="text-[#6b665e]">{block.date} · {formatHour(block.startHour)} · {block.durationHours} hr</p>
                  <p className="text-[#8a8477]">{block.reason}</p>
                  <button type="button" onClick={() => removeCourtBlock(block.id)} className="mt-1 rounded border border-[#d9d5cf] px-2 py-0.5 text-[10px] hover:bg-white">Remove</button>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Manual Court Booking</p>
            <form onSubmit={createManualCourtBooking} className="mt-3 grid gap-2">
              <input type="date" value={manualBooking.date} onChange={(e) => setManualBooking((p) => ({ ...p, date: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <select value={manualBooking.courtId} onChange={(e) => setManualBooking((p) => ({ ...p, courtId: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                {COURTS.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select value={manualBooking.startHour} onChange={(e) => setManualBooking((p) => ({ ...p, startHour: Number(e.target.value) }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  {HOURS.map((hour) => <option key={hour} value={hour}>{formatHour(hour)}</option>)}
                </select>
                <select value={manualBooking.durationHours} onChange={(e) => setManualBooking((p) => ({ ...p, durationHours: Number(e.target.value) as 1 | 2 | 3 }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  <option value={1}>1 hr</option>
                  <option value={2}>2 hr</option>
                  <option value={3}>3 hr</option>
                </select>
              </div>
              <input value={manualBooking.clientName} onChange={(e) => setManualBooking((p) => ({ ...p, clientName: e.target.value }))} placeholder="Client name" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <input value={manualBooking.clientEmail} onChange={(e) => setManualBooking((p) => ({ ...p, clientEmail: e.target.value }))} placeholder="Client email" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <div className="grid grid-cols-2 gap-2">
                <input value={manualBooking.memberNumber} onChange={(e) => setManualBooking((p) => ({ ...p, memberNumber: e.target.value }))} placeholder="Member #" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
                <input value={manualBooking.totalAmount} onChange={(e) => setManualBooking((p) => ({ ...p, totalAmount: e.target.value }))} placeholder="Total amount" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              </div>
              <select value={manualBooking.paymentStatus} onChange={(e) => setManualBooking((p) => ({ ...p, paymentStatus: e.target.value as "paid" | "pending" }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">Create Booking</button>
            </form>
          </section>

          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Notes</p>
            <form onSubmit={saveMemberNote} className="mt-3 grid gap-2">
              <input value={noteForm.memberNumber} onChange={(e) => setNoteForm((p) => ({ ...p, memberNumber: e.target.value }))} placeholder="Member number" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <textarea value={noteForm.note} onChange={(e) => setNoteForm((p) => ({ ...p, note: e.target.value }))} rows={3} placeholder="Operational note, preference, follow-up..." className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">Save Note</button>
            </form>
            <div className="mt-3 space-y-2">
              {mergedData.notes.slice(0, 8).map((row) => (
                <div key={`${row.memberNumber}-${row.updatedAt}`} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                  <p className="font-medium">Member #{row.memberNumber}</p>
                  <p className="text-[#6b665e]">{row.note}</p>
                </div>
              ))}
            </div>
          </section>
          </div>
        )}

        {activeWorkspace === "programs" && (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <section id="clinics-monitor" className="rounded-xl border border-[#ece8e2] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics Monitor</p>
              <select
                value={selectedClinic}
                onChange={(e) => setSelectedClinic(e.target.value)}
                className="rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
              >
                {clinicOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 space-y-2">
              {visibleClinics.map((clinic) => (
                <div key={clinic.name} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3 text-[12px]">
                  <p className="font-medium">{clinic.name}</p>
                  <p className="text-[#6b665e]">
                    Signups: {clinic.signups} · Collected: {formatCurrency(clinic.revenue)} · Payment status: Paid at booking
                  </p>
                  <p className="mt-1 text-[#8a8477]">Signed up: {Array.from(clinic.attendees).join(", ") || "No signups yet."}</p>
                </div>
              ))}
              {visibleClinics.length === 0 && <p className="text-[12px] text-[#8a8477]">No clinic activity yet.</p>}
            </div>
          </section>

          <section id="events-monitor" className="rounded-xl border border-[#ece8e2] p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Events Monitor</p>
              <select
                value={selectedEvent}
                onChange={(e) => setSelectedEvent(e.target.value)}
                className="rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
              >
                {eventOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-3 space-y-2">
              {visibleEvents.map((event) => (
                <div key={event.title} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3 text-[12px]">
                  <p className="font-medium">{event.title}</p>
                  <p className="text-[#6b665e]">
                    Reservations: {event.bookings} · Total guests: {event.guests} · Collected: {formatCurrency(event.revenue)}
                  </p>
                  <p className="mt-1 text-[#8a8477]">Signed up: {Array.from(event.attendees).join(", ") || "No reservations yet."}</p>
                </div>
              ))}
              {visibleEvents.length === 0 && <p className="text-[12px] text-[#8a8477]">No event activity yet.</p>}
            </div>
          </section>
          </div>
        )}

        {activeWorkspace === "members" && (
          <section id="members-hub" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Membership Area</p>
          <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">All Members</p>
              <div className="mt-2 max-h-[360px] space-y-2 overflow-y-auto pr-1">
                {memberDirectory.map((member) => {
                  const active = selectedMember?.memberNumber === member.memberNumber;
                  return (
                    <button
                      key={member.memberNumber}
                      type="button"
                      onClick={() => setSelectedMemberNumber(member.memberNumber)}
                      className={`w-full rounded-lg border px-3 py-2 text-left text-[12px] ${
                        active
                          ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                          : "border-[#ece8e2] bg-[#faf9f7] hover:bg-white"
                      }`}
                    >
                      <p className="font-medium">
                        {member.name} · #{member.memberNumber}
                      </p>
                      <p className={active ? "text-white/80" : "text-[#6b665e]"}>
                        Total billed: {formatCurrency(member.totalSpend)} · Outstanding: {formatCurrency(member.outstanding)}
                      </p>
                    </button>
                  );
                })}
                {memberDirectory.length === 0 && <p className="text-[12px] text-[#8a8477]">No member records yet.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[#ece8e2] p-3 text-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Selected Member Detail</p>
              {selectedMember ? (
                <div className="mt-2 space-y-2">
                  <p className="font-medium">
                    {selectedMember.name} · Member #{selectedMember.memberNumber}
                  </p>
                  <p className="text-[#6b665e]">Email: {selectedMember.email || "Not available yet"}</p>
                  <p className="text-[#6b665e]">
                    Court bookings: {selectedMember.courtBookings} ({selectedMember.courtHours} hrs) · Lessons: {selectedMember.lessonRequests}
                  </p>
                  <p className="text-[#6b665e]">
                    Clinic signups: {selectedMember.clinicSignups} · Event guests: {selectedMember.eventReservations}
                  </p>
                  <p className="text-[#6b665e]">
                    Court billed: {formatCurrency(selectedMember.courtSpend)} · Clinic billed: {formatCurrency(selectedMember.clinicSpend)} · Event billed: {formatCurrency(selectedMember.eventSpend)}
                  </p>
                  <p className="text-[#6b665e]">
                    Total billed: {formatCurrency(selectedMember.totalSpend)} · Outstanding: {formatCurrency(selectedMember.outstanding)}
                  </p>
                  <p className="text-[#6b665e]">
                    Clinics: {selectedMember.clinics.length ? selectedMember.clinics.join(", ") : "None yet"}
                  </p>
                  <p className="text-[#6b665e]">
                    Events: {selectedMember.events.length ? selectedMember.events.join(", ") : "None yet"}
                  </p>
                  <p className="text-[#6b665e]">
                    Last activity: {selectedMember.lastActivity ? new Date(selectedMember.lastActivity).toLocaleString() : "No activity"}
                  </p>
                  <p className="text-[#8a8477]">Admin note: {selectedMember.note || "No admin note saved"}</p>
                </div>
              ) : (
                <p className="mt-2 text-[#8a8477]">Select a member to view details.</p>
              )}
            </div>
          </div>
          </section>
        )}

        {activeWorkspace === "finance" && (
          <section id="pro-registry" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Pro Profile Registry (1099 Readiness)</p>
          <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <form onSubmit={saveProProfile} className="grid gap-2 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
              <input
                value={proProfileForm.displayName}
                onChange={(e) => setProProfileForm((p) => ({ ...p, displayName: e.target.value }))}
                list="pro-display-name-options"
                placeholder="Display name used in payouts"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
              />
              <datalist id="pro-display-name-options">
                {proNameOptions.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
              <input
                value={proProfileForm.legalName}
                onChange={(e) => setProProfileForm((p) => ({ ...p, legalName: e.target.value }))}
                placeholder="Legal name (for 1099)"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
              />
              <input
                value={proProfileForm.email}
                onChange={(e) => setProProfileForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="Payout contact email"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
              />
              <input
                value={proProfileForm.address}
                onChange={(e) => setProProfileForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Mailing address"
                className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={proProfileForm.taxIdLast4}
                  onChange={(e) =>
                    setProProfileForm((p) => ({ ...p, taxIdLast4: e.target.value.replace(/\D/g, "").slice(0, 4) }))
                  }
                  placeholder="Tax ID last 4"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <label className="flex items-center gap-2 rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  <input
                    type="checkbox"
                    checked={proProfileForm.w9OnFile}
                    onChange={(e) => setProProfileForm((p) => ({ ...p, w9OnFile: e.target.checked }))}
                  />
                  W-9 on file
                </label>
              </div>
              <label className="flex items-center gap-2 rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                <input
                  type="checkbox"
                  checked={proProfileForm.active}
                  onChange={(e) => setProProfileForm((p) => ({ ...p, active: e.target.checked }))}
                />
                Active pro
              </label>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
                Save Pro Profile
              </button>
            </form>

            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Compliance Snapshot ({selectedTaxYear})</p>
              <div className="mt-2 space-y-2">
                {proCompliance.map((pro) => (
                  <div key={pro.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                    <p className="font-medium">
                      {pro.displayName} {pro.active ? "" : "(Inactive)"}
                    </p>
                    <p className="text-[#6b665e]">Legal: {pro.legalName || "Not set"}</p>
                    <p className="text-[#6b665e]">Tax ID last4: {pro.taxIdLast4 || "Not set"} · W-9: {pro.w9OnFile ? "On file" : "Missing"}</p>
                    <p className="text-[#6b665e]">
                      {selectedTaxYear} payout total: {formatCurrency(pro.yearTotal)} · 1099: {pro.needs1099 ? "Likely required" : "Below threshold"}
                    </p>
                  </div>
                ))}
                {proCompliance.length === 0 && <p className="text-[12px] text-[#8a8477]">No pro profiles yet.</p>}
              </div>
            </div>
          </div>
          </section>
        )}

        {activeWorkspace === "members" && (
          <section id="quarterly-statements" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Quarterly Member Statements</p>
            <div className="flex items-center gap-2">
              <select
                value={selectedStatementQuarter}
                onChange={(e) => setSelectedStatementQuarter(e.target.value)}
                className="rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
              >
                {statementQuarterOptions.map((key) => (
                  <option key={key} value={key}>
                    {quarterLabelFromKey(key)}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void sendQuarterlyStatements("manual")}
                disabled={sendingStatements}
                className="rounded-lg border border-[#d9d5cf] px-3 py-1.5 text-[12px] font-medium hover:bg-[#faf9f7] disabled:opacity-50"
              >
                {sendingStatements ? "Sending..." : "Send Statements Now"}
              </button>
            </div>
          </div>
          <p className="mt-2 text-[12px] text-[#6b665e]">
            Auto-send runs once when the dashboard opens after quarter close for {quarterLabelFromKey(previousQuarterKey())}.
            Last send for selected quarter: {quarterlyEmailLog[selectedStatementQuarter] ? new Date(quarterlyEmailLog[selectedStatementQuarter]).toLocaleString() : "Not sent yet"}.
            Quarterly emails are currently in preview mode until `RTC_ENABLE_STATEMENT_EMAILS=true` is added.
          </p>
          {statementStatus && <p className="mt-2 text-[12px] text-[#2d5016]">{statementStatus}</p>}
          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Ready to Email ({statementSendable.length})</p>
              <div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto">
                {statementSendable.map((row) => (
                  <div key={row.memberNumber} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                    <p className="font-medium">
                      {row.memberName} · #{row.memberNumber}
                    </p>
                    <p className="text-[#6b665e]">{row.memberEmail}</p>
                    <p className="text-[#6b665e]">
                      Billed {formatCurrency(row.totalBilled)} · Paid {formatCurrency(row.totalPaid)} · Outstanding {formatCurrency(row.outstanding)}
                    </p>
                  </div>
                ))}
                {statementSendable.length === 0 && <p className="text-[12px] text-[#8a8477]">No sendable statements this quarter.</p>}
              </div>
            </div>
            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Missing Email ({statementMissingEmail.length})</p>
              <div className="mt-2 max-h-[240px] space-y-2 overflow-y-auto">
                {statementMissingEmail.map((row) => (
                  <div key={row.memberNumber} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                    <p className="font-medium">
                      {row.memberName} · #{row.memberNumber}
                    </p>
                    <p className="text-[#6b665e]">No email found in member profile.</p>
                  </div>
                ))}
                {statementMissingEmail.length === 0 && <p className="text-[12px] text-[#8a8477]">All active quarterly statements have an email.</p>}
              </div>
            </div>
          </div>
          </section>
        )}

        {activeWorkspace === "finance" && (
          <div id="payouts-1099" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Pro Payout + 1099 Tracking</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={selectedTaxYear}
                onChange={(e) => setSelectedTaxYear(Number(e.target.value) || new Date().getFullYear())}
                className="w-24 rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
              />
              <button type="button" onClick={export1099Csv} className="rounded-lg border border-[#d9d5cf] px-3 py-1.5 text-[12px] font-medium hover:bg-[#faf9f7]">
                Export 1099 CSV
              </button>
            </div>
          </div>

          <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
            <form onSubmit={recordProPayout} className="grid gap-2 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
              <select value={payoutForm.proName} onChange={(e) => setPayoutForm((p) => ({ ...p, proName: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                {proNameOptions.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <input value={payoutForm.amount} onChange={(e) => setPayoutForm((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
                <input type="date" value={payoutForm.payDate} onChange={(e) => setPayoutForm((p) => ({ ...p, payDate: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <select value={payoutForm.method} onChange={(e) => setPayoutForm((p) => ({ ...p, method: e.target.value as ProPayout["method"] }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  <option value="check">Check</option>
                  <option value="ach">ACH</option>
                  <option value="cash">Cash</option>
                  <option value="other">Other</option>
                </select>
                <select value={payoutForm.category} onChange={(e) => setPayoutForm((p) => ({ ...p, category: e.target.value as ProPayout["category"] }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                  <option value="clinic">Clinic</option>
                  <option value="lesson">Lesson</option>
                  <option value="event">Event</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <input value={payoutForm.notes} onChange={(e) => setPayoutForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes (optional)" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
                Record Payout
              </button>
            </form>

            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Tax Year Summary</p>
              <div className="mt-2 space-y-2">
                {payoutSummary.map((row) => (
                  <div key={row.proName} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                    <p className="font-medium">{row.proName}</p>
                    <p className="text-[#6b665e]">
                      {row.count} payouts · {formatCurrency(row.total)}
                    </p>
                  </div>
                ))}
                {payoutSummary.length === 0 && <p className="text-[12px] text-[#8a8477]">No payouts recorded for {selectedTaxYear}.</p>}
              </div>
            </div>
          </div>
          </div>
        )}

        {(activeWorkspace === "overview" || activeWorkspace === "operations") && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Recent Activity Feed</p>
            <div className="mt-3 space-y-2">
              {recentActivity.map((row, idx) => (
                <div key={`${row.label}-${idx}`} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                  <p className="font-medium">{row.label}</p>
                  <p className="text-[#6b665e]">{row.detail}</p>
                  <p className="text-[#8a8477]">{new Date(row.at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Manage Court Bookings</p>
            <div className="mt-3 space-y-2">
              {courtBookings.slice(0, 12).map((booking) => (
                <div key={booking.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                  <p className="font-medium">{booking.clientName} · {booking.courtName}</p>
                  <p className="text-[#6b665e]">
                    {booking.date} · {formatHour(booking.blockStartHour)} · {booking.durationHours} hr · {formatCurrency(booking.totalAmount)}
                  </p>
                  <div className="mt-1 flex gap-2">
                    <button
                      type="button"
                      onClick={() => markCourtBookingPaid(booking.id)}
                      className="rounded border border-[#d9d5cf] px-2 py-0.5 text-[10px] hover:bg-white"
                    >
                      Mark Paid
                    </button>
                    <button
                      type="button"
                      onClick={() => cancelCourtBooking(booking.id)}
                      className="rounded border border-[#e6cccc] px-2 py-0.5 text-[10px] text-[#7f1d1d] hover:bg-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
              {courtBookings.length === 0 && (
                <p className="text-[12px] text-[#8a8477]">No live court bookings available yet.</p>
              )}
            </div>
          </div>
          </div>
        )}
      </div>
    </main>
  );
}
