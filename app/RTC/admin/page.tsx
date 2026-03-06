"use client";

import { useEffect, useMemo, useState } from "react";

const ADMIN_AUTH_KEY = "rtc_admin_auth_v1";
const ADMIN_PASSWORD = "admin";

const COURT_KEY = "rtc_court_bookings_v1";
const LESSON_KEY = "rtc_lesson_requests_v1";
const CLINIC_KEY = "rtc_clinic_bookings_v1";
const EVENT_KEY = "rtc_summer_event_reservations_v1";

type CourtBooking = {
  id: string;
  date: string;
  hour: number;
  blockStartHour: number;
  durationHours: 1 | 2 | 3;
  courtName: string;
  memberNumber?: string;
  clientName: string;
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

type MemberProfile = {
  memberNumber: string;
  name: string;
  visits: number;
  revenue: number;
};

type MonthStat = {
  key: string;
  label: string;
  revenue: number;
  visits: number;
  paid: number;
  pending: number;
};

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

function createMockData() {
  const courts: CourtBooking[] = [];
  const lessons: LessonBooking[] = [];
  const clinics: ClinicBooking[] = [];
  const events: EventReservation[] = [];
  const coaches = ["Derek DiFazio", "Robert Myerson", "Jay Behrke", "Jonah Berkowitz"];
  const courtNames = ["Indoor Court", "Court 1", "Court 2", "Court 3", "Court 4", "Court 5"];
  const members = ["101", "204", "318", "427", "536", "642"];

  for (let i = -14; i <= 0; i += 1) {
    const dt = new Date();
    dt.setMonth(dt.getMonth() + i);
    const dateValue = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(
      (i * -3) % 20 + 5
    ).padStart(2, "0")}`;
    for (let j = 0; j < 3; j += 1) {
      const id = `mock-court-${i}-${j}`;
      const memberNumber = members[(i + j + members.length) % members.length];
      const amount = 58 + ((i + j + 9) % 4) * 8;
      courts.push({
        id,
        date: dateValue,
        hour: 9 + j * 2,
        blockStartHour: 9 + j * 2,
        durationHours: (j % 3 === 0 ? 2 : 1) as 1 | 2 | 3,
        courtName: courtNames[(j + i + 9) % courtNames.length],
        memberNumber,
        clientName: `Member ${memberNumber}`,
        totalAmount: amount,
        paymentStatus: (j + i) % 5 === 0 ? "pending" : "paid",
        createdAt: makeDate(i, 5 + j),
      });
    }
    lessons.push({
      id: `mock-lesson-${i}`,
      coachName: coaches[(i + coaches.length) % coaches.length],
      slot: "Tue 5:00 PM",
      clientName: `Player ${Math.abs(i) + 1}`,
      clientEmail: `player${Math.abs(i) + 1}@example.com`,
      memberNumber: members[(i + 2 + members.length) % members.length],
      createdAt: makeDate(i, 10),
    });
    clinics.push({
      id: `mock-clinic-${i}`,
      clinicNames: ["Monday Nights with Derek"],
      clinicCount: 1,
      total: 75,
      clientName: `Clinic Member ${Math.abs(i) + 10}`,
      memberNumber: members[(i + 3 + members.length) % members.length],
      createdAt: makeDate(i, 12),
    });
    events.push({
      id: `mock-event-${i}`,
      eventTitle: i % 2 === 0 ? "Summer White Party" : "Twilight Mixed Doubles Mixer",
      eventDateLabel: "Aug 16",
      guestCount: 2 + (Math.abs(i) % 3),
      total: 120 + (Math.abs(i) % 3) * 30,
      attendeeName: `Guest ${Math.abs(i) + 1}`,
      memberNumber: members[(i + 4 + members.length) % members.length],
      createdAt: makeDate(i, 15),
    });
  }

  return { courts, lessons, clinics, events };
}

function BarChart({
  title,
  data,
}: {
  title: string;
  data: Array<{ label: string; value: number }>;
}) {
  const max = Math.max(1, ...data.map((item) => item.value));
  return (
    <div className="rounded-xl border border-[#ece8e2] p-4">
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{title}</p>
      <div className="mt-3 space-y-2">
        {data.map((item) => (
          <div key={item.label} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-[#6b665e]">
              <span>{item.label}</span>
              <span>{item.value.toLocaleString()}</span>
            </div>
            <div className="h-2 rounded-full bg-[#f1efea]">
              <div
                className="h-2 rounded-full bg-[#1a1a1a]"
                style={{ width: `${Math.max(5, (item.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RTCAdminPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [loginMsg, setLoginMsg] = useState<string | null>(null);

  const [courtBookings, setCourtBookings] = useState<CourtBooking[]>([]);
  const [lessonBookings, setLessonBookings] = useState<LessonBooking[]>([]);
  const [clinicBookings, setClinicBookings] = useState<ClinicBooking[]>([]);
  const [eventReservations, setEventReservations] = useState<EventReservation[]>([]);
  const [useMockData, setUseMockData] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAuthed(localStorage.getItem(ADMIN_AUTH_KEY) === "true");

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
  }, []);

  const mergedData = useMemo(() => {
    const mock = createMockData();
    return {
      courts: useMockData ? [...mock.courts, ...courtBookings] : courtBookings,
      lessons: useMockData ? [...mock.lessons, ...lessonBookings] : lessonBookings,
      clinics: useMockData ? [...mock.clinics, ...clinicBookings] : clinicBookings,
      events: useMockData ? [...mock.events, ...eventReservations] : eventReservations,
    };
  }, [courtBookings, lessonBookings, clinicBookings, eventReservations, useMockData]);

  const kpis = useMemo(() => {
    const revenueCourts = mergedData.courts.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const revenueClinics = mergedData.clinics.reduce((sum, b) => sum + (b.total || 0), 0);
    const revenueEvents = mergedData.events.reduce((sum, b) => sum + (b.total || 0), 0);
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
      const dt = new Date(item.createdAt);
      const month = map.get(monthKey(dt));
      if (!month) return;
      month.revenue += item.total || 0;
      month.visits += item.clinicCount || 1;
    });
    mergedData.events.forEach((item) => {
      const dt = new Date(item.createdAt);
      const month = map.get(monthKey(dt));
      if (!month) return;
      month.revenue += item.total || 0;
      month.visits += Math.max(1, item.guestCount || 1);
    });
    mergedData.lessons.forEach((item) => {
      const dt = new Date(item.createdAt);
      const month = map.get(monthKey(dt));
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

  const topMembers = useMemo(() => {
    const map = new Map<string, MemberProfile>();
    function bump(memberNumber: string | undefined, amount: number, name: string) {
      if (!memberNumber) return;
      const existing = map.get(memberNumber) || {
        memberNumber,
        name: name || `Member ${memberNumber}`,
        visits: 0,
        revenue: 0,
      };
      existing.visits += 1;
      existing.revenue += amount;
      map.set(memberNumber, existing);
    }

    mergedData.courts.forEach((item) => bump(item.memberNumber, item.totalAmount || 0, item.clientName));
    mergedData.lessons.forEach((item) => bump(item.memberNumber, 0, item.clientName));
    mergedData.clinics.forEach((item) => bump(item.memberNumber, item.total || 0, item.clientName));
    mergedData.events.forEach((item) => bump(item.memberNumber, item.total || 0, item.attendeeName));

    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [mergedData]);

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
    return rows.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, 14);
  }, [mergedData]);

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
              Complete visibility across bookings, lessons, clinics, events, payments, and member activity.
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

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Total Revenue</p>
            <p className="mt-1 text-[24px] font-semibold">{formatCurrency(kpis.totalRevenue)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Outstanding</p>
            <p className="mt-1 text-[24px] font-semibold">{formatCurrency(kpis.outstanding)}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Total Flow Entries</p>
            <p className="mt-1 text-[24px] font-semibold">{kpis.totalBookings}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Active Members</p>
            <p className="mt-1 text-[24px] font-semibold">{kpis.membersActive}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <BarChart
            title="Revenue by Month (12M)"
            data={monthly.map((m) => ({ label: m.label, value: Math.round(m.revenue) }))}
          />
          <BarChart
            title="Visits by Month (12M)"
            data={monthly.map((m) => ({ label: m.label, value: m.visits }))}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Seasonal Performance</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-[12px]">
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
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Yearly Summary</p>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[320px] text-left text-[12px]">
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
        </div>

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
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Top Member Activity</p>
            <div className="mt-3 space-y-2">
              {topMembers.map((member) => (
                <div key={member.memberNumber} className="rounded-lg border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[12px]">
                  <p className="font-medium">
                    {member.name} · Member #{member.memberNumber}
                  </p>
                  <p className="text-[#6b665e]">
                    Visits: {member.visits} · Revenue: {formatCurrency(member.revenue)}
                  </p>
                </div>
              ))}
              {topMembers.length === 0 && (
                <p className="text-[12px] text-[#8a8477]">No member activity yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
