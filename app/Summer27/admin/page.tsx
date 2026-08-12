"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  KEYS,
  loadList,
  loadRecord,
  nextMemberNumber,
  persistCourts,
  saveList,
  uniqueCourts,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import {
  BOOKING_HOURS,
  COURTS,
  clinicDayLabel,
  clinicTimeLabel,
  formatDateInput,
  formatHour,
  formatPrettyDate,
  type ClinicDef,
  type CourtId,
  type EventDef,
} from "../summer27-data";
import {
  defaultCatalog,
  getAdminBlocks,
  getCatalog,
  getLiveClinics,
  getLiveEvents,
  getMemberNotes,
  getProgramBlock,
  saveAdminBlocks,
  saveCatalog,
  saveMemberNotes,
  type S27AdminBlock,
  type S27Catalog,
  type S27MemberNote,
} from "../schedule";

type Tab =
  | "today"
  | "members"
  | "courts"
  | "clinics"
  | "lessons"
  | "events"
  | "stringing"
  | "holds"
  | "program";

type ClinicPatch = Partial<ClinicDef>;
type EventPatch = Partial<EventDef>;

const TABS: { id: Tab; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "members", label: "Members" },
  { id: "courts", label: "Courts" },
  { id: "clinics", label: "Clinics" },
  { id: "lessons", label: "Lessons" },
  { id: "events", label: "Events" },
  { id: "stringing", label: "Stringing" },
  { id: "holds", label: "Holds" },
  { id: "program", label: "Program" },
];

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export default function Summer27DirectorPage() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("today");
  const [query, setQuery] = useState("");
  const [flash, setFlash] = useState<string | null>(null);

  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);
  const [blocks, setBlocks] = useState<S27AdminBlock[]>([]);
  const [notes, setNotes] = useState<S27MemberNote[]>([]);
  const [catalog, setCatalog] = useState<S27Catalog>(defaultCatalog());

  function reload() {
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
    if (sessionStorage.getItem("s27_admin") === "1") setAuthed(true);
  }, []);

  useEffect(() => {
    if (authed) reload();
  }, [authed]);

  function ping(message: string) {
    setFlash(message);
    window.setTimeout(() => setFlash(null), 2500);
  }

  function login(e: React.FormEvent) {
    e.preventDefault();
    if (password === "admin" || password === "admin123") {
      sessionStorage.setItem("s27_admin", "1");
      setAuthed(true);
      return;
    }
    setError("Use admin or admin123.");
  }

  const today = formatDateInput(new Date());
  const q = query.trim().toLowerCase();
  const match = (value: string) => !q || value.toLowerCase().includes(q);

  const paidItems = [...courts, ...clinics, ...lessons, ...events, ...stringing];
  const revenue = paidItems.filter((b) => b.paymentStatus === "paid").reduce((sum, b) => sum + b.amount, 0);
  const pending = paidItems.filter((b) => b.paymentStatus === "pending").reduce((sum, b) => sum + b.amount, 0);

  const todayBoard = useMemo(() => {
    const rows: Array<{ time: number; label: string; detail: string; kind: string }> = [];
    for (const b of courts.filter((c) => c.date === today)) {
      rows.push({
        time: b.hour,
        kind: "Court",
        label: `${b.courtName} ${formatHour(b.hour)}`,
        detail: `${b.clientName} · $${b.amount} · ${b.paymentStatus}`,
      });
    }
    for (const b of lessons.filter((l) => l.date === today)) {
      rows.push({
        time: b.hour,
        kind: "Lesson",
        label: `Court 1 ${formatHour(b.hour)}`,
        detail: `${b.clientName} · ${b.duration} min · ${b.paymentStatus}`,
      });
    }
    for (const b of clinics.filter((c) => c.date === today)) {
      const def = catalog.clinics.find((c) => c.id === b.clinicId);
      rows.push({
        time: def?.startHour ?? 8,
        kind: "Clinic",
        label: b.clinicName,
        detail: `${b.clientName} · ${b.paymentStatus}`,
      });
    }
    for (const b of events.filter((e) => e.eventDate === today)) {
      rows.push({
        time: 16,
        kind: "Event",
        label: b.eventTitle,
        detail: `${b.attendeeName} ×${b.guestCount} · ${b.paymentStatus}`,
      });
    }
    for (const block of blocks.filter((b) => b.date === today)) {
      rows.push({
        time: block.startHour,
        kind: "Hold",
        label: `${block.courtId === "both" ? "Both courts" : block.courtId} ${formatHour(block.startHour)}`,
        detail: block.reason,
      });
    }
    return rows.sort((a, b) => a.time - b.time);
  }, [today, courts, lessons, clinics, events, blocks, catalog.clinics]);

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-16">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Summer ’27</p>
        <h2 className="mt-1 text-xl font-medium">Director desk</h2>
        <form onSubmit={login} className="mt-4 space-y-2">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
          />
          {error && <p className="text-[12px] text-[#991b1b]">{error}</p>}
          <button className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[13px] text-white">Enter</button>
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Director dashboard</p>
          <h2 className="text-2xl font-semibold tracking-tight">Summer ’27</h2>
          <p className="mt-1 text-[13px] text-[#6b665e]">Track, edit, and run Courts 1 &amp; 2 from one desk.</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/Summer27" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-1.5 text-[12px] text-[#6b665e]">
            View site
          </Link>
          <button
            type="button"
            onClick={() => {
              sessionStorage.removeItem("s27_admin");
              setAuthed(false);
            }}
            className="text-[12px] text-[#8a8477]"
          >
            Sign out
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Members" value={String(members.length)} />
        <Stat label="Paid" value={`$${revenue}`} />
        <Stat label="Pending" value={`$${pending}`} />
        <Stat label="Today’s items" value={String(todayBoard.length)} />
        <Stat label="Clinic seats today" value={String(clinics.filter((c) => c.date === today && c.paymentStatus === "paid").length)} />
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
          </button>
        ))}
      </div>

      {tab !== "today" && tab !== "program" && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, or member #"
          className="mt-3 w-full rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]"
        />
      )}
      {flash && <p className="mt-3 rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]">{flash}</p>}

      {tab === "today" && (
        <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{formatPrettyDate(today)}</p>
          {todayBoard.length === 0 ? (
            <p className="mt-3 text-[13px] text-[#8a8477]">Nothing on the board yet for today.</p>
          ) : (
            <ul className="mt-3 divide-y divide-[#f0ede8]">
              {todayBoard.map((row, i) => (
                <li key={`${row.label}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{row.kind}</p>
                    <p className="text-[14px] font-medium">{row.label}</p>
                  </div>
                  <p className="text-[13px] text-[#6b665e]">{row.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "members" && (
        <MembersTab
          members={members.filter((m) => match(`${m.name} ${m.email} ${m.memberNumber} ${m.phone}`))}
          notes={notes}
          onSave={(next, nextNotes) => {
            saveList(KEYS.members, next);
            saveMemberNotes(nextNotes);
            setMembers(next);
            setNotes(nextNotes);
            ping("Members updated.");
          }}
        />
      )}

      {tab === "courts" && (
        <CourtsTab
          courts={courts.filter((b) => match(`${b.clientName} ${b.clientEmail} ${b.courtName} ${b.memberNumber || ""}`))}
          allCourts={courts}
          onSave={(next) => {
            persistCourts(next);
            setCourts(next);
            ping("Court book updated.");
          }}
        />
      )}

      {tab === "clinics" && (
        <ClinicsTab
          bookings={clinics.filter((b) => match(`${b.clientName} ${b.clientEmail} ${b.clinicName} ${b.memberNumber || ""}`))}
          all={clinics}
          onSave={(next) => {
            saveList(KEYS.clinics, next);
            setClinics(next);
            ping("Clinic roster updated.");
          }}
        />
      )}

      {tab === "lessons" && (
        <LessonsTab
          lessons={lessons.filter((b) => match(`${b.clientName} ${b.clientEmail} ${b.memberNumber || ""} ${b.focus}`))}
          all={lessons}
          onSave={(next) => {
            saveList(KEYS.lessons, next);
            setLessons(next);
            ping("Lessons updated.");
          }}
        />
      )}

      {tab === "events" && (
        <EventsTab
          bookings={events.filter((b) => match(`${b.attendeeName} ${b.attendeeEmail} ${b.eventTitle} ${b.memberNumber || ""}`))}
          all={events}
          onSave={(next) => {
            saveList(KEYS.events, next);
            setEvents(next);
            ping("Event list updated.");
          }}
        />
      )}

      {tab === "stringing" && (
        <StringingTab
          orders={stringing.filter((b) => match(`${b.clientName} ${b.clientEmail} ${b.racket} ${b.stringName}`))}
          all={stringing}
          onSave={(next) => {
            saveList(KEYS.stringing, next);
            setStringing(next);
            ping("Stringing desk updated.");
          }}
        />
      )}

      {tab === "holds" && (
        <HoldsTab
          blocks={blocks}
          onSave={(next) => {
            saveAdminBlocks(next);
            setBlocks(next);
            ping("Court holds updated.");
          }}
        />
      )}

      {tab === "program" && (
        <ProgramTab
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-[11px] text-[#8a8477]">
      {label}
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass = "w-full rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[13px] text-[#1a1a1a]";

function MembersTab({
  members,
  notes,
  onSave,
}: {
  members: S27MemberAccount[];
  notes: S27MemberNote[];
  onSave: (members: S27MemberAccount[], notes: S27MemberNote[]) => void;
}) {
  const allMembers = loadList<S27MemberAccount>(KEYS.members);
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", password: "tennis" });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState({ name: "", email: "", phone: "", note: "" });

  function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;
    const next: S27MemberAccount = {
      memberNumber: nextMemberNumber(allMembers),
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      password: draft.password || "tennis",
      createdAt: new Date().toISOString(),
    };
    onSave([...allMembers, next], notes);
    setDraft({ name: "", email: "", phone: "", password: "tennis" });
  }

  function startEdit(m: S27MemberAccount) {
    setEditing(m.memberNumber);
    setEdit({
      name: m.name,
      email: m.email,
      phone: m.phone,
      note: notes.find((n) => n.memberNumber === m.memberNumber)?.note || "",
    });
  }

  function saveEdit(memberNumber: string) {
    const nextMembers = allMembers.map((m) =>
      m.memberNumber === memberNumber ? { ...m, name: edit.name, email: edit.email, phone: edit.phone } : m
    );
    const nextNotes = notes.filter((n) => n.memberNumber !== memberNumber);
    if (edit.note.trim()) {
      nextNotes.push({ memberNumber, note: edit.note.trim(), updatedAt: new Date().toISOString() });
    }
    onSave(nextMembers, nextNotes);
    setEditing(null);
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={addMember} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-5">
        <input className={inputClass} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <input className={inputClass} placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
        <input className={inputClass} placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
        <input className={inputClass} placeholder="Temp password" value={draft.password} onChange={(e) => setDraft({ ...draft, password: e.target.value })} />
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add member</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {members.length === 0 ? (
          <p className="p-4 text-[13px] text-[#8a8477]">No members match.</p>
        ) : (
          members.map((m) => (
            <div key={m.memberNumber} className="border-b border-[#f0ede8] p-4 last:border-0">
              {editing === m.memberNumber ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                  <input className={inputClass} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                  <input className={inputClass} value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} />
                  <input className={inputClass} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} placeholder="Director note" />
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="button" onClick={() => saveEdit(m.memberNumber)} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium">
                      #{m.memberNumber} · {m.name}
                    </p>
                    <p className="text-[12px] text-[#6b665e]">
                      {m.email}
                      {m.phone ? ` · ${m.phone}` : ""}
                    </p>
                    {notes.find((n) => n.memberNumber === m.memberNumber)?.note && (
                      <p className="mt-1 text-[12px] text-[#7a6230]">
                        Note: {notes.find((n) => n.memberNumber === m.memberNumber)?.note}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => startEdit(m)} className="text-[12px] text-[#6b665e]">
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Remove ${m.name}?`)) return;
                        onSave(
                          allMembers.filter((x) => x.memberNumber !== m.memberNumber),
                          notes.filter((n) => n.memberNumber !== m.memberNumber)
                        );
                      }}
                      className="text-[12px] text-[#991b1b]"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CourtsTab({
  courts,
  allCourts,
  onSave,
}: {
  courts: S27CourtBooking[];
  allCourts: S27CourtBooking[];
  onSave: (next: S27CourtBooking[]) => void;
}) {
  const [draft, setDraft] = useState({
    date: formatDateInput(new Date()),
    hour: "8",
    durationHours: "1",
    courtId: "court-1" as CourtId,
    clientName: "",
    clientEmail: "",
    amount: "40",
    paymentStatus: "paid" as "paid" | "pending",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<S27CourtBooking | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.clientName.trim()) return;
    const hour = Number(draft.hour);
    const durationHours = Number(draft.durationHours) as 1 | 2;
    const booking: S27CourtBooking = {
      id: uid("court"),
      date: draft.date,
      hour,
      durationHours,
      courtId: draft.courtId,
      courtName: COURTS.find((c) => c.id === draft.courtId)?.name || draft.courtId,
      clientName: draft.clientName.trim(),
      clientEmail: draft.clientEmail.trim(),
      clientPhone: "",
      amount: Number(draft.amount) || 0,
      paymentStatus: draft.paymentStatus,
      paymentMethod: "manual",
      createdAt: new Date().toISOString(),
    };
    onSave([...allCourts, booking]);
    setDraft({ ...draft, clientName: "", clientEmail: "" });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-4">
        <input type="date" className={inputClass} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        <select className={inputClass} value={draft.courtId} onChange={(e) => setDraft({ ...draft, courtId: e.target.value as CourtId })}>
          {COURTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select className={inputClass} value={draft.hour} onChange={(e) => setDraft({ ...draft, hour: e.target.value })}>
          {BOOKING_HOURS.map((h) => (
            <option key={h} value={h}>
              {formatHour(h)}
            </option>
          ))}
        </select>
        <select className={inputClass} value={draft.durationHours} onChange={(e) => setDraft({ ...draft, durationHours: e.target.value })}>
          <option value="1">1 hour</option>
          <option value="2">2 hours</option>
        </select>
        <input className={inputClass} placeholder="Player" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
        <input className={inputClass} placeholder="Email" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} />
        <input className={inputClass} placeholder="$" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        <select className={inputClass} value={draft.paymentStatus} onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as "paid" | "pending" })}>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white sm:col-span-4">Add court booking</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {courts.length === 0 ? (
          <p className="p-4 text-[13px] text-[#8a8477]">No court bookings.</p>
        ) : (
          courts
            .slice()
            .sort((a, b) => `${a.date}${a.hour}`.localeCompare(`${b.date}${b.hour}`))
            .map((b) => (
              <div key={b.id} className="border-b border-[#f0ede8] p-4 last:border-0">
                {editing === b.id && edit ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input type="date" className={inputClass} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                    <select className={inputClass} value={edit.courtId} onChange={(e) => setEdit({ ...edit, courtId: e.target.value as CourtId, courtName: COURTS.find((c) => c.id === e.target.value)?.name || edit.courtName })}>
                      {COURTS.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    <select className={inputClass} value={edit.hour} onChange={(e) => setEdit({ ...edit, hour: Number(e.target.value) })}>
                      {BOOKING_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    <input className={inputClass} value={edit.clientName} onChange={(e) => setEdit({ ...edit, clientName: e.target.value })} />
                    <input className={inputClass} value={edit.clientEmail} onChange={(e) => setEdit({ ...edit, clientEmail: e.target.value })} />
                    <input className={inputClass} value={String(edit.amount)} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) || 0 })} />
                    <select className={inputClass} value={edit.paymentStatus} onChange={(e) => setEdit({ ...edit, paymentStatus: e.target.value as "paid" | "pending" })}>
                      <option value="paid">Paid</option>
                      <option value="pending">Pending</option>
                    </select>
                    <div className="flex gap-2 sm:col-span-3">
                      <button type="button" onClick={() => { onSave(allCourts.map((x) => (x.id === edit.id ? edit : x))); setEditing(null); }} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">
                        Save
                      </button>
                      <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[14px] font-medium">
                        {b.courtName} · {formatPrettyDate(b.date)} {formatHour(b.hour)} ({b.durationHours}h)
                      </p>
                      <p className="text-[12px] text-[#6b665e]">
                        {b.clientName} · ${b.amount} · {b.paymentStatus}
                        {getProgramBlock(b.date, b.courtId, b.hour)?.type === "clinic" ? " · overlaps clinic" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => { setEditing(b.id); setEdit({ ...b }); }} className="text-[12px] text-[#6b665e]">
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onSave(allCourts.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))}
                        className="text-[12px] text-[#6b665e]"
                      >
                        Toggle paid
                      </button>
                      <button type="button" onClick={() => onSave(allCourts.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
        )}
      </div>
    </div>
  );
}

function ClinicsTab({
  bookings,
  all,
  onSave,
}: {
  bookings: S27ClinicBooking[];
  all: S27ClinicBooking[];
  onSave: (next: S27ClinicBooking[]) => void;
}) {
  const clinics = getLiveClinics();
  const [draft, setDraft] = useState({
    clinicId: clinics[0]?.id || "",
    date: formatDateInput(new Date()),
    clientName: "",
    clientEmail: "",
    amount: String(clinics[0]?.memberPrice || 50),
    paymentStatus: "paid" as "paid" | "pending",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<S27ClinicBooking | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const clinic = clinics.find((c) => c.id === draft.clinicId);
    if (!clinic || !draft.clientName.trim()) return;
    onSave([
      ...all,
      {
        id: uid("clinic"),
        clinicId: clinic.id,
        clinicName: clinic.name,
        date: draft.date,
        clientName: draft.clientName.trim(),
        clientEmail: draft.clientEmail.trim(),
        amount: Number(draft.amount) || 0,
        paymentStatus: draft.paymentStatus,
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft({ ...draft, clientName: "", clientEmail: "" });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <select className={inputClass} value={draft.clinicId} onChange={(e) => {
          const clinic = clinics.find((c) => c.id === e.target.value);
          setDraft({ ...draft, clinicId: e.target.value, amount: String(clinic?.memberPrice || draft.amount) });
        }}>
          {clinics.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input type="date" className={inputClass} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        <input className={inputClass} placeholder="Player" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
        <input className={inputClass} placeholder="Email" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} />
        <input className={inputClass} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        <select className={inputClass} value={draft.paymentStatus} onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as "paid" | "pending" })}>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white sm:col-span-3">Add to roster</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {bookings.length === 0 ? (
          <p className="p-4 text-[13px] text-[#8a8477]">No clinic signups.</p>
        ) : (
          bookings.map((b) => (
            <div key={b.id} className="border-b border-[#f0ede8] p-4 last:border-0">
              {editing === b.id && edit ? (
                <div className="grid gap-2 sm:grid-cols-3">
                  <input className={inputClass} value={edit.clientName} onChange={(e) => setEdit({ ...edit, clientName: e.target.value })} />
                  <input className={inputClass} value={edit.clientEmail} onChange={(e) => setEdit({ ...edit, clientEmail: e.target.value })} />
                  <input type="date" className={inputClass} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                  <input className={inputClass} value={String(edit.amount)} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) || 0 })} />
                  <select className={inputClass} value={edit.paymentStatus} onChange={(e) => setEdit({ ...edit, paymentStatus: e.target.value as "paid" | "pending" })}>
                    <option value="paid">Paid</option>
                    <option value="pending">Pending</option>
                  </select>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { onSave(all.map((x) => (x.id === edit.id ? edit : x))); setEditing(null); }} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save</button>
                    <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="text-[14px] font-medium">{b.clinicName}</p>
                    <p className="text-[12px] text-[#6b665e]">
                      {formatPrettyDate(b.date)} · {b.clientName} · ${b.amount} · {b.paymentStatus}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setEditing(b.id); setEdit({ ...b }); }} className="text-[12px] text-[#6b665e]">Edit</button>
                    <button type="button" onClick={() => onSave(all.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))} className="text-[12px] text-[#6b665e]">Toggle paid</button>
                    <button type="button" onClick={() => onSave(all.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">Delete</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function LessonsTab({
  lessons,
  all,
  onSave,
}: {
  lessons: S27LessonBooking[];
  all: S27LessonBooking[];
  onSave: (next: S27LessonBooking[]) => void;
}) {
  const [draft, setDraft] = useState({
    date: formatDateInput(new Date()),
    hour: "8",
    duration: "60" as "60" | "90",
    clientName: "",
    clientEmail: "",
    amount: "160",
    focus: "",
    paymentStatus: "paid" as "paid" | "pending",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<S27LessonBooking | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.clientName.trim()) return;
    onSave([
      ...all,
      {
        id: uid("lesson"),
        date: draft.date,
        hour: Number(draft.hour),
        duration: draft.duration,
        clientName: draft.clientName.trim(),
        clientEmail: draft.clientEmail.trim(),
        clientPhone: "",
        focus: draft.focus,
        amount: Number(draft.amount) || 0,
        paymentStatus: draft.paymentStatus,
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft({ ...draft, clientName: "", clientEmail: "", focus: "" });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <input type="date" className={inputClass} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        <select className={inputClass} value={draft.hour} onChange={(e) => setDraft({ ...draft, hour: e.target.value })}>
          {BOOKING_HOURS.map((h) => (
            <option key={h} value={h}>{formatHour(h)}</option>
          ))}
        </select>
        <select className={inputClass} value={draft.duration} onChange={(e) => setDraft({ ...draft, duration: e.target.value as "60" | "90" })}>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
        <input className={inputClass} placeholder="Player" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
        <input className={inputClass} placeholder="Email" value={draft.clientEmail} onChange={(e) => setDraft({ ...draft, clientEmail: e.target.value })} />
        <input className={inputClass} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        <input className={`${inputClass} sm:col-span-2`} placeholder="Focus / notes" value={draft.focus} onChange={(e) => setDraft({ ...draft, focus: e.target.value })} />
        <select className={inputClass} value={draft.paymentStatus} onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as "paid" | "pending" })}>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white sm:col-span-3">Add lesson</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {lessons.length === 0 ? <p className="p-4 text-[13px] text-[#8a8477]">No lessons.</p> : lessons.map((b) => (
          <div key={b.id} className="border-b border-[#f0ede8] p-4 last:border-0">
            {editing === b.id && edit ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <input type="date" className={inputClass} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                <select className={inputClass} value={edit.hour} onChange={(e) => setEdit({ ...edit, hour: Number(e.target.value) })}>
                  {BOOKING_HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
                </select>
                <input className={inputClass} value={edit.clientName} onChange={(e) => setEdit({ ...edit, clientName: e.target.value })} />
                <input className={inputClass} value={edit.focus} onChange={(e) => setEdit({ ...edit, focus: e.target.value })} />
                <input className={inputClass} value={String(edit.amount)} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) || 0 })} />
                <select className={inputClass} value={edit.paymentStatus} onChange={(e) => setEdit({ ...edit, paymentStatus: e.target.value as "paid" | "pending" })}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <div className="flex gap-2 sm:col-span-3">
                  <button type="button" onClick={() => { onSave(all.map((x) => (x.id === edit.id ? edit : x))); setEditing(null); }} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-medium">{formatPrettyDate(b.date)} {formatHour(b.hour)} · {b.duration} min</p>
                  <p className="text-[12px] text-[#6b665e]">{b.clientName} · ${b.amount} · {b.paymentStatus}{b.focus ? ` · ${b.focus}` : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditing(b.id); setEdit({ ...b }); }} className="text-[12px] text-[#6b665e]">Edit</button>
                  <button type="button" onClick={() => onSave(all.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))} className="text-[12px] text-[#6b665e]">Toggle paid</button>
                  <button type="button" onClick={() => onSave(all.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsTab({
  bookings,
  all,
  onSave,
}: {
  bookings: S27EventBooking[];
  all: S27EventBooking[];
  onSave: (next: S27EventBooking[]) => void;
}) {
  const liveEvents = getLiveEvents();
  const [draft, setDraft] = useState({
    eventId: liveEvents[0]?.id || "",
    attendeeName: "",
    attendeeEmail: "",
    guestCount: "1",
    amount: String(liveEvents[0]?.memberPrice || 45),
    paymentStatus: "paid" as "paid" | "pending",
  });
  const [editing, setEditing] = useState<string | null>(null);
  const [edit, setEdit] = useState<S27EventBooking | null>(null);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const event = liveEvents.find((x) => x.id === draft.eventId);
    if (!event || !draft.attendeeName.trim()) return;
    onSave([
      ...all,
      {
        id: uid("event"),
        eventId: event.id,
        eventTitle: event.title,
        eventDate: event.date,
        attendeeName: draft.attendeeName.trim(),
        attendeeEmail: draft.attendeeEmail.trim(),
        guestCount: Number(draft.guestCount) || 1,
        amount: Number(draft.amount) || 0,
        paymentStatus: draft.paymentStatus,
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft({ ...draft, attendeeName: "", attendeeEmail: "" });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <select className={inputClass} value={draft.eventId} onChange={(e) => {
          const event = liveEvents.find((x) => x.id === e.target.value);
          setDraft({ ...draft, eventId: e.target.value, amount: String(event?.memberPrice || draft.amount) });
        }}>
          {liveEvents.map((event) => (
            <option key={event.id} value={event.id}>{event.title}</option>
          ))}
        </select>
        <input className={inputClass} placeholder="Name" value={draft.attendeeName} onChange={(e) => setDraft({ ...draft, attendeeName: e.target.value })} />
        <input className={inputClass} placeholder="Email" value={draft.attendeeEmail} onChange={(e) => setDraft({ ...draft, attendeeEmail: e.target.value })} />
        <input className={inputClass} value={draft.guestCount} onChange={(e) => setDraft({ ...draft, guestCount: e.target.value })} placeholder="Spots" />
        <input className={inputClass} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        <select className={inputClass} value={draft.paymentStatus} onChange={(e) => setDraft({ ...draft, paymentStatus: e.target.value as "paid" | "pending" })}>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
        </select>
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white sm:col-span-3">Add reservation</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {bookings.length === 0 ? <p className="p-4 text-[13px] text-[#8a8477]">No event reservations.</p> : bookings.map((b) => (
          <div key={b.id} className="border-b border-[#f0ede8] p-4 last:border-0">
            {editing === b.id && edit ? (
              <div className="grid gap-2 sm:grid-cols-3">
                <input className={inputClass} value={edit.attendeeName} onChange={(e) => setEdit({ ...edit, attendeeName: e.target.value })} />
                <input className={inputClass} value={String(edit.guestCount)} onChange={(e) => setEdit({ ...edit, guestCount: Number(e.target.value) || 1 })} />
                <input className={inputClass} value={String(edit.amount)} onChange={(e) => setEdit({ ...edit, amount: Number(e.target.value) || 0 })} />
                <select className={inputClass} value={edit.paymentStatus} onChange={(e) => setEdit({ ...edit, paymentStatus: e.target.value as "paid" | "pending" })}>
                  <option value="paid">Paid</option>
                  <option value="pending">Pending</option>
                </select>
                <div className="flex gap-2 sm:col-span-2">
                  <button type="button" onClick={() => { onSave(all.map((x) => (x.id === edit.id ? edit : x))); setEditing(null); }} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">Save</button>
                  <button type="button" onClick={() => setEditing(null)} className="text-[12px] text-[#8a8477]">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-[14px] font-medium">{b.eventTitle}</p>
                  <p className="text-[12px] text-[#6b665e]">{b.attendeeName} ×{b.guestCount} · ${b.amount} · {b.paymentStatus}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEditing(b.id); setEdit({ ...b }); }} className="text-[12px] text-[#6b665e]">Edit</button>
                  <button type="button" onClick={() => onSave(all.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))} className="text-[12px] text-[#6b665e]">Toggle paid</button>
                  <button type="button" onClick={() => onSave(all.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">Delete</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StringingTab({
  orders,
  all,
  onSave,
}: {
  orders: S27StringingOrder[];
  all: S27StringingOrder[];
  onSave: (next: S27StringingOrder[]) => void;
}) {
  const [draft, setDraft] = useState({
    racket: "",
    stringName: "Synthetic gut",
    tension: "52",
    pickupDate: "",
    clientName: "",
    amount: "68",
    paymentStatus: "paid" as "paid" | "pending",
  });

  function add(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.racket.trim() || !draft.clientName.trim()) return;
    onSave([
      ...all,
      {
        id: uid("string"),
        racket: draft.racket.trim(),
        stringId: "custom",
        stringName: draft.stringName,
        tension: draft.tension,
        pickupDate: draft.pickupDate,
        clientName: draft.clientName.trim(),
        clientEmail: "",
        amount: Number(draft.amount) || 0,
        paymentStatus: draft.paymentStatus,
        paymentMethod: "manual",
        createdAt: new Date().toISOString(),
      },
    ]);
    setDraft({ ...draft, racket: "", clientName: "" });
  }

  return (
    <div className="mt-4 space-y-4">
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <input className={inputClass} placeholder="Racket" value={draft.racket} onChange={(e) => setDraft({ ...draft, racket: e.target.value })} />
        <input className={inputClass} placeholder="String" value={draft.stringName} onChange={(e) => setDraft({ ...draft, stringName: e.target.value })} />
        <input className={inputClass} placeholder="Tension" value={draft.tension} onChange={(e) => setDraft({ ...draft, tension: e.target.value })} />
        <input type="date" className={inputClass} value={draft.pickupDate} onChange={(e) => setDraft({ ...draft, pickupDate: e.target.value })} />
        <input className={inputClass} placeholder="Name" value={draft.clientName} onChange={(e) => setDraft({ ...draft, clientName: e.target.value })} />
        <input className={inputClass} value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} />
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white sm:col-span-3">Add order</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {orders.length === 0 ? <p className="p-4 text-[13px] text-[#8a8477]">No stringing orders.</p> : orders.map((b) => (
          <div key={b.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#f0ede8] p-4 last:border-0">
            <div>
              <p className="text-[14px] font-medium">{b.racket} · {b.stringName} @ {b.tension}</p>
              <p className="text-[12px] text-[#6b665e]">{b.clientName} · ${b.amount} · {b.paymentStatus}{b.pickupDate ? ` · pickup ${formatPrettyDate(b.pickupDate)}` : ""}</p>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => onSave(all.map((x) => (x.id === b.id ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" } : x)))} className="text-[12px] text-[#6b665e]">Toggle paid</button>
              <button type="button" onClick={() => onSave(all.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HoldsTab({
  blocks,
  onSave,
}: {
  blocks: S27AdminBlock[];
  onSave: (next: S27AdminBlock[]) => void;
}) {
  const [draft, setDraft] = useState({
    date: formatDateInput(new Date()),
    courtId: "both" as CourtId | "both",
    startHour: "8",
    durationHours: "1",
    reason: "Maintenance",
  });

  function add(e: React.FormEvent) {
    e.preventDefault();
    onSave([
      ...blocks,
      {
        id: uid("hold"),
        date: draft.date,
        courtId: draft.courtId,
        startHour: Number(draft.startHour),
        durationHours: Number(draft.durationHours) || 1,
        reason: draft.reason.trim() || "Director hold",
        createdAt: new Date().toISOString(),
      },
    ]);
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-[13px] text-[#6b665e]">
        Extra holds show as blocked time on the public court grid (in addition to clinics, events, and lesson hours).
      </p>
      <form onSubmit={add} className="grid gap-2 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:grid-cols-3">
        <input type="date" className={inputClass} value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
        <select className={inputClass} value={draft.courtId} onChange={(e) => setDraft({ ...draft, courtId: e.target.value as CourtId | "both" })}>
          <option value="both">Both courts</option>
          <option value="court-1">Court 1</option>
          <option value="court-2">Court 2</option>
        </select>
        <select className={inputClass} value={draft.startHour} onChange={(e) => setDraft({ ...draft, startHour: e.target.value })}>
          {BOOKING_HOURS.map((h) => <option key={h} value={h}>{formatHour(h)}</option>)}
        </select>
        <select className={inputClass} value={draft.durationHours} onChange={(e) => setDraft({ ...draft, durationHours: e.target.value })}>
          {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n === 1 ? "1 hour" : `${n} hours`}</option>)}
        </select>
        <input className={inputClass} placeholder="Reason" value={draft.reason} onChange={(e) => setDraft({ ...draft, reason: e.target.value })} />
        <button className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white">Add hold</button>
      </form>
      <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        {blocks.length === 0 ? <p className="p-4 text-[13px] text-[#8a8477]">No extra holds.</p> : blocks.map((b) => (
          <div key={b.id} className="flex flex-wrap items-start justify-between gap-2 border-b border-[#f0ede8] p-4 last:border-0">
            <div>
              <p className="text-[14px] font-medium">{formatPrettyDate(b.date)} · {formatHour(b.startHour)} · {b.durationHours}h</p>
              <p className="text-[12px] text-[#6b665e]">{b.courtId === "both" ? "Both courts" : b.courtId} · {b.reason}</p>
            </div>
            <button type="button" onClick={() => onSave(blocks.filter((x) => x.id !== b.id))} className="text-[12px] text-[#991b1b]">Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgramTab({
  catalog,
  onSave,
  onReset,
}: {
  catalog: S27Catalog;
  onSave: (next: S27Catalog) => void;
  onReset: () => void;
}) {
  const [draft, setDraft] = useState(catalog);
  useEffect(() => setDraft(catalog), [catalog]);

  function updateClinic(id: string, patch: ClinicPatch) {
    setDraft({
      ...draft,
      clinics: draft.clinics.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function updateEvent(id: string, patch: EventPatch) {
    setDraft({
      ...draft,
      events: draft.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Rates and teaching hours</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Court member $/hr">
            <input className={inputClass} value={draft.courtRates.member} onChange={(e) => setDraft({ ...draft, courtRates: { ...draft.courtRates, member: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Court guest $/hr">
            <input className={inputClass} value={draft.courtRates.guest} onChange={(e) => setDraft({ ...draft, courtRates: { ...draft.courtRates, guest: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Lesson member $/hr">
            <input className={inputClass} value={draft.lessonRates.member} onChange={(e) => setDraft({ ...draft, lessonRates: { ...draft.lessonRates, member: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Lesson guest $/hr">
            <input className={inputClass} value={draft.lessonRates.guest} onChange={(e) => setDraft({ ...draft, lessonRates: { ...draft.lessonRates, guest: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Stringing labor $">
            <input className={inputClass} value={draft.stringingLabor} onChange={(e) => setDraft({ ...draft, stringingLabor: Number(e.target.value) || 0 })} />
          </Field>
          <Field label="Lesson hold morning start">
            <input className={inputClass} value={draft.primeTeaching.morning.start} onChange={(e) => setDraft({ ...draft, primeTeaching: { ...draft.primeTeaching, morning: { ...draft.primeTeaching.morning, start: Number(e.target.value) || 0 } } })} />
          </Field>
          <Field label="Lesson hold morning end">
            <input className={inputClass} value={draft.primeTeaching.morning.end} onChange={(e) => setDraft({ ...draft, primeTeaching: { ...draft.primeTeaching, morning: { ...draft.primeTeaching.morning, end: Number(e.target.value) || 0 } } })} />
          </Field>
          <Field label="Lesson hold afternoon start-end">
            <div className="grid grid-cols-2 gap-2">
              <input className={inputClass} value={draft.primeTeaching.afternoon.start} onChange={(e) => setDraft({ ...draft, primeTeaching: { ...draft.primeTeaching, afternoon: { ...draft.primeTeaching.afternoon, start: Number(e.target.value) || 0 } } })} />
              <input className={inputClass} value={draft.primeTeaching.afternoon.end} onChange={(e) => setDraft({ ...draft, primeTeaching: { ...draft.primeTeaching, afternoon: { ...draft.primeTeaching.afternoon, end: Number(e.target.value) || 0 } } })} />
            </div>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics</p>
        <div className="mt-3 space-y-4">
          {draft.clinics.map((c) => (
            <div key={c.id} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[12px] text-[#8a8477]">{clinicDayLabel(c.days)} · {clinicTimeLabel(c)}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={c.name} onChange={(e) => updateClinic(c.id, { name: e.target.value })} />
                <input className={inputClass} value={c.level} onChange={(e) => updateClinic(c.id, { level: e.target.value })} />
                <input className={inputClass} value={c.memberPrice} onChange={(e) => updateClinic(c.id, { memberPrice: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={c.guestPrice} onChange={(e) => updateClinic(c.id, { guestPrice: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={c.capacity} onChange={(e) => updateClinic(c.id, { capacity: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={c.startHour} onChange={(e) => updateClinic(c.id, { startHour: Number(e.target.value) || 0 })} />
                <textarea className={`${inputClass} sm:col-span-2`} rows={2} value={c.description} onChange={(e) => updateClinic(c.id, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Events</p>
        <div className="mt-3 space-y-4">
          {draft.events.map((event) => (
            <div key={event.id} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={event.title} onChange={(e) => updateEvent(event.id, { title: e.target.value })} />
                <input type="date" className={inputClass} value={event.date} onChange={(e) => updateEvent(event.id, { date: e.target.value })} />
                <input className={inputClass} value={event.timeLabel} onChange={(e) => updateEvent(event.id, { timeLabel: e.target.value })} />
                <input className={inputClass} value={event.category} onChange={(e) => updateEvent(event.id, { category: e.target.value })} />
                <input className={inputClass} value={event.memberPrice} onChange={(e) => updateEvent(event.id, { memberPrice: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={event.guestPrice} onChange={(e) => updateEvent(event.id, { guestPrice: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={event.capacity} onChange={(e) => updateEvent(event.id, { capacity: Number(e.target.value) || 0 })} />
                <textarea className={`${inputClass} sm:col-span-2`} rows={2} value={event.description} onChange={(e) => updateEvent(event.id, { description: e.target.value })} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onSave(draft)} className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] font-medium text-white">
          Save program changes
        </button>
        <button type="button" onClick={onReset} className="rounded-lg border border-[#e8e5df] bg-white px-4 py-2 text-[13px] text-[#6b665e]">
          Reset to defaults
        </button>
      </div>
    </div>
  );
}
