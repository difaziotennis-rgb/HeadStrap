"use client";

import { useEffect, useMemo, useState } from "react";
import { formatHour, formatPrettyDate } from "../summer27-data";
import { getPaymentProfile } from "../payments";
import { getLiveClinics } from "../schedule";
import {
  nextMemberNumber,
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
  selectedNumber: string | null;
  onSelect: (memberNumber: string | null) => void;
  onSave: (members: S27MemberAccount[], notes: S27MemberNote[]) => void;
};

export default function MemberFile({
  members,
  notes,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  selectedNumber,
  onSelect,
  onSave,
}: Props) {
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState({ name: "", email: "", phone: "", password: "tennis" });
  const [noteDraft, setNoteDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ name: "", email: "", phone: "" });
  const q = query.trim().toLowerCase();
  const filtered = members
    .filter((m) => !q || `${m.name} ${m.email} ${m.memberNumber} ${m.phone}`.toLowerCase().includes(q))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));
  const member = members.find((m) => m.memberNumber === selectedNumber) || null;

  useEffect(() => {
    setNoteDraft(notes.find((n) => n.memberNumber === selectedNumber)?.note || "");
    setEditing(false);
  }, [selectedNumber, notes]);

  const file = useMemo(() => {
    if (!member) return null;
    const courtItems = courts.filter((b) => belongsToMember(member, b));
    const liveClinics = getLiveClinics();
    const clinicItems = clinics.filter((b) => belongsToMember(member, b));
    const lessonItems = lessons.filter((b) => belongsToMember(member, b));
    const eventItems = events.filter((b) => belongsToMember(member, { ...b, clientEmail: b.attendeeEmail }));
    const stringItems = stringing.filter((b) => belongsToMember(member, b));
    const history = [
      ...courtItems.map((b) => ({
        id: b.id,
        when: `${b.date} ${String(b.hour).padStart(2, "0")}`,
        label: `${b.courtName} · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Court",
      })),
      ...clinicItems.map((b) => {
        const start = liveClinics.find((c) => c.id === b.clinicId)?.startHour ?? 8;
        return {
          id: b.id,
          when: `${b.date} ${String(Math.floor(start)).padStart(2, "0")}`,
          label: `${b.clinicName} · ${formatPrettyDate(b.date)} ${formatHour(start)}`,
          amount: b.amount,
          status: b.paymentStatus,
          method: b.paymentMethod,
          kind: "Clinic",
        };
      }),
      ...lessonItems.map((b) => ({
        id: b.id,
        when: `${b.date} ${String(b.hour).padStart(2, "0")}`,
        label: `Lesson · ${formatPrettyDate(b.date)} ${formatHour(b.hour)}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Lesson",
      })),
      ...eventItems.map((b) => ({
        id: b.id,
        when: `${b.eventDate} 16`,
        label: `${b.eventTitle} · ${b.guestCount} spot(s)`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Event",
      })),
      ...stringItems.map((b) => ({
        id: b.id,
        when: b.pickupDate || b.createdAt.slice(0, 10),
        label: `Stringing · ${b.racket}`,
        amount: b.amount,
        status: b.paymentStatus,
        method: b.paymentMethod,
        kind: "Stringing",
      })),
    ].sort((a, b) => b.when.localeCompare(a.when));
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = history.filter((row) => row.when.slice(0, 10) >= today).reverse();
    const paid = history.filter((r) => r.status === "paid").reduce((s, r) => s + r.amount, 0);
    const pending = history.filter((r) => r.status === "pending").reduce((s, r) => s + r.amount, 0);
    const card = getPaymentProfile(member.memberNumber);
    const note = notes.find((n) => n.memberNumber === member.memberNumber)?.note || "";
    const counts = {
      courts: courtItems.length,
      clinics: clinicItems.length,
      lessons: lessonItems.length,
      events: eventItems.length,
      stringing: stringItems.length,
    };
    return { history, upcoming, paid, pending, card, note, counts };
  }, [member, courts, clinics, lessons, events, stringing, notes]);

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
              </div>
              <p className="mt-3 text-[13px] text-[#6b665e]">
                {file.counts.courts} court · {file.counts.clinics} clinic · {file.counts.lessons} lesson · {file.counts.events} event · {file.counts.stringing} stringing
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
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Signed up</p>
              {file.upcoming.length === 0 ? (
                <p className="mt-2 text-[13px] text-[#8a8477]">Nothing upcoming.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#f0ede8]">
                  {file.upcoming.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                      <div>
                        <p className="text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">{row.kind}</p>
                        <p className="text-[14px] font-medium">{row.label}</p>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[#6b665e]">
                        ${row.amount}
                        <PaidPill status={row.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Payment history</p>
              {file.history.length === 0 ? (
                <p className="mt-2 text-[13px] text-[#8a8477]">No charges yet.</p>
              ) : (
                <ul className="mt-2 divide-y divide-[#f0ede8]">
                  {file.history.map((row) => (
                    <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                      <div>
                        <p className="text-[14px] font-medium">{row.label}</p>
                        <p className="text-[12px] text-[#8a8477]">
                          {row.kind} · {row.method}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-[13px] text-[#6b665e]">
                        ${row.amount}
                        <PaidPill status={row.status} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
