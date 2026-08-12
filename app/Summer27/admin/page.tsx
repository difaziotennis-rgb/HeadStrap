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

type Tab = "today" | "members" | "book" | "ledger" | "program";

const TABS: { id: Tab; label: string; hint: string }[] = [
  { id: "today", label: "Today", hint: "On court" },
  { id: "members", label: "Members", hint: "Full file" },
  { id: "book", label: "Book", hint: "Add / edit" },
  { id: "ledger", label: "Ledger", hint: "Night" },
  { id: "program", label: "Program", hint: "Night" },
];

export default function Summer27DirectorPage() {
  const [tab, setTab] = useState<Tab>("today");
  const [flash, setFlash] = useState<string | null>(null);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);

  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);
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
    setBlocks(getAdminBlocks());
    setNotes(getMemberNotes());
    setCatalog(getCatalog());
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.setItem("s27_admin", "1");
    reload();
  }, []);

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
  const paidItems = [...courts, ...clinics, ...lessons, ...events, ...stringing];
  const revenue = paidItems.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + b.amount, 0);
  const pending = paidItems.filter((b) => b.paymentStatus === "pending").reduce((sum, b) => sum + b.amount, 0);
  const todayCount =
    courts.filter((b) => b.date === today).length +
    lessons.filter((b) => b.date === today).length +
    clinics.filter((b) => b.date === today).length +
    events.filter((b) => b.eventDate === today).length +
    stringing.filter((b) => (b.shopStatus || "in_shop") === "in_shop" || b.pickupDate === today).length +
    blocks.filter((b) => b.date === today).length;
  const unpaidToday = paidItems.filter((b) => {
    const date = "eventDate" in b ? b.eventDate : "pickupDate" in b && b.pickupDate ? b.pickupDate : "date" in b ? b.date : "";
    return date === today && b.paymentStatus === "pending";
  }).length;

  if (!authed) {
    return null;
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Director dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight">Summer ’27</h2>
          <p className="mt-1 text-[13px] text-[#6b665e]">Today for the court. Members and ledger when you have time.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/Summer27" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px] text-[#6b665e]">
            View site
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Today" value={String(todayCount)} />
        <Stat label="Unpaid today" value={String(unpaidToday)} />
        <Stat label="Paid (all)" value={`$${revenue}`} />
        <Stat label="Pending (all)" value={`$${pending}`} />
      </div>

      <div className="mt-4 flex flex-wrap gap-1 rounded-xl border border-[#e8e5df] bg-white p-1">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium ${
              tab === item.id ? "bg-[#1a1a1a] text-white" : "text-[#6b665e] hover:bg-[#faf9f7]"
            }`}
          >
            {item.label}
            <span className={`ml-1.5 text-[10px] uppercase tracking-[0.08em] ${tab === item.id ? "text-white/70" : "text-[#8a8477]"}`}>
              {item.hint}
            </span>
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
          notifyingId={notifyingStringId}
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
          onMarkStringingReady={markStringingReady}
          onMarkStringingPickedUp={markStringingPickedUp}
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

      {tab === "ledger" && (
        <Ledger
          today={today}
          courts={courts}
          clinics={clinics}
          lessons={lessons}
          events={events}
          stringing={stringing}
          onCourts={saveCourts}
          onClinics={saveClinics}
          onLessons={saveLessons}
          onEvents={saveEvents}
          onStringing={saveStringing}
        />
      )}

      {tab === "program" && (
        <ProgramSettings
          catalog={catalog}
          onSave={(next) => {
            saveCatalog(next);
            setCatalog(next);
            ping("Program settings saved. Public pages will use these values.");
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
      <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{label}</p>
      <p className="mt-1 text-xl font-medium">{value}</p>
    </div>
  );
}
