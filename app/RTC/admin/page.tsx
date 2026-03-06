"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { rtcClinicCourtBlocks, rtcClinics, rtcCoaches } from "../rtc-data";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";
const ADMIN_COURT_BLOCKS_KEY = "rtc_admin_court_blocks_v1";
const ADMIN_MEMBER_NOTES_KEY = "rtc_admin_member_notes_v1";
const ADMIN_PRO_PAYOUTS_KEY = "rtc_admin_pro_payouts_v1";
const ADMIN_PRO_PROFILES_KEY = "rtc_admin_pro_profiles_v1";
const ADMIN_QUARTERLY_EMAIL_LOG_KEY = "rtc_admin_quarterly_email_log_v1";
const ADMIN_MARKETING_CAMPAIGNS_KEY = "rtc_admin_marketing_campaigns_v1";

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
  amountCharged?: number;
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
  courtBookings: number;
  lessonRequests: number;
  clinicBookings: number;
  eventReservations: number;
  courtRevenue: number;
  clinicRevenue: number;
  eventRevenue: number;
  totalRevenue: number;
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

type MarketingChannel = "email" | "facebook" | "instagram" | "google";
type MarketingAudience = "members" | "nonmembers" | "all";
type MarketingTarget = "events" | "clinics" | "lessons" | "open-courts" | "membership";
type MarketingRecipientMode = "list" | "specific";

type MarketingCampaign = {
  id: string;
  name: string;
  target: MarketingTarget;
  audience: MarketingAudience;
  recipientMode: MarketingRecipientMode;
  selectedRecipients: string[];
  channels: MarketingChannel[];
  subject: string;
  message: string;
  facebookCopy: string;
  instagramCopy: string;
  googleCopy: string;
  status: "draft" | "launched";
  createdAt: string;
  launchedAt?: string;
  recipientCount: number;
};

type AdminWorkspace = "overview" | "operations" | "programs" | "members" | "finance" | "marketing";

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
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
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
  const year = now.getFullYear();
  const month = now.getMonth() + monthOffset;
  const maxDay = new Date(year, month + 1, 0).getDate();
  const safeDay = Math.min(Math.max(day, 1), maxDay);
  const dt = new Date(year, month, safeDay, hour, 0, 0, 0);
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

function parseCoachRate(coachName: string): number {
  const coach = rtcCoaches.find((item) => item.name === coachName);
  if (!coach) return 150;
  const raw = Number((coach.rate || "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(raw) && raw > 0 ? raw : 150;
}

function titleCase(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMarketingDraft(target: MarketingTarget, campaignName: string) {
  const cleanName = titleCase(campaignName || "RTC Update");
  const targetLabel =
    target === "open-courts"
      ? "Open Court Times"
      : target === "lessons"
      ? "Private Lessons"
      : target === "clinics"
      ? "Clinics"
      : target === "events"
      ? "Events"
      : "Membership";
  const subject = `${cleanName} - ${targetLabel} at Rhinebeck Tennis Club`;
  const message = `Hi from Rhinebeck Tennis Club,\n\n${cleanName} is now available. Reply to this message if you want help reserving your preferred ${targetLabel.toLowerCase()} option.\n\nSee details and book directly through your RTC portal.\n\n- RTC Team`;
  const facebookCopy = `${cleanName} is live at Rhinebeck Tennis Club. ${targetLabel} spots are now open. Message us to reserve your preferred time.`;
  const instagramCopy = `${cleanName} at RTC 🎾\n${targetLabel} options are now open.\nDM us to reserve your spot. #rhinebecktennis #hudsonvalley`;
  const googleCopy = `${cleanName} is now available at Rhinebeck Tennis Club. View current ${targetLabel.toLowerCase()} availability and book online today.`;
  return { subject, message, facebookCopy, instagramCopy, googleCopy };
}

function createMockData() {
  const courts: CourtBooking[] = [];
  const lessons: LessonBooking[] = [];
  const clinics: ClinicBooking[] = [];
  const events: EventReservation[] = [];
  const payouts: ProPayout[] = [];
  const proProfiles: ProProfile[] = [];
  const campaigns: MarketingCampaign[] = [];
  const notes: MemberNote[] = [
    { memberNumber: "101", note: "Prefers indoor evening slots.", updatedAt: makeDate(-1, 11) },
    { memberNumber: "318", note: "Interested in recurring Sunday clinics.", updatedAt: makeDate(-2, 8) },
  ];
  const coaches = rtcCoaches.map((coach) => coach.name);
  const clinicCatalog = rtcClinics.map((clinic) => {
    const member = Number(clinic.memberPrice.replace(/[^0-9.]/g, "")) || 75;
    const publicRate = Number(clinic.publicPrice.replace(/[^0-9.]/g, "")) || member + 15;
    return { name: clinic.name, member, publicRate };
  });
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
    const month = dt.getMonth();
    const peakSeason = month >= 4 && month <= 8;
    const maintenanceWindow = month <= 1 || month === 11;
    const lessonLoad = peakSeason ? 4 + mod(i + month, 4) : 2 + mod(i + month, 3);
    for (let l = 0; l < lessonLoad; l += 1) {
      const lessonMember = members[mod(i * 2 + l + 2, members.length)];
      const lessonCoach = coaches[mod(i + l, coaches.length)];
      const lessonHour = 8 + mod(i * 3 + l * 2, 9);
      const lessonDay = 4 + mod(i * 5 + l * 7, 24);
      lessons.push({
        id: `mock-lesson-${i}-${l}`,
        coachName: lessonCoach,
        slot: `${["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][mod(i + l, 6)]} ${formatHour(lessonHour)}`,
        clientName: lessonMember.name,
        clientEmail: lessonMember.email,
        memberNumber: lessonMember.number,
        amountCharged: Math.max(95, parseCoachRate(lessonCoach) - 20 + mod(i + l, 4) * 5),
        createdAt: makeDate(i, lessonDay, lessonHour),
      });
    }
    const clinicEntries = Math.max(
      0,
      (peakSeason ? 2 : 1) + mod(i + month, peakSeason ? 3 : 2) - (maintenanceWindow && mod(i, 4) === 0 ? 1 : 0)
    );
    for (let k = 0; k < clinicEntries; k += 1) {
      const clinicMember = members[mod(i + 3 + k, members.length)];
      const clinicTemplate = clinicCatalog[mod(i * 3 + k + month, clinicCatalog.length)];
      const usesPublicRate = mod(i + month + k, 4) === 0;
      const baseRate = usesPublicRate ? clinicTemplate.publicRate : clinicTemplate.member;
      const priceAdjust = (mod(i * 7 + k * 5 + month, 5) - 2) * 3;
      clinics.push({
        id: `mock-clinic-${i}-${k}`,
        clinicNames: [clinicTemplate.name],
        clinicCount: 1,
        total: Math.max(55, baseRate + priceAdjust),
        clientName: clinicMember.name,
        memberNumber: clinicMember.number,
        createdAt: makeDate(i, 11 + (k % 8)),
      });
    }
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

  campaigns.push(
    {
      id: "mock-campaign-clinics-spring",
      name: "Spring Clinic Push",
      target: "clinics",
      audience: "all",
      recipientMode: "list",
      selectedRecipients: [],
      channels: ["email", "facebook", "instagram"],
      subject: "Spring clinic sessions now open at RTC",
      message:
        "Join us this week for clinic sessions at RTC. Reply if you want us to reserve your preferred day/time.",
      facebookCopy:
        "Spring clinic sessions are now open at Rhinebeck Tennis Club. Reserve your preferred day and time now.",
      instagramCopy:
        "Spring clinics are open at RTC 🎾\nReserve your preferred day/time now.\n#rhinebecktennis",
      googleCopy:
        "Spring clinics now open at Rhinebeck Tennis Club. View availability and reserve online.",
      status: "launched",
      createdAt: makeDate(-2, 3),
      launchedAt: makeDate(-2, 4),
      recipientCount: 148,
    },
    {
      id: "mock-campaign-open-courts-evening",
      name: "Evening Open Courts",
      target: "open-courts",
      audience: "members",
      recipientMode: "list",
      selectedRecipients: [],
      channels: ["email", "google"],
      subject: "Evening open-court windows this week",
      message: "Several evening court windows are currently open. Book directly in the RTC court grid.",
      facebookCopy: "Evening open-court windows available now at RTC.",
      instagramCopy: "Evening open-court windows available now at RTC 🎾",
      googleCopy: "Evening open-court windows available now at Rhinebeck Tennis Club.",
      status: "draft",
      createdAt: makeDate(-1, 18),
      recipientCount: 0,
    }
  );

  return { courts, lessons, clinics, events, payouts, notes, proProfiles, campaigns };
}

export default function RTCAdminPage() {
  const [adminMsg, setAdminMsg] = useState<string | null>(null);

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([]);
  const [lessonBookings, setLessonBookings] = useState<LessonBooking[]>([]);
  const [clinicBookings, setClinicBookings] = useState<ClinicBooking[]>([]);
  const [eventReservations, setEventReservations] = useState<EventReservation[]>([]);
  const [adminBlocks, setAdminBlocks] = useState<AdminCourtBlock[]>([]);
  const [memberNotes, setMemberNotes] = useState<MemberNote[]>([]);
  const [proPayouts, setProPayouts] = useState<ProPayout[]>([]);
  const [proProfiles, setProProfiles] = useState<ProProfile[]>([]);
  const [marketingCampaigns, setMarketingCampaigns] = useState<MarketingCampaign[]>([]);
  const [quarterlyEmailLog, setQuarterlyEmailLog] = useState<Record<string, string>>({});
  const [useMockData, setUseMockData] = useState(true);
  const [selectedTaxYear, setSelectedTaxYear] = useState(new Date().getFullYear());
  const [selectedStatementQuarter, setSelectedStatementQuarter] = useState(previousQuarterKey());
  const [statementStatus, setStatementStatus] = useState<string | null>(null);
  const [sendingStatements, setSendingStatements] = useState(false);
  const [activeWorkspace, setActiveWorkspace] = useState<AdminWorkspace>("overview");
  const [performanceView, setPerformanceView] = useState<"monthly" | "seasonal" | "yearly">("monthly");
  const [selectedClinic, setSelectedClinic] = useState("All Clinics");
  const [selectedEvent, setSelectedEvent] = useState("All Events");
  const [selectedLessonCoach, setSelectedLessonCoach] = useState("All Pros");
  const [selectedLessonYear, setSelectedLessonYear] = useState(new Date().getFullYear());
  const [selectedLessonDetailCoach, setSelectedLessonDetailCoach] = useState<string | null>(null);
  const [selectedMemberNumber, setSelectedMemberNumber] = useState<string | null>(null);
  const [selectedMemberDetailTab, setSelectedMemberDetailTab] = useState<
    "courts" | "clinics" | "events" | "lessons"
  >("courts");
  const [selectedFinanceProName, setSelectedFinanceProName] = useState<string | null>(null);
  const [quickJumpQuery, setQuickJumpQuery] = useState("");
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

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
  const [marketingForm, setMarketingForm] = useState({
    name: "",
    target: "events" as MarketingTarget,
    audience: "all" as MarketingAudience,
    recipientMode: "list" as MarketingRecipientMode,
    selectedRecipients: [] as string[],
    channels: ["email"] as MarketingChannel[],
    subject: "",
    message: "",
    facebookCopy: "",
    instagramCopy: "",
    googleCopy: "",
  });
  const [marketingRecipientSearch, setMarketingRecipientSearch] = useState("");

  const loadLiveData = useCallback(() => {
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
    setMarketingCampaigns(
      safeParse<MarketingCampaign[]>(localStorage.getItem(ADMIN_MARKETING_CAMPAIGNS_KEY), [])
    );
    setQuarterlyEmailLog(
      safeParse<Record<string, string>>(localStorage.getItem(ADMIN_QUARTERLY_EMAIL_LOG_KEY), {})
    );
    setLastSyncedAt(new Date().toISOString());
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadLiveData();
  }, [loadLiveData]);

  useEffect(() => {
    if (!adminMsg) return;
    const timer = window.setTimeout(() => setAdminMsg(null), 3200);
    return () => window.clearTimeout(timer);
  }, [adminMsg]);

  useEffect(() => {
    if (selectedLessonCoach === "All Pros") return;
    setSelectedLessonDetailCoach(selectedLessonCoach);
  }, [selectedLessonCoach]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const liveKeys = new Set([
      COURT_KEY,
      LESSON_KEY,
      CLINIC_KEY,
      EVENT_KEY,
      ADMIN_COURT_BLOCKS_KEY,
      ADMIN_MEMBER_NOTES_KEY,
      ADMIN_PRO_PAYOUTS_KEY,
      ADMIN_PRO_PROFILES_KEY,
      ADMIN_MARKETING_CAMPAIGNS_KEY,
      ADMIN_QUARTERLY_EMAIL_LOG_KEY,
    ]);
    const onStorage = (event: StorageEvent) => {
      if (!event.key || liveKeys.has(event.key)) loadLiveData();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [loadLiveData]);

  useEffect(() => {
    if (!autoRefreshEnabled || typeof window === "undefined") return;
    const timer = window.setInterval(() => loadLiveData(), 15000);
    return () => window.clearInterval(timer);
  }, [autoRefreshEnabled, loadLiveData]);

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
      campaigns: useMockData ? [...mock.campaigns, ...marketingCampaigns] : marketingCampaigns,
    };
  }, [
    courtBookings,
    lessonBookings,
    clinicBookings,
    eventReservations,
    proPayouts,
    memberNotes,
    proProfiles,
    marketingCampaigns,
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
    const periods: Array<{
      start: Date;
      end: Date;
      stat: MonthStat;
    }> = [];
    const now = new Date();
    for (let i = -11; i <= 0; i += 1) {
      const start = new Date(now.getFullYear(), now.getMonth() + i, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + i + 1, 0, 23, 59, 59, 999);
      periods.push({
        start,
        end,
        stat: {
          key: monthKey(start),
          label: monthLabel(start),
          courtBookings: 0,
          lessonRequests: 0,
          clinicBookings: 0,
          eventReservations: 0,
          courtRevenue: 0,
          clinicRevenue: 0,
          eventRevenue: 0,
          totalRevenue: 0,
        },
      });
    }
    const findPeriod = (at: Date) =>
      periods.find((period) => at.getTime() >= period.start.getTime() && at.getTime() <= period.end.getTime());

    mergedData.courts.forEach((item) => {
      const at = new Date(item.createdAt || `${item.date}T12:00:00`);
      if (!Number.isFinite(at.getTime())) return;
      const period = findPeriod(at);
      if (!period) return;
      const amount = item.totalAmount || 0;
      period.stat.courtBookings += 1;
      period.stat.courtRevenue += amount;
      period.stat.totalRevenue += amount;
    });
    mergedData.clinics.forEach((item) => {
      const at = new Date(item.createdAt);
      if (!Number.isFinite(at.getTime())) return;
      const period = findPeriod(at);
      if (!period) return;
      const amount = item.total || 0;
      period.stat.clinicBookings += 1;
      period.stat.clinicRevenue += amount;
      period.stat.totalRevenue += amount;
    });
    mergedData.events.forEach((item) => {
      const at = new Date(item.createdAt);
      if (!Number.isFinite(at.getTime())) return;
      const period = findPeriod(at);
      if (!period) return;
      const amount = item.total || 0;
      period.stat.eventReservations += 1;
      period.stat.eventRevenue += amount;
      period.stat.totalRevenue += amount;
    });
    mergedData.lessons.forEach((item) => {
      const at = new Date(item.createdAt);
      if (!Number.isFinite(at.getTime())) return;
      const period = findPeriod(at);
      if (!period) return;
      period.stat.lessonRequests += 1;
    });
    return periods.map((period) => period.stat);
  }, [mergedData]);

  const seasonal = useMemo(() => {
    const map = new Map<
      string,
      Omit<MonthStat, "key" | "label"> & { label: string }
    >();
    monthly.forEach((month) => {
      const dt = new Date(`${month.key}-01T12:00:00`);
      const label = `${seasonLabel(dt)} ${dt.getFullYear()}`;
      if (!map.has(label))
        map.set(label, {
          label,
          courtBookings: 0,
          lessonRequests: 0,
          clinicBookings: 0,
          eventReservations: 0,
          courtRevenue: 0,
          clinicRevenue: 0,
          eventRevenue: 0,
          totalRevenue: 0,
        });
      const row = map.get(label)!;
      row.courtBookings += month.courtBookings;
      row.lessonRequests += month.lessonRequests;
      row.clinicBookings += month.clinicBookings;
      row.eventReservations += month.eventReservations;
      row.courtRevenue += month.courtRevenue;
      row.clinicRevenue += month.clinicRevenue;
      row.eventRevenue += month.eventRevenue;
      row.totalRevenue += month.totalRevenue;
    });
    return Array.from(map.values()).slice(-6);
  }, [monthly]);

  const yearly = useMemo(() => {
    const map = new Map<
      number,
      Omit<MonthStat, "key" | "label"> & { year: number }
    >();
    monthly.forEach((month) => {
      const dt = new Date(`${month.key}-01T12:00:00`);
      const year = dt.getFullYear();
      if (!map.has(year))
        map.set(year, {
          year,
          courtBookings: 0,
          lessonRequests: 0,
          clinicBookings: 0,
          eventReservations: 0,
          courtRevenue: 0,
          clinicRevenue: 0,
          eventRevenue: 0,
          totalRevenue: 0,
        });
      const row = map.get(year)!;
      row.courtBookings += month.courtBookings;
      row.lessonRequests += month.lessonRequests;
      row.clinicBookings += month.clinicBookings;
      row.eventReservations += month.eventReservations;
      row.courtRevenue += month.courtRevenue;
      row.clinicRevenue += month.clinicRevenue;
      row.eventRevenue += month.eventRevenue;
      row.totalRevenue += month.totalRevenue;
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
    // Ensure all clinic programs appear even with zero bookings.
    rtcClinics.forEach((clinic) => {
      map.set(clinic.name, {
        name: clinic.name,
        signups: 0,
        revenue: 0,
        attendees: new Set<string>(),
      });
    });
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
  const lessonMonitor = useMemo(() => {
    const rows = new Map<
      string,
      {
        coachName: string;
        lessons: number;
        members: Set<string>;
        memberCounts: Map<string, number>;
      }
    >();
    rtcCoaches.forEach((coach) => {
      rows.set(coach.name, {
        coachName: coach.name,
        lessons: 0,
        members: new Set<string>(),
        memberCounts: new Map<string, number>(),
      });
    });
    mergedData.lessons.forEach((lesson) => {
      const at = new Date(lesson.createdAt);
      if (!Number.isFinite(at.getTime()) || at.getFullYear() !== selectedLessonYear) return;
      const key = lesson.coachName || "Unassigned";
      const row =
        rows.get(key) || { coachName: key, lessons: 0, members: new Set<string>(), memberCounts: new Map<string, number>() };
      const member = lesson.memberNumber ? `${lesson.clientName} (#${lesson.memberNumber})` : lesson.clientName;
      row.lessons += 1;
      row.members.add(member);
      row.memberCounts.set(member, (row.memberCounts.get(member) || 0) + 1);
      rows.set(key, row);
    });
    return Array.from(rows.values())
      .map((row) => {
        const topMembers = Array.from(row.memberCounts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([name, count]) => `${name} (${count})`);
        return {
          coachName: row.coachName,
          lessons: row.lessons,
          uniqueMembers: row.members.size,
          avgPerWeek: row.lessons / 52,
          topMembers,
        };
      })
      .sort((a, b) => b.lessons - a.lessons);
  }, [mergedData.lessons, selectedLessonYear]);
  const lessonMemberLeaderboard = useMemo(() => {
    const rows = new Map<string, { member: string; lessons: number; pros: Set<string> }>();
    mergedData.lessons.forEach((lesson) => {
      const at = new Date(lesson.createdAt);
      if (!Number.isFinite(at.getTime()) || at.getFullYear() !== selectedLessonYear) return;
      const member = lesson.memberNumber ? `${lesson.clientName} (#${lesson.memberNumber})` : lesson.clientName;
      const row = rows.get(member) || { member, lessons: 0, pros: new Set<string>() };
      row.lessons += 1;
      row.pros.add(lesson.coachName);
      rows.set(member, row);
    });
    return Array.from(rows.values())
      .map((row) => ({ member: row.member, lessons: row.lessons, pros: row.pros.size }))
      .sort((a, b) => b.lessons - a.lessons)
      .slice(0, 8);
  }, [mergedData.lessons, selectedLessonYear]);
  const lessonYearOptions = useMemo(() => {
    const years = new Set<number>([new Date().getFullYear()]);
    mergedData.lessons.forEach((lesson) => {
      const year = new Date(lesson.createdAt).getFullYear();
      if (Number.isFinite(year)) years.add(year);
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [mergedData.lessons]);
  const nextWeekClinics = useMemo(() => {
    const now = new Date();
    const currentWeekday = now.getDay();
    const daysUntilNextMonday = ((8 - currentWeekday) % 7) || 7;
    const nextMonday = new Date(now);
    nextMonday.setHours(0, 0, 0, 0);
    nextMonday.setDate(nextMonday.getDate() + daysUntilNextMonday);
    const rows = rtcClinics
      .map((clinic) => {
        const block = rtcClinicCourtBlocks[clinic.name];
        if (!block) return null;
        const date = new Date(nextMonday);
        date.setDate(nextMonday.getDate() + ((block.weekday + 6) % 7));
        date.setHours(block.startHour, 0, 0, 0);
        return {
          name: clinic.name,
          dateLabel: date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }),
          timeLabel: formatHour(block.startHour),
          level: clinic.level,
          sortAt: date.getTime(),
        };
      })
      .filter(
        (row): row is { name: string; dateLabel: string; timeLabel: string; level: string; sortAt: number } =>
          Boolean(row)
      )
      .sort((a, b) => a.sortAt - b.sortAt)
      .map(({ sortAt: _sortAt, ...rest }) => rest);
    return rows;
  }, []);
  const clinicPerformance = useMemo(() => {
    const monthKeys = new Set(monthly.map((row) => row.key));
    const monthCount = Math.max(monthKeys.size, 1);
    const byClinic = new Map<
      string,
      {
        name: string;
        signups: number;
        revenue: number;
        memberCounts: Map<string, number>;
      }
    >();
    rtcClinics.forEach((clinic) => {
      byClinic.set(clinic.name, { name: clinic.name, signups: 0, revenue: 0, memberCounts: new Map() });
    });
    mergedData.clinics.forEach((booking) => {
      const createdMonthKey = monthKey(new Date(booking.createdAt));
      if (!monthKeys.has(createdMonthKey)) return;
      booking.clinicNames.forEach((clinicName) => {
        const row =
          byClinic.get(clinicName) || { name: clinicName, signups: 0, revenue: 0, memberCounts: new Map<string, number>() };
        row.signups += 1;
        row.revenue += booking.total / Math.max(booking.clinicNames.length, 1);
        const memberKey = booking.memberNumber ? `${booking.clientName} (#${booking.memberNumber})` : booking.clientName;
        row.memberCounts.set(memberKey, (row.memberCounts.get(memberKey) || 0) + 1);
        byClinic.set(clinicName, row);
      });
    });
    return Array.from(byClinic.values())
      .map((row) => {
        const topMember = Array.from(row.memberCounts.entries()).sort((a, b) => b[1] - a[1])[0];
        return {
          name: row.name,
          signups: row.signups,
          avgSignupsPerMonth: row.signups / monthCount,
          revenue: row.revenue,
          topMember: topMember ? `${topMember[0]} (${topMember[1]})` : "No repeat data yet",
        };
      })
      .sort((a, b) => b.signups - a.signups);
  }, [mergedData.clinics, monthly]);
  const clinicMemberLeaderboard = useMemo(() => {
    const monthKeys = new Set(monthly.map((row) => row.key));
    const map = new Map<string, { member: string; visits: number; clinics: Set<string> }>();
    mergedData.clinics.forEach((booking) => {
      const createdMonthKey = monthKey(new Date(booking.createdAt));
      if (!monthKeys.has(createdMonthKey)) return;
      const member = booking.memberNumber ? `${booking.clientName} (#${booking.memberNumber})` : booking.clientName;
      const row = map.get(member) || { member, visits: 0, clinics: new Set<string>() };
      row.visits += 1;
      booking.clinicNames.forEach((clinicName) => row.clinics.add(clinicName));
      map.set(member, row);
    });
    return Array.from(map.values())
      .map((row) => ({ member: row.member, visits: row.visits, clinicTypes: row.clinics.size }))
      .sort((a, b) => b.visits - a.visits)
      .slice(0, 8);
  }, [mergedData.clinics, monthly]);

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
  const selectedMemberYearlyDetails = useMemo(() => {
    const memberNumber = selectedMember?.memberNumber;
    const currentYear = new Date().getFullYear();
    if (!memberNumber) {
      return {
        year: currentYear,
        courts: [] as CourtBooking[],
        clinics: [] as ClinicBooking[],
        events: [] as EventReservation[],
        lessons: [] as LessonBooking[],
      };
    }
    const inYear = (dateValue: string) => {
      const dt = new Date(dateValue);
      return Number.isFinite(dt.getTime()) && dt.getFullYear() === currentYear;
    };
    const courts = mergedData.courts
      .filter((item) => item.memberNumber === memberNumber)
      .filter((item) => inYear(item.createdAt || `${item.date}T12:00:00`))
      .sort(
        (a, b) =>
          new Date(b.createdAt || `${b.date}T12:00:00`).getTime() -
          new Date(a.createdAt || `${a.date}T12:00:00`).getTime()
      );
    const clinics = mergedData.clinics
      .filter((item) => item.memberNumber === memberNumber)
      .filter((item) => inYear(item.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const events = mergedData.events
      .filter((item) => item.memberNumber === memberNumber)
      .filter((item) => inYear(item.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lessons = mergedData.lessons
      .filter((item) => item.memberNumber === memberNumber)
      .filter((item) => inYear(item.createdAt))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return { year: currentYear, courts, clinics, events, lessons };
  }, [mergedData, selectedMember]);

  const clinicOptions = useMemo(
    () => ["All Clinics", ...clinicMonitor.map((c) => c.name)],
    [clinicMonitor]
  );
  const eventOptions = useMemo(
    () => ["All Events", ...eventMonitor.map((e) => e.title)],
    [eventMonitor]
  );
  const lessonOptions = useMemo(
    () => ["All Pros", ...lessonMonitor.map((row) => row.coachName)],
    [lessonMonitor]
  );
  const marketingAudience = useMemo(() => {
    const memberEmails = new Set<string>();
    memberDirectory.forEach((member) => {
      const email = member.email.trim().toLowerCase();
      if (email) memberEmails.add(email);
    });
    const nonMemberEmails = new Set<string>();
    mergedData.courts.forEach((booking) => {
      if (booking.memberNumber) return;
      const email = (booking.clientEmail || "").trim().toLowerCase();
      if (email) nonMemberEmails.add(email);
    });
    mergedData.lessons.forEach((lesson) => {
      if (lesson.memberNumber) return;
      const email = (lesson.clientEmail || "").trim().toLowerCase();
      if (email) nonMemberEmails.add(email);
    });
    const allEmails = new Set<string>([...memberEmails, ...nonMemberEmails]);
    return {
      memberEmails: Array.from(memberEmails),
      nonMemberEmails: Array.from(nonMemberEmails),
      allEmails: Array.from(allEmails),
    };
  }, [memberDirectory, mergedData.courts, mergedData.lessons]);
  const marketingRecipientPool = useMemo(() => {
    const memberSet = new Set(marketingAudience.memberEmails);
    const nonMemberSet = new Set(marketingAudience.nonMemberEmails);
    return marketingAudience.allEmails
      .map((email) => ({
        email,
        segment: memberSet.has(email) ? "Member" : nonMemberSet.has(email) ? "Non-member" : "Saved",
      }))
      .sort((a, b) => a.email.localeCompare(b.email));
  }, [marketingAudience]);
  const filteredMarketingRecipients = useMemo(() => {
    const query = marketingRecipientSearch.trim().toLowerCase();
    if (!query) return marketingRecipientPool.slice(0, 200);
    return marketingRecipientPool
      .filter((item) => item.email.toLowerCase().includes(query) || item.segment.toLowerCase().includes(query))
      .slice(0, 200);
  }, [marketingRecipientPool, marketingRecipientSearch]);
  const marketingSummary = useMemo(() => {
    const launched = mergedData.campaigns.filter((campaign) => campaign.status === "launched").length;
    const drafts = mergedData.campaigns.length - launched;
    const lastLaunch = [...mergedData.campaigns]
      .filter((campaign) => campaign.launchedAt)
      .sort((a, b) => new Date(b.launchedAt || 0).getTime() - new Date(a.launchedAt || 0).getTime())[0];
    return {
      total: mergedData.campaigns.length,
      launched,
      drafts,
      audienceReach: marketingAudience.allEmails.length,
      lastLaunchAt: lastLaunch?.launchedAt || null,
    };
  }, [marketingAudience.allEmails.length, mergedData.campaigns]);
  const marketingCampaignList = useMemo(
    () => [...mergedData.campaigns].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [mergedData.campaigns]
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
  const visibleLessonMonitor = useMemo(
    () => lessonMonitor.filter((item) => selectedLessonCoach === "All Pros" || item.coachName === selectedLessonCoach),
    [lessonMonitor, selectedLessonCoach]
  );
  const selectedLessonDetailRows = useMemo(() => {
    if (!selectedLessonDetailCoach) return [];
    return mergedData.lessons
      .filter((lesson) => lesson.coachName === selectedLessonDetailCoach)
      .filter((lesson) => {
        const year = new Date(lesson.createdAt).getFullYear();
        return Number.isFinite(year) && year === selectedLessonYear;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((lesson) => {
        const memberType = lesson.memberNumber ? "Member" : "Non-member";
        const baseRate = parseCoachRate(lesson.coachName);
        const amount =
          typeof lesson.amountCharged === "number"
            ? lesson.amountCharged
            : lesson.memberNumber
            ? Math.max(95, baseRate - 20)
            : baseRate + 20;
        return {
          ...lesson,
          memberType,
          amount,
        };
      });
  }, [mergedData.lessons, selectedLessonDetailCoach, selectedLessonYear]);
  const programsSummary = useMemo(
    () => ({
      clinics: clinicMonitor.length,
      clinicSignups: clinicMonitor.reduce((sum, item) => sum + item.signups, 0),
      lessonRequests: mergedData.lessons.length,
      activePros: lessonMonitor.filter((item) => item.lessons > 0).length,
      events: eventMonitor.length,
      eventGuests: eventMonitor.reduce((sum, item) => sum + item.guests, 0),
    }),
    [clinicMonitor, eventMonitor, lessonMonitor, mergedData.lessons.length]
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
    const byName = new Map<string, ProProfile>();
    mergedData.proProfiles.forEach((pro) => byName.set(pro.displayName, pro));
    rtcCoaches.forEach((coach) => {
      if (!byName.has(coach.name)) {
        byName.set(coach.name, {
          id: `derived-${coach.name.toLowerCase().replace(/\s+/g, "-")}`,
          displayName: coach.name,
          legalName: "",
          email: "",
          address: "",
          taxIdLast4: "",
          w9OnFile: false,
          active: true,
          updatedAt: new Date(0).toISOString(),
        });
      }
    });
    mergedData.payouts.forEach((payout) => {
      if (!byName.has(payout.proName)) {
        byName.set(payout.proName, {
          id: `derived-${payout.proName.toLowerCase().replace(/\s+/g, "-")}`,
          displayName: payout.proName,
          legalName: "",
          email: "",
          address: "",
          taxIdLast4: "",
          w9OnFile: false,
          active: true,
          updatedAt: new Date(0).toISOString(),
        });
      }
    });
    return Array.from(byName.values()).map((pro) => {
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
  const membersSummary = useMemo(
    () => ({
      totalMembers: memberDirectory.length,
      totalBilled: memberDirectory.reduce((sum, row) => sum + row.totalSpend, 0),
      outstanding: memberDirectory.reduce((sum, row) => sum + row.outstanding, 0),
      statementReady: statementSendable.length,
    }),
    [memberDirectory, statementSendable.length]
  );
  const financeSummary = useMemo(
    () => ({
      proCount: proCompliance.length,
      w9Missing: proCompliance.filter((p) => !p.w9OnFile).length,
      yearlyPayouts: mergedData.payouts
        .filter((p) => p.taxYear === selectedTaxYear)
        .reduce((sum, p) => sum + p.amount, 0),
      likely1099: proCompliance.filter((p) => p.needs1099).length,
    }),
    [mergedData.payouts, proCompliance, selectedTaxYear]
  );
  const financeBillingSummary = useMemo(() => {
    const courtRevenue = mergedData.courts.reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    const clinicRevenue = mergedData.clinics.reduce((sum, item) => sum + (item.total || 0), 0);
    const eventRevenue = mergedData.events.reduce((sum, item) => sum + (item.total || 0), 0);
    const outstanding = mergedData.courts
      .filter((item) => item.paymentStatus !== "paid")
      .reduce((sum, item) => sum + (item.totalAmount || 0), 0);
    return {
      courtRevenue,
      clinicRevenue,
      eventRevenue,
      outstanding,
      totalRevenue: courtRevenue + clinicRevenue + eventRevenue,
    };
  }, [mergedData]);
  const financeRecentBillingItems = useMemo(() => {
    const rows: Array<{ type: string; who: string; detail: string; amount: number; at: string }> = [];
    mergedData.courts.forEach((item) =>
      rows.push({
        type: "Court",
        who: item.clientName,
        detail: `${item.courtName} · ${item.date}`,
        amount: item.totalAmount || 0,
        at: item.createdAt || `${item.date}T12:00:00`,
      })
    );
    mergedData.clinics.forEach((item) =>
      rows.push({
        type: "Clinic",
        who: item.clientName,
        detail: item.clinicNames.join(", "),
        amount: item.total || 0,
        at: item.createdAt,
      })
    );
    mergedData.events.forEach((item) =>
      rows.push({
        type: "Event",
        who: item.attendeeName,
        detail: item.eventTitle,
        amount: item.total || 0,
        at: item.createdAt,
      })
    );
    return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 14);
  }, [mergedData]);
  const topOutstandingMembers = useMemo(() => {
    return [...memberDirectory]
      .filter((member) => member.outstanding > 0)
      .sort((a, b) => b.outstanding - a.outstanding)
      .slice(0, 8);
  }, [memberDirectory]);
  const proDirectory = useMemo(() => {
    const byName = new Map<string, (typeof proCompliance)[number]>();
    proCompliance.forEach((pro) => {
      const existing = byName.get(pro.displayName);
      if (!existing) byName.set(pro.displayName, pro);
      else if (new Date(pro.updatedAt).getTime() > new Date(existing.updatedAt).getTime()) {
        byName.set(pro.displayName, pro);
      }
    });
    return Array.from(byName.values()).sort((a, b) => a.displayName.localeCompare(b.displayName));
  }, [proCompliance]);
  const selectedFinancePro = useMemo(() => {
    if (!proDirectory.length) return null;
    const target = selectedFinanceProName || proDirectory[0].displayName;
    return proDirectory.find((pro) => pro.displayName === target) || proDirectory[0];
  }, [proDirectory, selectedFinanceProName]);
  const selectedFinanceProPayouts = useMemo(() => {
    if (!selectedFinancePro) return [];
    return mergedData.payouts
      .filter((item) => item.proName === selectedFinancePro.displayName)
      .sort((a, b) => new Date(b.payDate).getTime() - new Date(a.payDate).getTime())
      .slice(0, 12);
  }, [mergedData.payouts, selectedFinancePro]);
  const quickJumpResults = useMemo(() => {
    const query = quickJumpQuery.trim().toLowerCase();
    if (!query) return [];
    const results: Array<
      | { type: "member"; id: string; label: string; hint: string }
      | { type: "pro"; id: string; label: string; hint: string }
      | { type: "clinic"; id: string; label: string; hint: string }
      | { type: "event"; id: string; label: string; hint: string }
    > = [];
    memberDirectory.forEach((member) => {
      if (
        member.name.toLowerCase().includes(query) ||
        member.memberNumber.toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query)
      ) {
        results.push({
          type: "member",
          id: member.memberNumber,
          label: `${member.name} (#${member.memberNumber})`,
          hint: "Open in Members",
        });
      }
    });
    proDirectory.forEach((pro) => {
      if (pro.displayName.toLowerCase().includes(query) || pro.legalName.toLowerCase().includes(query)) {
        results.push({
          type: "pro",
          id: pro.displayName,
          label: pro.displayName,
          hint: "Open in Finance",
        });
      }
    });
    clinicMonitor.forEach((clinic) => {
      if (clinic.name.toLowerCase().includes(query)) {
        results.push({
          type: "clinic",
          id: clinic.name,
          label: clinic.name,
          hint: "Filter Programs",
        });
      }
    });
    eventMonitor.forEach((event) => {
      if (event.title.toLowerCase().includes(query)) {
        results.push({
          type: "event",
          id: event.title,
          label: event.title,
          hint: "Filter Programs",
        });
      }
    });
    return results.slice(0, 8);
  }, [clinicMonitor, eventMonitor, memberDirectory, proDirectory, quickJumpQuery]);

  function jumpToResult(
    result:
      | { type: "member"; id: string }
      | { type: "pro"; id: string }
      | { type: "clinic"; id: string }
      | { type: "event"; id: string }
  ) {
    if (result.type === "member") {
      setActiveWorkspace("members");
      setSelectedMemberNumber(result.id);
      setSelectedMemberDetailTab("courts");
    }
    if (result.type === "pro") {
      setActiveWorkspace("finance");
      setSelectedFinanceProName(result.id);
    }
    if (result.type === "clinic") {
      setActiveWorkspace("programs");
      setSelectedClinic(result.id);
    }
    if (result.type === "event") {
      setActiveWorkspace("programs");
      setSelectedEvent(result.id);
    }
    setQuickJumpQuery("");
  }

  function getCampaignRecipients(
    audience: MarketingAudience,
    recipientMode: MarketingRecipientMode = "list",
    selectedRecipients: string[] = []
  ): string[] {
    if (recipientMode === "specific") {
      return Array.from(new Set(selectedRecipients.map((email) => email.trim().toLowerCase()).filter(Boolean)));
    }
    if (audience === "members") return marketingAudience.memberEmails;
    if (audience === "nonmembers") return marketingAudience.nonMemberEmails;
    return marketingAudience.allEmails;
  }

  function createMarketingCampaign(e: React.FormEvent) {
    e.preventDefault();
    const name = marketingForm.name.trim();
    const subject = marketingForm.subject.trim();
    const message = marketingForm.message.trim();
    if (!name || !subject || !message) {
      setAdminMsg("Campaign name, subject, and message are required.");
      return;
    }
    if (!marketingForm.channels.length) {
      setAdminMsg("Select at least one channel.");
      return;
    }
    if (marketingForm.recipientMode === "specific" && marketingForm.selectedRecipients.length === 0) {
      setAdminMsg("Select at least one specific recipient.");
      return;
    }
    const campaign: MarketingCampaign = {
      id: `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name,
      target: marketingForm.target,
      audience: marketingForm.audience,
      recipientMode: marketingForm.recipientMode,
      selectedRecipients: marketingForm.selectedRecipients,
      channels: marketingForm.channels,
      subject,
      message,
      facebookCopy: marketingForm.facebookCopy.trim() || buildMarketingDraft(marketingForm.target, name).facebookCopy,
      instagramCopy:
        marketingForm.instagramCopy.trim() || buildMarketingDraft(marketingForm.target, name).instagramCopy,
      googleCopy: marketingForm.googleCopy.trim() || buildMarketingDraft(marketingForm.target, name).googleCopy,
      status: "draft",
      createdAt: new Date().toISOString(),
      recipientCount: 0,
    };
    const next = [campaign, ...marketingCampaigns];
    setMarketingCampaigns(next);
    localStorage.setItem(ADMIN_MARKETING_CAMPAIGNS_KEY, JSON.stringify(next));
    setMarketingForm((prev) => ({
      ...prev,
      name: "",
      subject: "",
      message: "",
      facebookCopy: "",
      instagramCopy: "",
      googleCopy: "",
      selectedRecipients: [],
    }));
    setMarketingRecipientSearch("");
    setAdminMsg("Marketing campaign saved as draft.");
  }

  function launchCampaign(campaignId: string) {
    const next = marketingCampaigns.map((campaign) => {
      if (campaign.id !== campaignId) return campaign;
      const recipients = getCampaignRecipients(
        campaign.audience,
        campaign.recipientMode,
        campaign.selectedRecipients
      );
      return {
        ...campaign,
        status: "launched" as const,
        launchedAt: new Date().toISOString(),
        recipientCount: recipients.length,
      };
    });
    setMarketingCampaigns(next);
    localStorage.setItem(ADMIN_MARKETING_CAMPAIGNS_KEY, JSON.stringify(next));
    setAdminMsg("Campaign launched and tracking updated.");
  }

  function exportCampaignRecipients(campaign: MarketingCampaign) {
    const recipients = getCampaignRecipients(campaign.audience, campaign.recipientMode, campaign.selectedRecipients);
    const csv = ["email", ...recipients].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${campaign.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-recipients.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setAdminMsg(`Exported ${recipients.length} recipients.`);
  }

  async function copyCampaignRecipients(campaign: MarketingCampaign) {
    const recipients = getCampaignRecipients(campaign.audience, campaign.recipientMode, campaign.selectedRecipients);
    if (!recipients.length) {
      setAdminMsg("No recipient emails available for this campaign audience.");
      return;
    }
    try {
      await navigator.clipboard.writeText(recipients.join(", "));
      setAdminMsg(`Copied ${recipients.length} recipient emails.`);
    } catch {
      setAdminMsg("Unable to copy recipients. Please use CSV export.");
    }
  }

  function openCampaignEmailDraft(campaign: MarketingCampaign) {
    const recipients = getCampaignRecipients(campaign.audience, campaign.recipientMode, campaign.selectedRecipients);
    const bcc = recipients.join(",");
    const params = new URLSearchParams({
      subject: campaign.subject,
      body: campaign.message,
    });
    if (bcc.length && bcc.length < 1200) params.set("bcc", bcc);
    else if (bcc.length >= 1200) {
      setAdminMsg("Recipient list is large. Use CSV export for full email blast upload.");
    }
    window.open(`mailto:?${params.toString()}`, "_blank");
  }

  async function openExternalMarketing(channel: MarketingChannel, campaign?: MarketingCampaign) {
    const urls: Record<MarketingChannel, string> = {
      email: "https://mail.google.com",
      facebook: "https://business.facebook.com/latest/ads_manager",
      instagram: "https://business.facebook.com/latest/ads_manager",
      google: "https://ads.google.com/home/",
    };
    if (campaign && channel !== "email") {
      const draft =
        channel === "facebook"
          ? campaign.facebookCopy
          : channel === "instagram"
          ? campaign.instagramCopy
          : campaign.googleCopy;
      try {
        await navigator.clipboard.writeText(draft);
        setAdminMsg(`${channel} draft copied. Paste it into the platform composer.`);
      } catch {
        setAdminMsg(`Open ${channel} and use the saved campaign copy.`);
      }
    }
    window.open(urls[channel], "_blank");
  }

  function applyAutoCampaignDraft() {
    const sourceName = marketingForm.name.trim();
    if (!sourceName) {
      setAdminMsg("Enter a campaign or event name first.");
      return;
    }
    const draft = buildMarketingDraft(marketingForm.target, sourceName);
    setMarketingForm((prev) => ({
      ...prev,
      subject: draft.subject,
      message: draft.message,
      facebookCopy: draft.facebookCopy,
      instagramCopy: draft.instagramCopy,
      googleCopy: draft.googleCopy,
    }));
    setAdminMsg("Campaign draft copy generated from campaign name.");
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
    setSelectedFinanceProName(displayName);
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
    if (typeof window === "undefined") return;
    const prevKey = previousQuarterKey();
    if (selectedStatementQuarter !== prevKey) return;
    if (quarterlyEmailLog[prevKey]) return;
    if (!statementSendable.length) return;
    void sendQuarterlyStatements("auto");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatementQuarter, quarterlyEmailLog, statementSendable.length]);

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
          </div>
        </div>

        {adminMsg && <p className="mt-3 rounded-lg border border-[#dbead3] bg-[#f4faf1] px-3 py-2 text-[12px] text-[#2d5016]">{adminMsg}</p>}

        <div className="sticky top-2 z-20 mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7]/95 p-4 backdrop-blur">
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
                {activeWorkspace === "marketing" && "Marketing"}
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
                ["marketing", "Marketing", "Campaign planning + launch tracking"],
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
          <div className="mt-3 grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto]">
            <div>
              <input
                value={quickJumpQuery}
                onChange={(e) => setQuickJumpQuery(e.target.value)}
                placeholder="Quick jump: member, pro, clinic, event..."
                className="w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]"
              />
              {quickJumpResults.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {quickJumpResults.map((row) => (
                    <button
                      key={`${row.type}-${row.id}`}
                      type="button"
                      onClick={() => jumpToResult(row)}
                      className="rounded-md border border-[#d9d5cf] bg-white px-3 py-1.5 text-[12px] hover:bg-[#fdfcfb]"
                      title={row.hint}
                    >
                      {row.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <p className="text-[11px] text-[#8a8477]">
                Live sync: {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() : "Not synced yet"}
              </p>
              <button
                type="button"
                onClick={() => loadLiveData()}
                className="rounded-md border border-[#d9d5cf] bg-white px-3 py-1.5 text-[12px] hover:bg-[#fdfcfb]"
              >
                Refresh now
              </button>
              <button
                type="button"
                onClick={() => setAutoRefreshEnabled((v) => !v)}
                className={`rounded-md border px-3 py-1.5 text-[12px] ${
                  autoRefreshEnabled
                    ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                    : "border-[#d9d5cf] bg-white text-[#4a4a4a] hover:bg-[#fdfcfb]"
                }`}
              >
                Auto-refresh: {autoRefreshEnabled ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>

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
          <details id="performance-overview" className="mt-5 rounded-xl border border-[#ece8e2] p-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              Performance
            </summary>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-[#6b665e]">Choose monthly, seasonal, or yearly view.</p>
              <select
                value={performanceView}
                onChange={(e) => setPerformanceView(e.target.value as "monthly" | "seasonal" | "yearly")}
                className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px]"
              >
                <option value="monthly">Monthly Performance</option>
                <option value="seasonal">Seasonal Performance</option>
                <option value="yearly">Yearly Performance</option>
              </select>
            </div>

            {performanceView === "monthly" && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-[12px]">
                  <thead className="text-[#8a8477]">
                    <tr>
                      <th className="py-1">Month</th>
                      <th className="py-1">Court Bookings</th>
                      <th className="py-1">Lesson Requests</th>
                      <th className="py-1">Clinic Bookings</th>
                      <th className="py-1">Event Reservations</th>
                      <th className="py-1">Court Revenue</th>
                      <th className="py-1">Clinic Revenue</th>
                      <th className="py-1">Event Revenue</th>
                      <th className="py-1">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...monthly].reverse().map((row) => (
                      <tr key={row.key} className="border-t border-[#f0ede8]">
                        <td className="py-1.5">{row.label}</td>
                        <td className="py-1.5">{row.courtBookings}</td>
                        <td className="py-1.5">{row.lessonRequests}</td>
                        <td className="py-1.5">{row.clinicBookings}</td>
                        <td className="py-1.5">{row.eventReservations}</td>
                        <td className="py-1.5">{formatCurrency(row.courtRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.clinicRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.eventRevenue)}</td>
                        <td className="py-1.5 font-medium">{formatCurrency(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {performanceView === "seasonal" && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-[12px]">
                  <thead className="text-[#8a8477]">
                    <tr>
                      <th className="py-1">Season</th>
                      <th className="py-1">Court Bookings</th>
                      <th className="py-1">Lesson Requests</th>
                      <th className="py-1">Clinic Bookings</th>
                      <th className="py-1">Event Reservations</th>
                      <th className="py-1">Court Revenue</th>
                      <th className="py-1">Clinic Revenue</th>
                      <th className="py-1">Event Revenue</th>
                      <th className="py-1">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {seasonal.map((row) => (
                      <tr key={row.label} className="border-t border-[#f0ede8]">
                        <td className="py-1.5">{row.label}</td>
                        <td className="py-1.5">{row.courtBookings}</td>
                        <td className="py-1.5">{row.lessonRequests}</td>
                        <td className="py-1.5">{row.clinicBookings}</td>
                        <td className="py-1.5">{row.eventReservations}</td>
                        <td className="py-1.5">{formatCurrency(row.courtRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.clinicRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.eventRevenue)}</td>
                        <td className="py-1.5 font-medium">{formatCurrency(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {performanceView === "yearly" && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[980px] text-left text-[12px]">
                  <thead className="text-[#8a8477]">
                    <tr>
                      <th className="py-1">Year</th>
                      <th className="py-1">Court Bookings</th>
                      <th className="py-1">Lesson Requests</th>
                      <th className="py-1">Clinic Bookings</th>
                      <th className="py-1">Event Reservations</th>
                      <th className="py-1">Court Revenue</th>
                      <th className="py-1">Clinic Revenue</th>
                      <th className="py-1">Event Revenue</th>
                      <th className="py-1">Total Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearly.map((row) => (
                      <tr key={row.year} className="border-t border-[#f0ede8]">
                        <td className="py-1.5">{row.year}</td>
                        <td className="py-1.5">{row.courtBookings}</td>
                        <td className="py-1.5">{row.lessonRequests}</td>
                        <td className="py-1.5">{row.clinicBookings}</td>
                        <td className="py-1.5">{row.eventReservations}</td>
                        <td className="py-1.5">{formatCurrency(row.courtRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.clinicRevenue)}</td>
                        <td className="py-1.5">{formatCurrency(row.eventRevenue)}</td>
                        <td className="py-1.5 font-medium">{formatCurrency(row.totalRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </details>
        )}

        {activeWorkspace === "operations" && (
          <div className="mt-5 grid gap-4 md:grid-cols-3">
          <details className="rounded-xl border border-[#ece8e2] p-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              Court Control Panel
            </summary>
            <form onSubmit={createCourtBlock} className="mt-3 grid gap-2">
              <input type="date" value={newBlock.date} onChange={(e) => setNewBlock((p) => ({ ...p, date: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <select value={newBlock.courtId} onChange={(e) => setNewBlock((p) => ({ ...p, courtId: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                {COURTS.map((court) => (
                  <option key={court.id} value={court.id}>{court.name}</option>
                ))}
              </select>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
                  <button type="button" onClick={() => removeCourtBlock(block.id)} className="mt-1 rounded border border-[#d9d5cf] px-2 py-1 text-[10px] hover:bg-white">Remove</button>
                </div>
              ))}
            </div>
          </details>

          <details className="rounded-xl border border-[#ece8e2] p-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              Manual Court Booking
            </summary>
            <form onSubmit={createManualCourtBooking} className="mt-3 grid gap-2">
              <input type="date" value={manualBooking.date} onChange={(e) => setManualBooking((p) => ({ ...p, date: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              <select value={manualBooking.courtId} onChange={(e) => setManualBooking((p) => ({ ...p, courtId: e.target.value }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                {COURTS.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
              </select>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input value={manualBooking.memberNumber} onChange={(e) => setManualBooking((p) => ({ ...p, memberNumber: e.target.value }))} placeholder="Member #" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
                <input value={manualBooking.totalAmount} onChange={(e) => setManualBooking((p) => ({ ...p, totalAmount: e.target.value }))} placeholder="Total amount" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]" />
              </div>
              <select value={manualBooking.paymentStatus} onChange={(e) => setManualBooking((p) => ({ ...p, paymentStatus: e.target.value as "paid" | "pending" }))} className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]">
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
              </select>
              <button type="submit" className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">Create Booking</button>
            </form>
          </details>

          <details className="rounded-xl border border-[#ece8e2] p-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              Member Notes
            </summary>
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
          </details>
          </div>
        )}

        {activeWorkspace === "programs" && (
          <div className="mt-4 grid gap-4 xl:grid-cols-2">
            <div className="xl:col-span-2 grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Clinics</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.clinics}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Clinic Signups</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.clinicSignups}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Lesson Requests</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.lessonRequests}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Active Pros</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.activePros}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Events</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.events}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Event Guests</p>
                <p className="mt-1 text-[20px] font-semibold">{programsSummary.eventGuests}</p>
              </div>
            </div>

            <details id="clinics-monitor" className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Clinics Monitor
              </summary>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-[11px] text-[#8a8477]">Compact view: signups, revenue, and top attendee count.</p>
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
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[540px] text-left text-[12px]">
                  <thead className="text-[#8a8477]">
                    <tr>
                      <th className="py-1">Clinic</th>
                      <th className="py-1">Signups</th>
                      <th className="py-1">Revenue</th>
                      <th className="py-1">Unique Players</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleClinics.map((clinic) => (
                      <tr key={clinic.name} className="border-t border-[#f0ede8]">
                        <td className="py-1.5 font-medium">{clinic.name}</td>
                        <td className="py-1.5">{clinic.signups}</td>
                        <td className="py-1.5">{formatCurrency(clinic.revenue)}</td>
                        <td className="py-1.5">{clinic.attendees.size}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleClinics.length === 0 && <p className="mt-2 text-[12px] text-[#8a8477]">No clinic activity yet.</p>}
              </div>
            </details>

            <details className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Clinic Schedule + Past Performance
              </summary>
              <div className="mt-3 grid gap-3 xl:grid-cols-2">
                <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Next Week Clinics</p>
                  <div className="mt-2 space-y-1.5 text-[12px]">
                    {nextWeekClinics.map((clinic) => (
                      <div key={`${clinic.name}-${clinic.dateLabel}`} className="rounded border border-[#ece8e2] bg-white px-2.5 py-2">
                        <p className="font-medium">{clinic.name}</p>
                        <p className="text-[#6b665e]">
                          {clinic.dateLabel} at {clinic.timeLabel} · {clinic.level}
                        </p>
                      </div>
                    ))}
                    {nextWeekClinics.length === 0 && <p className="text-[#8a8477]">No upcoming clinic schedule found.</p>}
                  </div>
                </div>
                <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Past 12-Month Clinic Performance</p>
                  <div className="mt-2 max-h-[45vh] overflow-y-auto sm:max-h-[240px]">
                    <table className="w-full text-left text-[11px]">
                      <thead className="text-[#8a8477]">
                        <tr>
                          <th className="py-1">Clinic</th>
                          <th className="py-1">Avg Signups/Mo</th>
                          <th className="py-1">Top Player</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clinicPerformance.map((row) => (
                          <tr key={row.name} className="border-t border-[#ece8e2]">
                            <td className="py-1.5">{row.name}</td>
                            <td className="py-1.5">{row.avgSignupsPerMonth.toFixed(1)}</td>
                            <td className="py-1.5">{row.topMember}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-[11px] text-[#8a8477]">
                    Total signups and revenue are tracked in monitor and finance tables.
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Most Active Clinic Members (Past 12 Months)</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {clinicMemberLeaderboard.map((row) => (
                    <div key={row.member} className="rounded border border-[#ece8e2] bg-white px-2.5 py-2 text-[11px]">
                      <p className="font-medium">{row.member}</p>
                      <p className="text-[#6b665e]">
                        Visits: {row.visits} · Clinic types: {row.clinicTypes}
                      </p>
                    </div>
                  ))}
                  {clinicMemberLeaderboard.length === 0 && (
                    <p className="text-[12px] text-[#8a8477]">No repeat clinic member data yet.</p>
                  )}
                </div>
              </div>
            </details>

            <details className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Lessons Monitor + Past Performance
              </summary>
              <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                <select
                  value={selectedLessonYear}
                  onChange={(e) => setSelectedLessonYear(Number(e.target.value) || new Date().getFullYear())}
                  className="rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
                >
                  {lessonYearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedLessonCoach}
                  onChange={(e) => setSelectedLessonCoach(e.target.value)}
                  className="rounded-lg border border-[#e8e5df] px-2 py-1 text-[12px]"
                >
                  {lessonOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-[12px]">
                  <thead className="text-[#8a8477]">
                    <tr>
                      <th className="py-1">Pro</th>
                      <th className="py-1">Lessons (12M)</th>
                      <th className="py-1">Unique Members</th>
                      <th className="py-1">Avg / Week</th>
                      <th className="py-1">Top Members</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleLessonMonitor.map((row) => (
                      <tr
                        key={row.coachName}
                        className={`cursor-pointer border-t border-[#f0ede8] ${
                          selectedLessonDetailCoach === row.coachName ? "bg-[#faf9f7]" : "hover:bg-[#fdfcfb]"
                        }`}
                        onClick={() => setSelectedLessonDetailCoach(row.coachName)}
                      >
                        <td className="py-1.5 font-medium">{row.coachName}</td>
                        <td className="py-1.5">{row.lessons}</td>
                        <td className="py-1.5">{row.uniqueMembers}</td>
                        <td className="py-1.5">{row.avgPerWeek.toFixed(1)}</td>
                        <td className="py-1.5 text-[#6b665e]">{row.topMembers.join(", ") || "No lessons yet"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleLessonMonitor.length === 0 && (
                  <p className="mt-2 text-[12px] text-[#8a8477]">No lesson data found for this filter.</p>
                )}
              </div>
              {selectedLessonDetailCoach && (
                <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                  <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">
                    {selectedLessonDetailCoach} Lesson Summary ({selectedLessonYear})
                  </p>
                  <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[260px]">
                    {selectedLessonDetailRows.map((lesson) => (
                      <div key={lesson.id} className="rounded border border-[#ece8e2] bg-white px-2.5 py-2 text-[11px]">
                        <p className="font-medium">
                          {new Date(lesson.createdAt).toLocaleDateString()} · {lesson.slot}
                        </p>
                        <p className="text-[#6b665e]">
                          {lesson.clientName}
                          {lesson.clientEmail ? ` · ${lesson.clientEmail}` : ""}
                        </p>
                        <p className="text-[#6b665e]">
                          {lesson.memberType}
                          {lesson.memberNumber ? ` (#${lesson.memberNumber})` : ""} · Charged {formatCurrency(lesson.amount)}
                        </p>
                      </div>
                    ))}
                    {selectedLessonDetailRows.length === 0 && (
                      <p className="text-[12px] text-[#8a8477]">
                        No lesson records for {selectedLessonDetailCoach} in {selectedLessonYear}.
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">
                  Most Active Lesson Members ({selectedLessonYear})
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {lessonMemberLeaderboard.map((row) => (
                    <div key={row.member} className="rounded border border-[#ece8e2] bg-white px-2.5 py-2 text-[11px]">
                      <p className="font-medium">{row.member}</p>
                      <p className="text-[#6b665e]">
                        Lessons: {row.lessons} · Pros worked with: {row.pros}
                      </p>
                    </div>
                  ))}
                  {lessonMemberLeaderboard.length === 0 && (
                    <p className="text-[12px] text-[#8a8477]">No lesson activity in {selectedLessonYear}.</p>
                  )}
                </div>
              </div>
            </details>

            <details id="events-monitor" className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Events Monitor
              </summary>
              <div className="mt-3 flex items-center justify-end">
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
            </details>
          </div>
        )}

        {activeWorkspace === "members" && (
          <div className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Members</p>
              <p className="mt-1 text-[20px] font-semibold">{membersSummary.totalMembers}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Total Billed</p>
              <p className="mt-1 text-[20px] font-semibold">{formatCurrency(membersSummary.totalBilled)}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Outstanding</p>
              <p className="mt-1 text-[20px] font-semibold">{formatCurrency(membersSummary.outstanding)}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Statements Ready</p>
              <p className="mt-1 text-[20px] font-semibold">{membersSummary.statementReady}</p>
            </div>
          </div>

          <details id="members-hub" className="rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Membership Area</summary>
          <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_1.2fr]">
            <div className="rounded-lg border border-[#ece8e2] p-3">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">All Members</p>
              <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[360px]">
                {memberDirectory.map((member) => {
                  const active = selectedMember?.memberNumber === member.memberNumber;
                  return (
                    <button
                      key={member.memberNumber}
                      type="button"
                      onClick={() => {
                        setSelectedMemberNumber(member.memberNumber);
                        setSelectedMemberDetailTab("courts");
                      }}
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

                  <div className="mt-3 rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                    <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">
                      This Year Activity Details ({selectedMemberYearlyDetails.year})
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(
                        [
                          ["courts", `Court Bookings (${selectedMemberYearlyDetails.courts.length})`],
                          ["clinics", `Clinics (${selectedMemberYearlyDetails.clinics.length})`],
                          ["events", `Events (${selectedMemberYearlyDetails.events.length})`],
                          ["lessons", `Lessons (${selectedMemberYearlyDetails.lessons.length})`],
                        ] as Array<["courts" | "clinics" | "events" | "lessons", string]>
                      ).map(([tab, label]) => {
                        const active = selectedMemberDetailTab === tab;
                        return (
                          <button
                            key={tab}
                            type="button"
                            onClick={() => setSelectedMemberDetailTab(tab)}
                            className={`rounded-md border px-2.5 py-1 text-[11px] ${
                              active
                                ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                                : "border-[#d9d5cf] bg-white hover:bg-[#fdfcfb]"
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[240px]">
                      {selectedMemberDetailTab === "courts" &&
                        selectedMemberYearlyDetails.courts.map((item) => (
                          <div key={`court-${item.id}-${item.blockStartHour}-${item.date}`} className="rounded-md border border-[#e8e5df] bg-white px-2.5 py-2 text-[11px]">
                            <p className="font-medium">
                              {item.courtName} · {item.date} · {formatHour(item.blockStartHour)}
                            </p>
                            <p className="text-[#6b665e]">
                              {formatCurrency(item.totalAmount)} · {item.paymentStatus === "paid" ? "Completed (Paid)" : "Booked (Pending)"}
                            </p>
                          </div>
                        ))}
                      {selectedMemberDetailTab === "clinics" &&
                        selectedMemberYearlyDetails.clinics.map((item) => (
                          <div key={`clinic-${item.id}`} className="rounded-md border border-[#e8e5df] bg-white px-2.5 py-2 text-[11px]">
                            <p className="font-medium">{item.clinicNames.join(", ")}</p>
                            <p className="text-[#6b665e]">
                              {new Date(item.createdAt).toLocaleDateString()} · {formatCurrency(item.total)} · Completed
                            </p>
                          </div>
                        ))}
                      {selectedMemberDetailTab === "events" &&
                        selectedMemberYearlyDetails.events.map((item) => (
                          <div key={`event-${item.id}`} className="rounded-md border border-[#e8e5df] bg-white px-2.5 py-2 text-[11px]">
                            <p className="font-medium">{item.eventTitle}</p>
                            <p className="text-[#6b665e]">
                              {new Date(item.createdAt).toLocaleDateString()} · Guests: {item.guestCount} · {formatCurrency(item.total)}
                            </p>
                          </div>
                        ))}
                      {selectedMemberDetailTab === "lessons" &&
                        selectedMemberYearlyDetails.lessons.map((item) => (
                          <div key={`lesson-${item.id}`} className="rounded-md border border-[#e8e5df] bg-white px-2.5 py-2 text-[11px]">
                            <p className="font-medium">{item.coachName}</p>
                            <p className="text-[#6b665e]">
                              {new Date(item.createdAt).toLocaleDateString()} · {item.slot}
                            </p>
                          </div>
                        ))}

                      {selectedMemberDetailTab === "courts" && selectedMemberYearlyDetails.courts.length === 0 && (
                        <p className="text-[11px] text-[#8a8477]">No court bookings found this year.</p>
                      )}
                      {selectedMemberDetailTab === "clinics" && selectedMemberYearlyDetails.clinics.length === 0 && (
                        <p className="text-[11px] text-[#8a8477]">No clinic bookings found this year.</p>
                      )}
                      {selectedMemberDetailTab === "events" && selectedMemberYearlyDetails.events.length === 0 && (
                        <p className="text-[11px] text-[#8a8477]">No event reservations found this year.</p>
                      )}
                      {selectedMemberDetailTab === "lessons" && selectedMemberYearlyDetails.lessons.length === 0 && (
                        <p className="text-[11px] text-[#8a8477]">No lesson requests found this year.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[#8a8477]">Select a member to view details.</p>
              )}
            </div>
          </div>
          </details>
          </div>
        )}

        {activeWorkspace === "finance" && (
          <div className="mt-4 grid gap-4">
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Pros</p>
              <p className="mt-1 text-[20px] font-semibold">{financeSummary.proCount}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">W-9 Missing</p>
              <p className="mt-1 text-[20px] font-semibold">{financeSummary.w9Missing}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">{selectedTaxYear} Payouts</p>
              <p className="mt-1 text-[20px] font-semibold">{formatCurrency(financeSummary.yearlyPayouts)}</p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Likely 1099</p>
              <p className="mt-1 text-[20px] font-semibold">{financeSummary.likely1099}</p>
            </div>
          </div>

          <details id="pro-registry" className="rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Pro Profile Registry (1099 Readiness)</summary>
          <div className="mt-3 grid gap-4 xl:grid-cols-[1fr_0.8fr_1.1fr]">
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
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Pro Directory</p>
              <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[360px]">
                {proDirectory.map((pro) => {
                  const active = selectedFinancePro?.displayName === pro.displayName;
                  return (
                    <button
                      key={pro.id}
                      type="button"
                      onClick={() => setSelectedFinanceProName(pro.displayName)}
                      className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${
                        active
                          ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                          : "border-[#ece8e2] bg-[#faf9f7] hover:bg-white"
                      }`}
                    >
                      <p className="font-medium">
                        {pro.displayName} {pro.active ? "" : "(Inactive)"}
                      </p>
                      <p className={active ? "text-white/80" : "text-[#6b665e]"}>
                        {selectedTaxYear} total: {formatCurrency(pro.yearTotal)}
                      </p>
                    </button>
                  );
                })}
                {proDirectory.length === 0 && <p className="text-[12px] text-[#8a8477]">No pro profiles yet.</p>}
              </div>
            </div>

            <div className="rounded-lg border border-[#ece8e2] p-3 text-[12px]">
              <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Selected Pro Detail</p>
              {selectedFinancePro ? (
                <div className="mt-2 space-y-2">
                  <p className="font-medium">
                    {selectedFinancePro.displayName} {selectedFinancePro.active ? "" : "(Inactive)"}
                  </p>
                  <p className="text-[#6b665e]">Legal name: {selectedFinancePro.legalName || "Not set"}</p>
                  <p className="text-[#6b665e]">Email: {selectedFinancePro.email || "Not set"}</p>
                  <p className="text-[#6b665e]">Address: {selectedFinancePro.address || "Not set"}</p>
                  <p className="text-[#6b665e]">
                    Tax ID last4: {selectedFinancePro.taxIdLast4 || "Not set"} · W-9:{" "}
                    {selectedFinancePro.w9OnFile ? "On file" : "Missing"}
                  </p>
                  <p className="text-[#6b665e]">
                    {selectedTaxYear} payout total: {formatCurrency(selectedFinancePro.yearTotal)} · 1099:{" "}
                    {selectedFinancePro.needs1099 ? "Likely required" : "Below threshold"}
                  </p>
                  <div className="rounded-md border border-[#ece8e2] bg-[#faf9f7] p-2">
                    <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Recent Payouts</p>
                    <div className="mt-1 max-h-[35vh] space-y-1 overflow-y-auto pr-1 text-[11px] sm:max-h-[140px]">
                      {selectedFinanceProPayouts.map((row) => (
                        <div key={row.id} className="rounded border border-[#ece8e2] bg-white px-2 py-1.5">
                          <p className="font-medium">
                            {formatCurrency(row.amount)} · {new Date(row.payDate).toLocaleDateString()}
                          </p>
                          <p className="text-[#6b665e]">
                            {row.method.toUpperCase()} · {row.category}
                            {row.notes ? ` · ${row.notes}` : ""}
                          </p>
                        </div>
                      ))}
                      {selectedFinanceProPayouts.length === 0 && (
                        <p className="text-[#8a8477]">No payouts recorded for this pro yet.</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-[#8a8477]">No pro selected yet.</p>
              )}
            </div>
          </div>
          </details>

          <details id="billing-overview" className="rounded-xl border border-[#ece8e2] p-4">
            <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
              Billing Overview
            </summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Total Billed</p>
                <p className="mt-1 text-[18px] font-semibold">{formatCurrency(financeBillingSummary.totalRevenue)}</p>
              </div>
              <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Court Billing</p>
                <p className="mt-1 text-[18px] font-semibold">{formatCurrency(financeBillingSummary.courtRevenue)}</p>
              </div>
              <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Clinic Billing</p>
                <p className="mt-1 text-[18px] font-semibold">{formatCurrency(financeBillingSummary.clinicRevenue)}</p>
              </div>
              <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Event Billing</p>
                <p className="mt-1 text-[18px] font-semibold">{formatCurrency(financeBillingSummary.eventRevenue)}</p>
              </div>
              <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Outstanding</p>
                <p className="mt-1 text-[18px] font-semibold">{formatCurrency(financeBillingSummary.outstanding)}</p>
              </div>
            </div>

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <div className="rounded-lg border border-[#ece8e2] p-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Top Outstanding Members</p>
                <div className="mt-2 space-y-2">
                  {topOutstandingMembers.map((member) => (
                    <div key={member.memberNumber} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                      <p className="font-medium">
                        {member.name} · #{member.memberNumber}
                      </p>
                      <p className="text-[#6b665e]">
                        Outstanding: {formatCurrency(member.outstanding)} · Total billed: {formatCurrency(member.totalSpend)}
                      </p>
                    </div>
                  ))}
                  {topOutstandingMembers.length === 0 && (
                    <p className="text-[12px] text-[#8a8477]">No outstanding balances right now.</p>
                  )}
                </div>
              </div>
              <div className="rounded-lg border border-[#ece8e2] p-3">
                <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Recent Billing Activity</p>
                <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto pr-1 sm:max-h-[260px]">
                  {financeRecentBillingItems.map((row, idx) => (
                    <div key={`${row.type}-${row.at}-${idx}`} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-2.5 py-2 text-[11px]">
                      <p className="font-medium">
                        {row.type} · {row.who}
                      </p>
                      <p className="text-[#6b665e]">
                        {row.detail} · {formatCurrency(row.amount)}
                      </p>
                      <p className="text-[#8a8477]">{new Date(row.at).toLocaleString()}</p>
                    </div>
                  ))}
                  {financeRecentBillingItems.length === 0 && (
                    <p className="text-[12px] text-[#8a8477]">No billing activity yet.</p>
                  )}
                </div>
              </div>
            </div>
          </details>
          </div>
        )}

        {activeWorkspace === "marketing" && (
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 sm:grid-cols-5">
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Campaigns</p>
                <p className="mt-1 text-[20px] font-semibold">{marketingSummary.total}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Launched</p>
                <p className="mt-1 text-[20px] font-semibold">{marketingSummary.launched}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Drafts</p>
                <p className="mt-1 text-[20px] font-semibold">{marketingSummary.drafts}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Reachable Emails</p>
                <p className="mt-1 text-[20px] font-semibold">{marketingSummary.audienceReach}</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">Last Launch</p>
                <p className="mt-1 text-[12px] font-medium">
                  {marketingSummary.lastLaunchAt ? new Date(marketingSummary.lastLaunchAt).toLocaleString() : "None yet"}
                </p>
              </div>
            </div>

            <details className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Campaign Builder
              </summary>
              <form onSubmit={createMarketingCampaign} className="mt-3 grid gap-2">
                <input
                  value={marketingForm.name}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Campaign / event name"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={marketingForm.target}
                    onChange={(e) =>
                      setMarketingForm((prev) => ({ ...prev, target: e.target.value as MarketingTarget }))
                    }
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                  >
                    <option value="events">Events</option>
                    <option value="clinics">Clinics</option>
                    <option value="lessons">Private Lessons</option>
                    <option value="open-courts">Open Courts</option>
                    <option value="membership">Membership</option>
                  </select>
                  <select
                    value={marketingForm.audience}
                    onChange={(e) =>
                      setMarketingForm((prev) => ({ ...prev, audience: e.target.value as MarketingAudience }))
                    }
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                    disabled={marketingForm.recipientMode === "specific"}
                  >
                    <option value="all">All saved emails</option>
                    <option value="members">Members only</option>
                    <option value="nonmembers">Non-members only</option>
                  </select>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <select
                    value={marketingForm.recipientMode}
                    onChange={(e) =>
                      setMarketingForm((prev) => ({
                        ...prev,
                        recipientMode: e.target.value as MarketingRecipientMode,
                        selectedRecipients: e.target.value === "specific" ? prev.selectedRecipients : [],
                      }))
                    }
                    className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                  >
                    <option value="list">Use audience list</option>
                    <option value="specific">Select specific recipients</option>
                  </select>
                  <button
                    type="button"
                    onClick={applyAutoCampaignDraft}
                    className="rounded-lg border border-[#d9d5cf] bg-white px-3 py-2 text-[12px] font-medium hover:bg-[#fdfcfb]"
                  >
                    Auto-Generate Draft Copy
                  </button>
                </div>
                {marketingForm.recipientMode === "specific" && (
                  <div className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">Specific Recipients</p>
                      <p className="text-[11px] text-[#8a8477]">
                        Selected: {marketingForm.selectedRecipients.length}
                      </p>
                    </div>
                    <input
                      value={marketingRecipientSearch}
                      onChange={(e) => setMarketingRecipientSearch(e.target.value)}
                      placeholder="Search emails..."
                      className="mt-2 w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[12px]"
                    />
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setMarketingForm((prev) => ({
                            ...prev,
                            selectedRecipients: marketingAudience.memberEmails,
                          }))
                        }
                        className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                      >
                        Select all members
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMarketingForm((prev) => ({
                            ...prev,
                            selectedRecipients: marketingAudience.nonMemberEmails,
                          }))
                        }
                        className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                      >
                        Select all non-members
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setMarketingForm((prev) => ({
                            ...prev,
                            selectedRecipients: marketingAudience.allEmails,
                          }))
                        }
                        className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                      >
                        Select all saved emails
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarketingForm((prev) => ({ ...prev, selectedRecipients: [] }))}
                        className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="mt-2 max-h-[180px] space-y-1 overflow-y-auto rounded-lg border border-[#ece8e2] bg-white p-2">
                      {filteredMarketingRecipients.map((recipient) => {
                        const checked = marketingForm.selectedRecipients.includes(recipient.email);
                        return (
                          <label
                            key={recipient.email}
                            className="flex items-center justify-between gap-2 rounded-md border border-[#f0ede8] px-2 py-1 text-[11px]"
                          >
                            <span className="truncate text-[#4a4a4a]">{recipient.email}</span>
                            <span className="text-[#8a8477]">{recipient.segment}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) =>
                                setMarketingForm((prev) => ({
                                  ...prev,
                                  selectedRecipients: e.target.checked
                                    ? [...prev.selectedRecipients, recipient.email]
                                    : prev.selectedRecipients.filter((item) => item !== recipient.email),
                                }))
                              }
                            />
                          </label>
                        );
                      })}
                      {filteredMarketingRecipients.length === 0 && (
                        <p className="text-[11px] text-[#8a8477]">No matching recipients.</p>
                      )}
                    </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {(["email", "facebook", "instagram", "google"] as MarketingChannel[]).map((channel) => {
                    const active = marketingForm.channels.includes(channel);
                    return (
                      <button
                        key={channel}
                        type="button"
                        onClick={() =>
                          setMarketingForm((prev) => ({
                            ...prev,
                            channels: active
                              ? prev.channels.filter((item) => item !== channel)
                              : [...prev.channels, channel],
                          }))
                        }
                        className={`rounded-md border px-2.5 py-1 text-[11px] ${
                          active
                            ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                            : "border-[#d9d5cf] bg-white hover:bg-[#fdfcfb]"
                        }`}
                      >
                        {channel}
                      </button>
                    );
                  })}
                </div>
                <input
                  value={marketingForm.subject}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <textarea
                  value={marketingForm.message}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, message: e.target.value }))}
                  rows={4}
                  placeholder="Campaign message"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <textarea
                  value={marketingForm.facebookCopy}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, facebookCopy: e.target.value }))}
                  rows={2}
                  placeholder="Facebook draft copy"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <textarea
                  value={marketingForm.instagramCopy}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, instagramCopy: e.target.value }))}
                  rows={2}
                  placeholder="Instagram draft copy"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <textarea
                  value={marketingForm.googleCopy}
                  onChange={(e) => setMarketingForm((prev) => ({ ...prev, googleCopy: e.target.value }))}
                  rows={2}
                  placeholder="Google ads/search draft copy"
                  className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
                >
                  Save Campaign Draft
                </button>
              </form>
            </details>

            <details className="rounded-xl border border-[#ece8e2] p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Campaign Center
              </summary>
              <div className="mt-3 space-y-2">
                {marketingCampaignList.map((campaign) => (
                  <div key={campaign.id} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] p-3 text-[12px]">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-[#6b665e]">
                          {campaign.target} · {campaign.audience} · channels: {campaign.channels.join(", ")}
                        </p>
                        <p className="text-[#8a8477]">
                          Recipients:{" "}
                          {campaign.recipientMode === "specific"
                            ? `${campaign.selectedRecipients.length} specific`
                            : `${campaign.audience} list`}
                        </p>
                        <p className="text-[#8a8477]">
                          Status: {campaign.status}
                          {campaign.launchedAt ? ` · launched ${new Date(campaign.launchedAt).toLocaleString()}` : ""}
                          {campaign.recipientCount ? ` · recipients ${campaign.recipientCount}` : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => launchCampaign(campaign.id)}
                          className="rounded-md border border-[#1a1a1a] bg-[#1a1a1a] px-2.5 py-1 text-[11px] text-white hover:bg-[#2c2c2c]"
                        >
                          Launch
                        </button>
                        <button
                          type="button"
                          onClick={() => openCampaignEmailDraft(campaign)}
                          className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                        >
                          Email Blast
                        </button>
                        <button
                          type="button"
                          onClick={() => copyCampaignRecipients(campaign)}
                          className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                        >
                          Copy Recipients
                        </button>
                        <button
                          type="button"
                          onClick={() => exportCampaignRecipients(campaign)}
                          className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                        >
                          Export CSV
                        </button>
                      </div>
                    </div>
                    <p className="mt-2 text-[#6b665e]">
                      <span className="font-medium">Subject:</span> {campaign.subject}
                    </p>
                    <p className="mt-1 text-[#6b665e]">{campaign.message}</p>
                    <p className="mt-1 text-[#8a8477]">Facebook: {campaign.facebookCopy}</p>
                    <p className="mt-1 text-[#8a8477]">Instagram: {campaign.instagramCopy}</p>
                    <p className="mt-1 text-[#8a8477]">Google: {campaign.googleCopy}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {campaign.channels
                        .filter((channel) => channel !== "email")
                        .map((channel) => (
                          <button
                            key={`${campaign.id}-${channel}`}
                            type="button"
                            onClick={() => openExternalMarketing(channel, campaign)}
                            className="rounded-md border border-[#d9d5cf] bg-white px-2.5 py-1 text-[11px] hover:bg-[#fdfcfb]"
                          >
                            Open {channel}
                          </button>
                        ))}
                    </div>
                  </div>
                ))}
                {marketingCampaignList.length === 0 && (
                  <p className="text-[12px] text-[#8a8477]">No campaigns yet. Create your first campaign draft.</p>
                )}
              </div>
            </details>
          </div>
        )}

        {activeWorkspace === "members" && (
          <details id="quarterly-statements" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Quarterly Member Statements</summary>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div />
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
              <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto sm:max-h-[240px]">
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
              <div className="mt-2 max-h-[45vh] space-y-2 overflow-y-auto sm:max-h-[240px]">
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
          </details>
        )}

        {activeWorkspace === "finance" && (
          <details id="payouts-1099" className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Pro Payout + 1099 Tracking</summary>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div />
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
                  <button
                    key={row.proName}
                    type="button"
                    onClick={() => {
                      setSelectedFinanceProName(row.proName);
                      setPayoutForm((prev) => ({ ...prev, proName: row.proName }));
                      setAdminMsg(`Opened ${row.proName} payout details.`);
                    }}
                    className={`w-full rounded-lg border px-2.5 py-2 text-left text-[11px] transition-colors ${
                      selectedFinancePro?.displayName === row.proName
                        ? "border-[#1a1a1a] bg-[#1a1a1a] text-white"
                        : "border-[#ece8e2] bg-[#faf9f7] hover:bg-white"
                    }`}
                  >
                    <p className="font-medium">{row.proName}</p>
                    <p className={selectedFinancePro?.displayName === row.proName ? "text-white/80" : "text-[#6b665e]"}>
                      {row.count} payouts · {formatCurrency(row.total)}
                    </p>
                  </button>
                ))}
                {payoutSummary.length === 0 && <p className="text-[12px] text-[#8a8477]">No payouts recorded for {selectedTaxYear}.</p>}
              </div>
            </div>
          </div>
          </details>
        )}

        {activeWorkspace === "overview" && (
          <div className="mt-4">
            <details className="rounded-xl border border-[#ece8e2] bg-white p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Recent Activity Feed
              </summary>
              <div className="mt-3 space-y-2">
                {recentActivity.map((row, idx) => (
                  <div key={`${row.label}-${idx}`} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-[#6b665e]">{row.detail}</p>
                    <p className="text-[#8a8477]">{new Date(row.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}

        {activeWorkspace === "operations" && (
          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr]">
            <details className="rounded-xl border border-[#ece8e2] bg-white p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Manage Court Bookings
              </summary>
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
            </details>

            <details className="rounded-xl border border-[#ece8e2] bg-white p-4">
              <summary className="cursor-pointer text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
                Recent Activity Feed
              </summary>
              <div className="mt-3 space-y-2">
                {recentActivity.map((row, idx) => (
                  <div key={`${row.label}-${idx}`} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                    <p className="font-medium">{row.label}</p>
                    <p className="text-[#6b665e]">{row.detail}</p>
                    <p className="text-[#8a8477]">{new Date(row.at).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </details>
          </div>
        )}
      </div>
    </main>
  );
}
