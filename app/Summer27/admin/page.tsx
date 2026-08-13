"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  KEYS,
  loadList,
  loadRecord,
  persistCourts,
  saveList,
  uniqueCourts,
  ensureDerekMember,
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import { seedMockBookings } from "../mock-bookings";
import { formatDateInput } from "../summer27-data";
import {
  defaultCatalog,
  getAdminBlocks,
  getCatalog,
  getMemberNotes,
  saveAdminBlocks,
  saveCatalog,
  saveMemberNotes,
  type S27AdminBlock,
  type S27Catalog,
  type S27MemberNote,
} from "../schedule";
import TodayBoard from "./TodayBoard";
import MemberFile from "./MemberFile";
import BookDesk from "./BookDesk";
import Ledger from "./Ledger";
import ProgramSettings from "./ProgramSettings";
import StringingShop from "./StringingShop";
import ChargeDesk from "./ChargeDesk";
import AdminStats from "./AdminStats";

type Tab = "today" | "charge" | "shop" | "book" | "members" | "stats" | "money" | "settings";

/** Plain labels — no cryptic hints. Order matches how you run a day. */
const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Week" },
  { id: "charge", label: "Charge" },
  { id: "shop", label: "Stringing" },
  { id: "book", label: "Book" },
  { id: "members", label: "Members" },
  { id: "stats", label: "Stats" },
  { id: "money", label: "Finances" },
  { id: "settings", label: "Settings" },
];

export default function Summer27DirectorPage() {
  const [authed, setAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [adminPassword, setAdminPassword] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("today");
  const [flash, setFlash] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);
  const [charges, setCharges] = useState<S27Charge[]>([]);
  const [blocks, setBlocks] = useState<S27AdminBlock[]>([]);
  const [notes, setNotes] = useState<S27MemberNote[]>([]);
  const [catalog, setCatalog] = useState<S27Catalog>(defaultCatalog());
  const [notifyingStringId, setNotifyingStringId] = useState<string | null>(null);

  function reload() {
    try {
      seedMockBookings();
    } catch {
      // mock seed should never block the desk
    }
    try {
      ensureDerekMember();
    } catch {
      // keep going
    }
    setMembers(loadList<S27MemberAccount>(KEYS.members));
    setCourts(uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)));
    setClinics(loadList<S27ClinicBooking>(KEYS.clinics));
    setLessons(loadList<S27LessonBooking>(KEYS.lessons));
    setEvents(loadList<S27EventBooking>(KEYS.events));
    setStringing(loadList<S27StringingOrder>(KEYS.stringing));
    setCharges(loadList<S27Charge>(KEYS.charges));
    setBlocks(getAdminBlocks());
    setNotes(getMemberNotes());
    setCatalog(getCatalog());
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const ok = sessionStorage.getItem("s27_admin") === "1";
    setAuthed(ok);
    setAuthChecking(false);
    if (ok) reload();
  }, []);

  async function unlockAdmin(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    const res = await fetch("/api/summer27/admin-auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: adminPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) {
      setAuthError(data.error || "Incorrect password.");
      return;
    }
    sessionStorage.setItem("s27_admin", "1");
    setAuthed(true);
    reload();
  }

  function ping(message: string) {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 2500);
  }

  function saveCourts(next: S27CourtBooking[]) {
    persistCourts(next);
    setCourts(next);
  }
  function saveClinics(next: S27ClinicBooking[]) {
    saveList(KEYS.clinics, next);
    setClinics(next);
  }
  function saveLessons(next: S27LessonBooking[]) {
    saveList(KEYS.lessons, next);
    setLessons(next);
  }
  function saveEvents(next: S27EventBooking[]) {
    saveList(KEYS.events, next);
    setEvents(next);
  }
  function saveStringing(next: S27StringingOrder[]) {
    saveList(KEYS.stringing, next);
    setStringing(next);
  }
  function saveCharges(next: S27Charge[]) {
    saveList(KEYS.charges, next);
    setCharges(next);
  }

  async function markStringingReady(id: string) {
    const order = stringing.find((x) => x.id === id);
    if (!order) return;
    if (!order.clientEmail?.trim()) {
      ping("Add an email on this order before notifying.");
      return;
    }

    setNotifyingStringId(id);
    const readyAt = new Date().toISOString();
    let notifiedAt: string | undefined;

    try {
      const res = await fetch("/api/summer27/stringing-ready", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.id,
          clientName: order.clientName,
          clientEmail: order.clientEmail,
          racket: order.racket,
          stringName: order.stringName,
          tension: order.tension,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; emailed?: boolean; error?: string };
      if (res.ok && data.emailed !== false) {
        notifiedAt = readyAt;
        ping(`Ready — emailed ${order.clientName}.`);
      } else {
        ping(data.error ? `Marked ready. Email failed: ${data.error}` : "Marked ready. Email failed — text them.");
      }
    } catch {
      ping("Marked ready. Email failed — text them.");
    }

    saveStringing(
      stringing.map((x) =>
        x.id === id
          ? {
              ...x,
              shopStatus: "ready" as const,
              readyAt,
              notifiedAt: notifiedAt || x.notifiedAt,
            }
          : x
      )
    );
    setNotifyingStringId(null);
  }

  function markStringingPickedUp(id: string) {
    saveStringing(
      stringing.map((x) => (x.id === id ? { ...x, shopStatus: "picked_up" as const } : x))
    );
    ping("Marked picked up.");
  }

  function saveHolds(next: S27AdminBlock[]) {
    saveAdminBlocks(next);
    setBlocks(next);
  }

  const today = formatDateInput(new Date());

  if (authChecking) {
    return <main className="mx-auto max-w-md px-4 py-16 text-[13px] text-[#8a8477]">Loading desk…</main>;
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-md px-4 py-16">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Director desk</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Sign in</h2>
        <p className="mt-2 text-[13px] text-[#6b665e]">
          Set <code className="text-[12px]">S27_ADMIN_PASSWORD</code> in Vercel for production. Until then, demo passwords{" "}
          <code className="text-[12px]">admin</code> / <code className="text-[12px]">admin123</code> work.
        </p>
        <form onSubmit={unlockAdmin} className="mt-5 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <input
            type="password"
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
            autoComplete="current-password"
          />
          {authError && <p className="text-[13px] text-[#991b1b]">{authError}</p>}
          <button type="submit" className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white">
            Unlock
          </button>
        </form>
        <Link href="/Summer27" className="mt-4 inline-block text-[12px] text-[#8a8477] hover:text-[#1a1a1a]">
          ← Back to site
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Director desk</p>
          <h2 className="text-2xl font-semibold tracking-tight">Run the club</h2>
          <p className="mt-1 text-[13px] text-[#6b665e]">
            Week view, charge desk, stringing — Stats for activity, Finances for what’s been charged.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/Summer27" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px] text-[#6b665e]">
            View site
          </Link>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-[#e8e5df] bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium ${
              tab === item.id ? "bg-[#1a1a1a] text-white" : "text-[#6b665e] hover:bg-[#faf9f7]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {flash && <p className="mt-3 rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]">{flash}</p>}

      {tab === "today" && (
        <TodayBoard
          today={today}
          members={members}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          blocks={blocks}
          catalog={catalog}
          onOpenMember={(memberNumber) => {
            setSelectedMember(memberNumber);
            setTab("members");
          }}
          onToggleCourt={(id) =>
            saveCourts(courts.map((x) => (x.id === id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))
          }
          onToggleClinic={(id) =>
            saveClinics(clinics.map((x) => (x.id === id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))
          }
          onToggleLesson={(id) =>
            saveLessons(lessons.map((x) => (x.id === id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))
          }
          onAcceptLessonRequest={(id) =>
            saveLessons(lessons.map((x) => (x.id === id ? { ...x, requestStatus: "accepted" as const } : x)))
          }
          onDeclineLessonRequest={(id) =>
            saveLessons(lessons.map((x) => (x.id === id ? { ...x, requestStatus: "declined" as const } : x)))
          }
          onToggleEvent={(id) =>
            saveEvents(events.map((x) => (x.id === id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))
          }
          onToggleStringing={(id) =>
            saveStringing(stringing.map((x) => (x.id === id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))
          }
          onWeatherClose={(result) => {
            saveCourts(result.courts);
            saveClinics(result.clinics);
            saveLessons(result.lessons);
            saveHolds(result.blocks);
            saveCharges([...result.charges, ...charges]);
            ping(
              `Weather close · ${result.emailed} emailed · ${result.refunded} refund${result.refunded === 1 ? "" : "s"}.`
            );
          }}
        />
      )}

      {tab === "charge" && (
        <ChargeDesk
          members={members}
          charges={charges}
          onCharges={(next) => {
            saveCharges(next);
            ping("Charge saved.");
          }}
        />
      )}

      {tab === "shop" && (
        <StringingShop
          stringing={stringing}
          notifyingId={notifyingStringId}
          onMarkReady={markStringingReady}
          onMarkPickedUp={markStringingPickedUp}
        />
      )}

      {tab === "book" && (
        <BookDesk
          members={members}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          blocks={blocks}
          onCourts={(next) => {
            saveCourts(next);
            ping("Court book updated.");
          }}
          onClinics={(next) => {
            saveClinics(next);
            ping("Clinic roster updated.");
          }}
          onLessons={(next) => {
            saveLessons(next);
            ping("Lessons updated.");
          }}
          onEvents={(next) => {
            saveEvents(next);
            ping("Event list updated.");
          }}
          onStringing={(next) => {
            saveStringing(next);
            ping("Stringing desk updated.");
          }}
          onHolds={(next) => {
            saveHolds(next);
            ping("Court holds updated.");
          }}
        />
      )}

      {tab === "members" && (
        <MemberFile
          members={members}
          notes={notes}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          charges={charges}
          selectedNumber={selectedMember}
          onSelect={setSelectedMember}
          onSave={(next, nextNotes) => {
            saveList(KEYS.members, next);
            saveMemberNotes(nextNotes);
            setMembers(next);
            setNotes(nextNotes);
            ping("Member file saved.");
          }}
        />
      )}

      {tab === "stats" && (
        <AdminStats
          today={today}
          clinicsCatalog={catalog.clinics}
          pros={catalog.pros}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          charges={charges}
        />
      )}

      {tab === "money" && (
        <Ledger
          today={today}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          charges={charges}
        />
      )}

      {tab === "settings" && (
        <ProgramSettings
          catalog={catalog}
          onSave={(next) => {
            saveCatalog(next);
            setCatalog(next);
            ping("Settings saved.");
          }}
          onReset={() => {
            const next = defaultCatalog();
            saveCatalog(next);
            setCatalog(next);
            ping("Reset to original Summer ’27 program.");
          }}
        />
      )}
    </main>
  );
}
