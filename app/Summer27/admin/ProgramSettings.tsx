"use client";

import { useEffect, useState } from "react";
import {
  BOOKING_HOURS,
  COURTS,
  clinicDayLabel,
  clinicTimeLabel,
  formatHour,
  formatPrettyDate,
  proScheduleLabel,
  type ClinicDef,
  type CourtId,
  type EventDef,
  type ProDef,
} from "../summer27-data";
import type { S27Catalog } from "../schedule";
import { normalizePrimeTeaching } from "../schedule";
import { Field, inputClass, uid } from "./ui";

type Props = {
  catalog: S27Catalog;
  onSave: (next: S27Catalog) => void;
  onReset: () => void;
};

type Category = "rates" | "pros" | "holds" | "clinics" | "events";

type Editor =
  | { kind: "pro"; id: string }
  | { kind: "clinic"; id: string }
  | { kind: "event"; id: string }
  | null;

const CATEGORIES: { id: Category; label: string; hint: string }[] = [
  { id: "rates", label: "Rates", hint: "Courts & stringing" },
  { id: "pros", label: "Pros", hint: "Staff & lessons" },
  { id: "holds", label: "Holds", hint: "Any hours" },
  { id: "clinics", label: "Clinics", hint: "Group sessions" },
  { id: "events", label: "Events", hint: "Calendar" },
];

const START_HOURS = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5);
const DURATIONS = [0.5, 1, 1.5, 2];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const PRO_TITLES = ["Director of Tennis", "Teaching Professional", "Junior Development Coach", "Junior Development", "Associate Pro"];
const EVENT_CATEGORIES = ["Social", "Competitive", "Junior", "Member", "Championship", "Tournament · Viewing", "Tennis Social", "Family"];

export default function ProgramSettings({ catalog, onSave, onReset }: Props) {
  const [draft, setDraft] = useState(() => ({
    ...catalog,
    primeTeaching: normalizePrimeTeaching(catalog.primeTeaching),
  }));
  const [category, setCategory] = useState<Category>("rates");
  const [editor, setEditor] = useState<Editor>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDraft({
      ...catalog,
      primeTeaching: normalizePrimeTeaching(catalog.primeTeaching),
    });
    setDirty(false);
    setEditor(null);
  }, [catalog]);

  useEffect(() => {
    if (!editor) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEditor(null);
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [editor]);

  function touch(next: S27Catalog) {
    setDraft(next);
    setDirty(true);
  }

  function updateClinic(id: string, patch: Partial<ClinicDef>) {
    touch({
      ...draft,
      clinics: draft.clinics.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function updateEvent(id: string, patch: Partial<EventDef>) {
    touch({
      ...draft,
      events: draft.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function updatePro(id: string, patch: Partial<ProDef>) {
    touch({
      ...draft,
      pros: (draft.pros || []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function addPro() {
    const next: ProDef = {
      id: uid("pro"),
      name: "New professional",
      title: "Teaching Professional",
      focus: "",
      bio: "",
      courtId: "court-2",
      memberRate: draft.lessonRates?.member || 160,
      guestRate: draft.lessonRates?.guest || 175,
      days: [1, 2, 3, 4, 5],
      windows: [
        { start: 9, end: 12 },
        { start: 16, end: 18 },
      ],
    };
    touch({ ...draft, pros: [...(draft.pros || []), next] });
    setEditor({ kind: "pro", id: next.id });
  }

  const editingPro = editor?.kind === "pro" ? (draft.pros || []).find((p) => p.id === editor.id) : null;
  const editingClinic = editor?.kind === "clinic" ? draft.clinics.find((c) => c.id === editor.id) : null;
  const editingEvent = editor?.kind === "event" ? draft.events.find((e) => e.id === editor.id) : null;

  return (
    <div className="mt-4 space-y-4 pb-24">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Settings</p>
        <h3 className="mt-0.5 text-xl font-semibold tracking-tight">Club program</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">Rates, staff, clinics, and events. Tap a row to edit.</p>
      </div>

      <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CATEGORIES.map((item) => {
          const active = category === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setCategory(item.id)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-left ${
                active ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#4a4a4a]"
              }`}
            >
              <span className="block text-[13px] font-medium">{item.label}</span>
              <span className={`block text-[10px] ${active ? "text-white/65" : "text-[#8a8477]"}`}>{item.hint}</span>
            </button>
          );
        })}
      </div>

      {category === "rates" && (
        <section className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Court & shop rates</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <Field label="Court · member $/hr">
              <input
                className={inputClass}
                inputMode="decimal"
                value={draft.courtRates.member}
                onChange={(e) =>
                  touch({ ...draft, courtRates: { ...draft.courtRates, member: Number(e.target.value) || 0 } })
                }
              />
            </Field>
            <Field label="Court · guest $/hr">
              <input
                className={inputClass}
                inputMode="decimal"
                value={draft.courtRates.guest}
                onChange={(e) =>
                  touch({ ...draft, courtRates: { ...draft.courtRates, guest: Number(e.target.value) || 0 } })
                }
              />
            </Field>
            <Field label="Stringing labor $">
              <input
                className={inputClass}
                inputMode="decimal"
                value={draft.stringingLabor}
                onChange={(e) => touch({ ...draft, stringingLabor: Number(e.target.value) || 0 })}
              />
            </Field>
          </div>
          <p className="mt-3 text-[12px] text-[#8a8477]">Pro lesson rates are set on each professional.</p>
        </section>
      )}

      {category === "pros" && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="flex items-center justify-between gap-2 border-b border-[#f0ede8] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Teaching staff</p>
            <button type="button" onClick={addPro} className="text-[12px] font-medium text-[#1a1a1a]">
              + Add pro
            </button>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {(draft.pros || []).map((pro) => (
              <li key={pro.id}>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "pro", id: pro.id })}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf9f7]"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{pro.name}</p>
                    <p className="mt-0.5 text-[12px] text-[#6b665e]">
                      {pro.title} · {COURTS.find((c) => c.id === pro.courtId)?.name} · ${pro.memberRate}/hr
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-[#8a8477]">{proScheduleLabel(pro)}</p>
                  </div>
                  <span className="shrink-0 text-[12px] text-[#8a8477]">Edit →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {category === "holds" && (
        <section className="space-y-3">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Recurring Court 3 holds</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              Weekday windows held for lessons — add any start/end, not just morning and evening. Remove a window to open
              that time. One-off holds and opens are under Book → Holds.
            </p>
            <ul className="mt-4 divide-y divide-[#f0ede8] overflow-hidden rounded-xl border border-[#ece8e2]">
              {draft.primeTeaching.windows.length === 0 ? (
                <li className="px-3 py-4 text-[13px] text-[#8a8477]">No recurring holds — Court 3 stays open on weekdays.</li>
              ) : (
                draft.primeTeaching.windows.map((w, i) => (
                  <li key={`${w.label}-${i}`} className="grid gap-2 bg-[#faf9f7] p-3 sm:grid-cols-[1fr_7rem_7rem_auto]">
                    <input
                      className={inputClass}
                      value={w.label}
                      onChange={(e) => {
                        const windows = draft.primeTeaching.windows.map((row, idx) =>
                          idx === i ? { ...row, label: e.target.value } : row
                        );
                        touch({ ...draft, primeTeaching: { windows } });
                      }}
                      placeholder="Reason / label"
                    />
                    <select
                      className={inputClass}
                      value={w.start}
                      onChange={(e) => {
                        const start = Number(e.target.value);
                        const windows = draft.primeTeaching.windows.map((row, idx) =>
                          idx === i ? { ...row, start, end: Math.max(row.end, start + 1) } : row
                        );
                        touch({ ...draft, primeTeaching: { windows } });
                      }}
                    >
                      {BOOKING_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    <select
                      className={inputClass}
                      value={w.end}
                      onChange={(e) => {
                        const end = Number(e.target.value);
                        const windows = draft.primeTeaching.windows.map((row, idx) =>
                          idx === i ? { ...row, end } : row
                        );
                        touch({ ...draft, primeTeaching: { windows } });
                      }}
                    >
                      {BOOKING_HOURS.filter((h) => h > w.start)
                        .concat([Math.max(...BOOKING_HOURS) + 1])
                        .map((h) => (
                          <option key={h} value={h}>
                            {formatHour(h)}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() =>
                        touch({
                          ...draft,
                          primeTeaching: {
                            windows: draft.primeTeaching.windows.filter((_, idx) => idx !== i),
                          },
                        })
                      }
                      className="rounded-lg border border-[#fecaca] px-3 py-2 text-[12px] font-medium text-[#991b1b]"
                    >
                      Remove
                    </button>
                  </li>
                ))
              )}
            </ul>
            <button
              type="button"
              onClick={() =>
                touch({
                  ...draft,
                  primeTeaching: {
                    windows: [
                      ...draft.primeTeaching.windows,
                      { start: 12, end: 14, label: "Midday hold" },
                    ],
                  },
                })
              }
              className="mt-3 w-full rounded-xl border border-dashed border-[#d6d1c8] py-2.5 text-[13px] font-medium text-[#4a4a4a] hover:bg-[#faf9f7]"
            >
              + Add time window
            </button>
          </div>
        </section>
      )}

      {category === "clinics" && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="border-b border-[#f0ede8] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Weekly clinics</p>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {draft.clinics.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "clinic", id: c.id })}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf9f7]"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{c.name}</p>
                    <p className="mt-0.5 text-[12px] text-[#6b665e]">
                      {clinicDayLabel(c.days)} · {clinicTimeLabel(c)} · ${c.memberPrice} / ${c.guestPrice}
                    </p>
                    <p className="mt-0.5 text-[11px] capitalize text-[#8a8477]">
                      {c.kind} · cap {c.capacity}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-[#8a8477]">Edit →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {category === "events" && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="border-b border-[#f0ede8] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Season events</p>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {draft.events.map((event) => (
              <li key={event.id}>
                <button
                  type="button"
                  onClick={() => setEditor({ kind: "event", id: event.id })}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf9f7]"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] font-medium">{event.title}</p>
                    <p className="mt-0.5 text-[12px] text-[#6b665e]">
                      {event.endDate ? `${formatPrettyDate(event.date)} – ${formatPrettyDate(event.endDate)}` : formatPrettyDate(event.date)} ·{" "}
                      {event.timeLabel}
                    </p>
                    <p className="mt-0.5 text-[11px] text-[#8a8477]">
                      {event.category} · ${event.memberPrice} / ${event.guestPrice} · cap {event.capacity}
                    </p>
                  </div>
                  <span className="shrink-0 text-[12px] text-[#8a8477]">Edit →</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e8e5df] bg-[#faf9f7]/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-2">
          <p className="text-[12px] text-[#8a8477]">{dirty ? "Unsaved changes" : "All changes saved"}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                onReset();
                setDirty(false);
                setEditor(null);
              }}
              className="rounded-xl border border-[#e8e5df] bg-white px-4 py-2.5 text-[13px] text-[#6b665e]"
            >
              Reset defaults
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draft);
                setDirty(false);
              }}
              className="rounded-xl bg-[#1a1a1a] px-4 py-2.5 text-[13px] font-medium text-white"
            >
              Save settings
            </button>
          </div>
        </div>
      </div>

      {editingPro && (
        <Sheet title={editingPro.name} subtitle="Professional" onClose={() => setEditor(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={editingPro.name} onChange={(e) => updatePro(editingPro.id, { name: e.target.value })} />
            </Field>
            <Field label="Title">
              <select
                className={inputClass}
                value={editingPro.title}
                onChange={(e) => updatePro(editingPro.id, { title: e.target.value })}
              >
                {[...PRO_TITLES, editingPro.title].filter((v, i, a) => a.indexOf(v) === i).map((title) => (
                  <option key={title} value={title}>
                    {title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Specialty">
              <input className={inputClass} value={editingPro.focus} onChange={(e) => updatePro(editingPro.id, { focus: e.target.value })} />
            </Field>
            <Field label="Court">
              <select
                className={inputClass}
                value={editingPro.courtId}
                onChange={(e) => updatePro(editingPro.id, { courtId: e.target.value as CourtId })}
              >
                {COURTS.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Booking mode">
              <select
                className={inputClass}
                value={editingPro.lessonMode || "schedule"}
                onChange={(e) =>
                  updatePro(editingPro.id, {
                    lessonMode: e.target.value === "request" ? "request" : "schedule",
                  })
                }
              >
                <option value="schedule">Open calendar</option>
                <option value="request">By request only</option>
              </select>
            </Field>
            <Field label="Member $/hr">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingPro.memberRate ?? ""}
                onChange={(e) => updatePro(editingPro.id, { memberRate: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Guest $/hr">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingPro.guestRate ?? ""}
                onChange={(e) => updatePro(editingPro.id, { guestRate: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[11px] text-[#8a8477]">Days</p>
              <div className="flex flex-wrap gap-1">
                {DAY_NAMES.map((label, day) => {
                  const on = editingPro.days.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        updatePro(editingPro.id, {
                          days: on
                            ? editingPro.days.filter((d) => d !== day)
                            : [...editingPro.days, day].sort((a, b) => a - b),
                        })
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-[12px] ${
                        on ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#6b665e]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            {(editingPro.windows[0] ? [0, 1] : [0]).map((index) => {
              const window = editingPro.windows[index] || { start: 9, end: 12 };
              return (
                <div key={index} className="grid grid-cols-2 gap-2 sm:col-span-2 sm:grid-cols-2">
                  <Field label={`Window ${index + 1} start`}>
                    <select
                      className={inputClass}
                      value={window.start}
                      onChange={(e) => {
                        const next = [...editingPro.windows];
                        next[index] = { ...(next[index] || window), start: Number(e.target.value) };
                        updatePro(editingPro.id, { windows: next });
                      }}
                    >
                      {BOOKING_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="End">
                    <select
                      className={inputClass}
                      value={window.end}
                      onChange={(e) => {
                        const next = [...editingPro.windows];
                        next[index] = { ...(next[index] || window), end: Number(e.target.value) };
                        updatePro(editingPro.id, { windows: next });
                      }}
                    >
                      {BOOKING_HOURS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              );
            })}
            <Field label="Short bio">
              <textarea
                className={inputClass}
                rows={3}
                value={editingPro.bio}
                onChange={(e) => updatePro(editingPro.id, { bio: e.target.value })}
              />
            </Field>
          </div>
          {(draft.pros || []).length > 1 && (
            <button
              type="button"
              onClick={() => {
                touch({ ...draft, pros: (draft.pros || []).filter((p) => p.id !== editingPro.id) });
                setEditor(null);
              }}
              className="mt-4 text-[13px] text-[#991b1b]"
            >
              Remove {editingPro.name}
            </button>
          )}
        </Sheet>
      )}

      {editingClinic && (
        <Sheet title={editingClinic.name} subtitle="Clinic" onClose={() => setEditor(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <input className={inputClass} value={editingClinic.name} onChange={(e) => updateClinic(editingClinic.id, { name: e.target.value })} />
            </Field>
            <Field label="Level / audience">
              <input className={inputClass} value={editingClinic.level} onChange={(e) => updateClinic(editingClinic.id, { level: e.target.value })} />
            </Field>
            <Field label="Kind">
              <select
                className={inputClass}
                value={editingClinic.kind}
                onChange={(e) => updateClinic(editingClinic.id, { kind: e.target.value as ClinicDef["kind"] })}
              >
                <option value="adult">Adult</option>
                <option value="junior">Junior</option>
              </select>
            </Field>
            <Field label="Start">
              <select
                className={inputClass}
                value={editingClinic.startHour}
                onChange={(e) => updateClinic(editingClinic.id, { startHour: Number(e.target.value) })}
              >
                {START_HOURS.map((h) => (
                  <option key={h} value={h}>
                    {formatHour(h)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Length">
              <select
                className={inputClass}
                value={editingClinic.durationHours}
                onChange={(e) => updateClinic(editingClinic.id, { durationHours: Number(e.target.value) })}
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d === 1 ? "1 hour" : `${d} hours`}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Capacity">
              <select
                className={inputClass}
                value={editingClinic.capacity}
                onChange={(e) => updateClinic(editingClinic.id, { capacity: Number(e.target.value) || 0 })}
              >
                {[6, 8, 10, 12, 16, editingClinic.capacity]
                  .filter((n, i, arr) => arr.indexOf(n) === i)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Member $">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingClinic.memberPrice}
                onChange={(e) => updateClinic(editingClinic.id, { memberPrice: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Guest $">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingClinic.guestPrice}
                onChange={(e) => updateClinic(editingClinic.id, { guestPrice: Number(e.target.value) || 0 })}
              />
            </Field>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[11px] text-[#8a8477]">Days</p>
              <div className="flex flex-wrap gap-1">
                {DAY_NAMES.map((label, day) => {
                  const on = editingClinic.days.includes(day);
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() =>
                        updateClinic(editingClinic.id, {
                          days: on
                            ? editingClinic.days.filter((d) => d !== day)
                            : [...editingClinic.days, day].sort((a, b) => a - b),
                        })
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-[12px] ${
                        on ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#6b665e]"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="sm:col-span-2">
              <p className="mb-1 text-[11px] text-[#8a8477]">Courts used</p>
              <div className="flex flex-wrap gap-1">
                {COURTS.map((c) => {
                  const on = editingClinic.blockCourts.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() =>
                        updateClinic(editingClinic.id, {
                          blockCourts: on
                            ? editingClinic.blockCourts.filter((id) => id !== c.id)
                            : [...editingClinic.blockCourts, c.id],
                        })
                      }
                      className={`rounded-lg px-2.5 py-1.5 text-[12px] ${
                        on ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#6b665e]"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <Field label="Description">
              <textarea
                className={inputClass}
                rows={3}
                value={editingClinic.description}
                onChange={(e) => updateClinic(editingClinic.id, { description: e.target.value })}
              />
            </Field>
          </div>
        </Sheet>
      )}

      {editingEvent && (
        <Sheet title={editingEvent.title} subtitle="Event" onClose={() => setEditor(null)}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <input className={inputClass} value={editingEvent.title} onChange={(e) => updateEvent(editingEvent.id, { title: e.target.value })} />
            </Field>
            <Field label="Category">
              <select
                className={inputClass}
                value={editingEvent.category}
                onChange={(e) => updateEvent(editingEvent.id, { category: e.target.value })}
              >
                {[...EVENT_CATEGORIES, editingEvent.category].filter((v, i, a) => a.indexOf(v) === i).map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={inputClass}
                value={editingEvent.date}
                onChange={(e) => updateEvent(editingEvent.id, { date: e.target.value })}
              />
            </Field>
            <Field label="Time label">
              <input
                className={inputClass}
                value={editingEvent.timeLabel}
                onChange={(e) => updateEvent(editingEvent.id, { timeLabel: e.target.value })}
                placeholder="Saturday · 4:00–7:00 PM"
              />
            </Field>
            <Field label="Member $">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingEvent.memberPrice}
                onChange={(e) => updateEvent(editingEvent.id, { memberPrice: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Guest $">
              <input
                className={inputClass}
                inputMode="decimal"
                value={editingEvent.guestPrice}
                onChange={(e) => updateEvent(editingEvent.id, { guestPrice: Number(e.target.value) || 0 })}
              />
            </Field>
            <Field label="Capacity">
              <select
                className={inputClass}
                value={editingEvent.capacity}
                onChange={(e) => updateEvent(editingEvent.id, { capacity: Number(e.target.value) || 0 })}
              >
                {[8, 12, 16, 20, 24, editingEvent.capacity]
                  .filter((n, i, arr) => arr.indexOf(n) === i)
                  .map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Description">
              <textarea
                className={inputClass}
                rows={3}
                value={editingEvent.description}
                onChange={(e) => updateEvent(editingEvent.id, { description: e.target.value })}
              />
            </Field>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function Sheet({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-[#1a1a1a]/30" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[78dvh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl sm:max-h-[85vh]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#ece8e2] px-4 py-3.5 sm:px-5">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">{subtitle}</p>
            <h3 className="mt-0.5 truncate text-lg font-semibold tracking-tight">{title}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e8e5df] text-[16px] leading-none text-[#6b665e] hover:bg-[#faf9f7]"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4 sm:px-5">{children}</div>
        <div className="border-t border-[#ece8e2] px-4 py-3 sm:px-5">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-[#1a1a1a] py-3 text-[14px] font-medium text-white"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
