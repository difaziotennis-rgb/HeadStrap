"use client";

import { useEffect, useMemo, useState } from "react";
import { STRING_OPTIONS, formatHour, formatPrettyDate, lessonProLabel } from "../summer27-data";
import { getPaymentProfile } from "../payments";
import { getLiveClinics } from "../schedule";
import {
  nextMemberNumber,
  saveStringPref,
  stringPrefForMember,
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import type { S27MemberNote } from "../schedule";
import { PaidPill, belongsToMember, inputClass } from "./ui";

type Props = {
  members: S27MemberAccount[];
  notes: S27MemberNote[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  charges: S27Charge[];
  selectedNumber: string | null;
  onSelect: (memberNumber: string | null) => void;
  onSave: (members: S27MemberAccount[], notes: S27MemberNote[]) => void;
};

type HistoryRow = {
  id: string;
  date: string;
  when: string;
  title: string;
  detail: string;
  amount: number;
  status: "paid" | "pending";
  method: string;
  kind: string;
};

function monthHeading(ym: string) {
  const [y, m] = ym.split("-").map(Number);
  if (!y || !m) return ym;
  return new Date(y, m - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function shortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function MemberFile({
  members,
  notes,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  charges,
  selectedNumber,
  onSelect,
  onSave,
}: Props) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", password: "tennis" });
  const [noteDraft, setNoteDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name: "", email: "", phone: "" });
  const [prefDraft, setPrefDraft] = useState({ racket: "", stringId: STRING_OPTIONS[0].id, tension: "52" });
  const [openMonth, setOpenMonth] = useState<string | null>(null);
  const q = query.trim().toLowerCase();
  const filtered = members
    .filter((m) => !q || `${m.name} ${m.email} ${m.memberNumber} ${m.phone}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const member = members.find((m) => m.memberNumber === selectedNumber) || null;

  useEffect(() => {
    setNoteDraft(notes.find((n) => n.memberNumber === selectedNumber)?.note || "");
    setEditing(false);
    setOpenMonth(null);
    const pref = stringPrefForMember(selectedNumber || undefined, stringing);
    if (pref) {
      const match = STRING_OPTIONS.find((s) => s.id === pref.stringId) || STRING_OPTIONS.find((s) => s.name === pref.stringName);
      setPrefDraft({
        racket: pref.racket,
        stringId: match?.id || STRING_OPTIONS[0].id,
        tension: String(pref.tension).replace(/[^\d.]/g, "") || pref.tension,
      });
    } else {
      setPrefDraft({ racket: "", stringId: STRING_OPTIONS[0].id, tension: "52" });
    }
  }, [selectedNumber, notes, stringing]);

  const file = useMemo(() => {
    if (!member) return null;
    const courtItems = courts.filter((b) => belongsToMember(member, b));
    const liveClinics = getLiveClinics();
    const clinicItems = clinics.filter((b) => belongsToMember(member, b));
    const lessonItems = lessons.filter((b) => belongsToMember(member, b));
    const eventItems = events.filter((b) => belongsToMember(member, { ...b, clientEmail: b.attendeeEmail }));
    const stringItems = stringing.filter((b) => belongsToMember(member, b));
    const chargeItems = charges.filter((b) => belongsToMember(member, b));

    const history: HistoryRow[] = [
      ...courtItems.map((b) => ({
        id: b.id,
        date: b.date,
        when: `${b.date} ${String(b.hour).padStart(2, "0")}`,
        title: b.courtName,
        detail: `${formatPrettyDate(b.date)} · ${formatHour(b.hour)} · ${b.durationHours}h`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Court",
      })),
      ...clinicItems.map((b) => {
        const start = liveClinics.find((c) => c.id === b.clinicId)?.startHour ?? 8;
        return {
          id: b.id,
          date: b.date,
          when: `${b.date} ${String(Math.floor(start)).padStart(2, "0")}`,
          title: b.clinicName,
          detail: `${formatPrettyDate(b.date)} · ${formatHour(start)}`,
          amount: b.amount,
          status: b.paymentStatus,
          method: b.paymentMethod,
          kind: "Clinic",
        };
      }),
      ...lessonItems
        .filter((b) => b.requestStatus !== "declined")
        .map((b) => ({
          id: b.id,
          date: b.date,
          when: `${b.date} ${String(b.hour).padStart(2, "0")}`,
          title: lessonProLabel(b),
          detail: `${formatPrettyDate(b.date)} · ${formatHour(b.hour)} · ${b.duration} min${
            b.requestStatus === "requested" ? " · requested" : ""
          }`,
          amount: b.amount,
          status: b.paymentStatus,
          method: b.paymentMethod,
          kind: "Lesson",
        })),
      ...eventItems.map((b) => ({
        id: b.id,
        date: b.eventDate,
        when: `${b.eventDate} 16`,
        title: b.eventTitle,
        detail: `${formatPrettyDate(b.eventDate)} · ${b.guestCount} spot${b.guestCount === 1 ? "" : "s"}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Event",
      })),
      ...stringItems.map((b) => ({
        id: b.id,
        date: b.pickupDate || b.createdAt.slice(0, 10),
        when: b.pickupDate || b.createdAt.slice(0, 10),
        title: `Stringing · ${b.racket}`,
        detail: `${b.stringName} @ ${b.tension}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Stringing",
      })),
      ...chargeItems.map((b) => ({
        id: b.id,
        date: b.date,
        when: `${b.date} 12`,
        title: b.description,
        detail: "Pro shop / misc",
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Charge",
      })),
    ].sort((a, b) => b.when.localeCompare(a.when));

    const today = new Date().toISOString().slice(0, 10);
    const upcoming = history.filter((row) => row.date >= today || row.status === "pending").reverse();
    const past = history.filter((row) => row.date < today && row.status !== "pending");

    const pastByMonth = (() => {
      const map = new Map<string, HistoryRow[]>();
      for (const row of past) {
        const key = row.date.slice(0, 7);
        const list = map.get(key);
        if (list) list.push(row);
        else map.set(key, [row]);
      }
      return Array.from(map.entries()).map(([key, items]) => ({
        key,
        label: monthHeading(key),
        items,
        total: items.reduce((s, r) => s + r.amount, 0),
        count: items.length,
      }));
    })();

    const paid = history.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
    const pending = history.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
    const card = getPaymentProfile(member.memberNumber);
    const stringPref = stringPrefForMember(member.memberNumber, stringItems);
    const note = notes.find((n) => n.memberNumber === member.memberNumber)?.note || "";
    const counts = {
      courts: courtItems.length,
      clinics: clinicItems.length,
      lessons: lessonItems.length,
      events: eventItems.length,
      stringing: stringItems.length,
      charges: chargeItems.length,
    };
    return { history, upcoming, pastByMonth, pastCount: past.length, paid, pending, card, stringPref, note, counts };
  }, [member, courts, clinics, lessons, events, stringing, charges, notes]);

  const activeMonth =
    openMonth && file?.pastByMonth.some((m) => m.key === openMonth) ? openMonth : file?.pastByMonth[0]?.key || null;

  function addMember(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.name.trim() || !draft.email.trim()) return;
    const next: S27MemberAccount = {
      memberNumber: nextMemberNumber(members),
      name: draft.name.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      password: draft.password || "tennis",
      createdAt: new Date().toISOString(),
    };
    onSave([...members, next], notes);
    setDraft({ name: "", email: "", phone: "", password: "tennis" });
    onSelect(next.memberNumber);
  }

  function saveNote() {
    if (!member) return;
    const nextNotes = notes.filter((n) => n.memberNumber !== member.memberNumber);
    if (noteDraft.trim()) {
      nextNotes.push({ memberNumber: member.memberNumber, note: noteDraft.trim(), updatedAt: new Date().toISOString() });
    }
    onSave(members, nextNotes);
  }

  function saveStringPreference() {
    if (!member) return;
    const option = STRING_OPTIONS.find((s) => s.id === prefDraft.stringId) || STRING_OPTIONS[0];
    saveStringPref({
      memberNumber: member.memberNumber,
      racket: prefDraft.racket.trim(),
      stringId: option.id,
      stringName: option.name,
      tension: prefDraft.tension.trim() || "52",
      updatedAt: new Date().toISOString(),
    });
    onSave(members, notes);
  }

  function saveContact() {
    if (!member) return;
    onSave(
      members.map((m) =>
        m.memberNumber === member.memberNumber ? { ...m, name: edit.name.trim() || m.name, email: edit.email.trim() || m.email, phone: edit.phone.trim() } : m
      ),
      notes
    );
    setEditing(false);
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-12">
      <div className="space-y-3 lg:col-span-4">
        <input
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search members"
        />
        <select
          className={inputClass}
          value={selectedNumber || ""}
          onChange={(e) => {
            onSelect(e.target.value || null);
            const m = members.find((x) => x.memberNumber === e.target.value);
            setNoteDraft(notes.find((n) => n.memberNumber === m?.memberNumber)?.note || "");
          }}
        >
          <option value="">Select a member</option>
          {filtered.map((m) => (
            <option key={m.memberNumber} value={m.memberNumber}>
              #{m.memberNumber} · {m.name}
            </option>
          ))}
        </select>
        <div className="max-h-[28rem] overflow-auto rounded-2xl border border-[#e8e5df] bg-white">
          {filtered.map((m) => (
            <button
              key={m.memberNumber}
              type="button"
              onClick={() => {
                onSelect(m.memberNumber);
                setNoteDraft(notes.find((n) => n.memberNumber === m.memberNumber)?.note || "");
              }}
              className={`block w-full border-b border-[#f0ede8] px-3 py-2.5 text-left last:border-0 ${
                m.memberNumber === selectedNumber ? "bg-[#faf9f7]" : ""
              }`}
            >
              <p className="text-[14px] font-medium">{m.name}</p>
              <p className="text-[12px] text-[#8a8477]">#{m.memberNumber}</p>
            </button>
          ))}
        </div>
        <form onSubmit={addMember} className="space-y-2 rounded-2xl border border-[#e8e5df] bg-white p-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Add member</p>
          <input className={inputClass} placeholder="Name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={inputClass} placeholder="Email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
          <input className={inputClass} placeholder="Phone" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
          <button className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[12px] font-medium text-white">Save member</button>
        </form>
      </div>

      <div className="lg:col-span-8">
        {!member || !file ? (
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 text-[13px] text-[#8a8477]">
            Pick a member to see their court time, clinics, lessons, events, stringing, and payment history.
          </div>
        ) : (
          <div className="space-y-4">
            <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Member #{member.memberNumber}</p>
              {editing ? (
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <input className={inputClass} value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                  <input className={inputClass} value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                  <input className={`${inputClass} sm:col-span-2`} value={edit.phone} onChange={(e) => setEdit({ ...edit, phone: e.target.value })} placeholder="Phone" />
                  <div className="flex gap-2 sm:col-span-2">
                    <button type="button" onClick={saveContact} className="rounded-lg bg-[#1a1a1a] px-3 py-1.5 text-[12px] text-white">
                      Save
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="text-[12px] text-[#8a8477]">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">{member.name}</h3>
                  <p className="mt-1 text-[13px] text-[#6b665e]">
                    {member.email}
                    {member.phone ? ` · ${member.phone}` : ""}
                  </p>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEdit({ name: member.name, email: member.email, phone: member.phone });
                        setEditing(true);
                      }}
                      className="text-[12px] text-[#6b665e]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirm(`Remove ${member.name}?`)) return;
                        onSelect(null);
                        onSave(
                          members.filter((m) => m.memberNumber !== member.memberNumber),
                          notes.filter((n) => n.memberNumber !== member.memberNumber)
                        );
                      }}
                      className="text-[12px] text-[#991b1b]"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
              <div className="mt-3 flex flex-wrap gap-2 text-[13px]">
                <span className="rounded-full bg-[#eef4ea] px-2.5 py-1 text-[#3d5c34]">Paid ${file.paid}</span>
                <span className="rounded-full bg-[#f7efe3] px-2.5 py-1 text-[#8a6230]">Pending ${file.pending}</span>
                {file.card && (
                  <span className="rounded-full border border-[#e8e5df] px-2.5 py-1 text-[#6b665e]">
                    {file.card.brand} •••• {file.card.last4}
                  </span>
                )}
                {file.stringPref && (
                  <span className="rounded-full border border-[#e8e5df] px-2.5 py-1 text-[#6b665e]">
                    {file.stringPref.stringName} @ {file.stringPref.tension}
                  </span>
                )}
              </div>
              <p className="mt-3 text-[13px] text-[#6b665e]">
                {file.counts.courts} court · {file.counts.clinics} clinic · {file.counts.lessons} lesson ·{" "}
                {file.counts.events} event · {file.counts.stringing} stringing · {file.counts.charges} charge
              </p>
              <textarea
                className={`${inputClass} mt-3`}
                rows={2}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Director note"
              />
              <button type="button" onClick={saveNote} className="mt-2 rounded-lg border border-[#e8e5df] px-3 py-1.5 text-[12px] text-[#6b665e]">
                Save note
              </button>
            </section>

            <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">String preference</p>
              {file.stringPref ? (
                <p className="mt-2 text-[14px] font-medium">
                  {file.stringPref.racket} · {file.stringPref.stringName} @ {file.stringPref.tension} lbs
                </p>
              ) : (
                <p className="mt-2 text-[13px] text-[#8a8477]">No restringing on file yet. Saved automatically after their next order.</p>
              )}
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <input className={inputClass} placeholder="Racket" value={prefDraft.racket} onChange={(e) => setPrefDraft({ ...prefDraft, racket: e.target.value })} />
                <select className={inputClass} value={prefDraft.stringId} onChange={(e) => setPrefDraft({ ...prefDraft, stringId: e.target.value })}>
                  {STRING_OPTIONS.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <select className={inputClass} value={prefDraft.tension} onChange={(e) => setPrefDraft({ ...prefDraft, tension: e.target.value })}>
                  {["48", "50", "52", "54", "56", "58"].map((t) => (
                    <option key={t} value={t}>{t} lbs</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={saveStringPreference} className="mt-2 rounded-lg border border-[#e8e5df] px-3 py-1.5 text-[12px] text-[#6b665e]">
                Save string setup
              </button>
            </section>

            <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Upcoming</p>
              {file.upcoming.length === 0 ? (
                <p className="mt-2 text-[13px] text-[#8a8477]">Nothing upcoming.</p>
              ) : (
                <ul className="mt-3 divide-y divide-[#f0ede8]">
                  {file.upcoming.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-start justify-between gap-2 py-2.5">
                      <div className="min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.1em] text-[#8a8477]">{row.kind}</p>
                        <p className="text-[14px] font-medium">{row.title}</p>
                        <p className="mt-0.5 text-[12px] text-[#6b665e]">{row.detail}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 text-[13px] text-[#6b665e]">
                        <span className="tabular-nums">${row.amount}</span>
                        <PaidPill status={row.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
              <div className="flex flex-wrap items-end justify-between gap-2 border-b border-[#f0ede8] px-4 py-3 sm:px-5">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Past charges</p>
                  <p className="mt-0.5 text-[13px] text-[#6b665e]">
                    {file.pastCount === 0
                      ? "No settled charges yet"
                      : `${file.pastCount} charge${file.pastCount === 1 ? "" : "s"} by month`}
                  </p>
                </div>
              </div>
              {file.pastByMonth.length === 0 ? (
                <p className="px-4 py-5 text-[13px] text-[#8a8477] sm:px-5">Nothing past yet.</p>
              ) : (
                <div>
                  {file.pastByMonth.map((month) => {
                    const open = month.key === activeMonth;
                    return (
                      <div key={month.key} className="border-b border-[#f0ede8] last:border-b-0">
                        <button
                          type="button"
                          onClick={() => setOpenMonth(open ? "" : month.key)}
                          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf9f7] sm:px-5"
                          aria-expanded={open}
                        >
                          <div className="min-w-0">
                            <p className="text-[15px] font-medium tracking-tight text-[#1a1a1a]">{month.label}</p>
                            <p className="mt-0.5 text-[12px] text-[#8a8477]">
                              {month.count} charge{month.count === 1 ? "" : "s"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-[14px] font-medium tabular-nums text-[#1a1a1a]">${month.total}</span>
                            <span className="text-[16px] leading-none text-[#8a8477]" aria-hidden>
                              {open ? "−" : "+"}
                            </span>
                          </div>
                        </button>
                        {open && (
                          <ul className="divide-y divide-[#f0ede8] border-t border-[#f0ede8] bg-[#faf9f7]/50">
                            {month.items.map((row) => (
                              <li
                                key={row.id}
                                className="flex flex-wrap items-start justify-between gap-3 px-4 py-2.5 sm:px-5"
                              >
                                <div className="min-w-0">
                                  <p className="text-[13px] font-medium text-[#1a1a1a]">
                                    <span className="text-[#8a8477]">{shortDate(row.date)}</span>
                                    <span className="text-[#cfc9bf]"> · </span>
                                    {row.title}
                                  </p>
                                  <p className="mt-0.5 text-[12px] text-[#6b665e]">
                                    {row.kind}
                                    {row.detail ? ` · ${row.detail}` : ""}
                                    <span className="text-[#8a8477]"> · {row.method}</span>
                                  </p>
                                </div>
                                <div className="flex shrink-0 items-center gap-2">
                                  <span className="text-[13px] tabular-nums text-[#4a4a4a]">${row.amount}</span>
                                  <PaidPill status={row.status} />
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
