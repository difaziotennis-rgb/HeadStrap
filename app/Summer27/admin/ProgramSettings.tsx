"use client";

import { useEffect, useState } from "react";
import {
  BOOKING_HOURS,
  COURTS,
  clinicDayLabel,
  clinicTimeLabel,
  formatHour,
  proScheduleLabel,
  type ClinicDef,
  type CourtId,
  type EventDef,
  type ProDef,
} from "../summer27-data";
import type { S27Catalog } from "../schedule";
import { Field, inputClass, uid } from "./ui";

type Props = {
  catalog: S27Catalog;
  onSave: (next: S27Catalog) => void;
  onReset: () => void;
};

const START_HOURS = Array.from({ length: 25 }, (_, i) => 8 + i * 0.5);
const DURATIONS = [1, 1.5, 2];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ProgramSettings({ catalog, onSave, onReset }: Props) {
  const [draft, setDraft] = useState(catalog);
  useEffect(() => setDraft(catalog), [catalog]);

  function updateClinic(id: string, patch: Partial<ClinicDef>) {
    setDraft({
      ...draft,
      clinics: draft.clinics.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  }

  function updateEvent(id: string, patch: Partial<EventDef>) {
    setDraft({
      ...draft,
      events: draft.events.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    });
  }

  function updatePro(id: string, patch: Partial<ProDef>) {
    setDraft({
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
    setDraft({ ...draft, pros: [...(draft.pros || []), next] });
  }

  return (
    <div className="mt-4 space-y-4">
      <p className="text-[13px] text-[#6b665e]">
        Night settings — staff, rates, clinic times, and event copy. Public pages use whatever you save here.
      </p>
      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Rates</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Court member $/hr">
            <input className={inputClass} value={draft.courtRates.member} onChange={(e) => setDraft({ ...draft, courtRates: { ...draft.courtRates, member: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Court guest $/hr">
            <input className={inputClass} value={draft.courtRates.guest} onChange={(e) => setDraft({ ...draft, courtRates: { ...draft.courtRates, guest: Number(e.target.value) || 0 } })} />
          </Field>
          <Field label="Stringing labor $">
            <input className={inputClass} value={draft.stringingLabor} onChange={(e) => setDraft({ ...draft, stringingLabor: Number(e.target.value) || 0 })} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Teaching staff</p>
          <button type="button" onClick={addPro} className="text-[12px] text-[#6b665e]">
            Add professional
          </button>
        </div>
        <div className="mt-3 space-y-4">
          {(draft.pros || []).map((pro) => (
            <div key={pro.id} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[12px] text-[#8a8477]">{proScheduleLabel(pro)}</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={pro.name} onChange={(e) => updatePro(pro.id, { name: e.target.value })} />
                <select className={inputClass} value={pro.title} onChange={(e) => updatePro(pro.id, { title: e.target.value })}>
                  {["Director of Tennis", "Teaching Professional", "Junior Development", "Associate Pro", pro.title]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((title) => (
                      <option key={title} value={title}>{title}</option>
                    ))}
                </select>
                <input className={inputClass} value={pro.focus} onChange={(e) => updatePro(pro.id, { focus: e.target.value })} placeholder="Specialty" />
                <select className={inputClass} value={pro.courtId} onChange={(e) => updatePro(pro.id, { courtId: e.target.value as CourtId })}>
                  {COURTS.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <Field label="Member $/hr">
                  <input className={inputClass} value={pro.memberRate ?? ""} onChange={(e) => updatePro(pro.id, { memberRate: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Guest $/hr">
                  <input className={inputClass} value={pro.guestRate ?? ""} onChange={(e) => updatePro(pro.id, { guestRate: Number(e.target.value) || 0 })} />
                </Field>
                <div className="sm:col-span-2">
                  <p className="mb-1 text-[11px] text-[#8a8477]">Days</p>
                  <div className="flex flex-wrap gap-1">
                    {DAY_NAMES.map((label, day) => {
                      const on = pro.days.includes(day);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() =>
                            updatePro(pro.id, {
                              days: on ? pro.days.filter((d) => d !== day) : [...pro.days, day].sort((a, b) => a - b),
                            })
                          }
                          className={`rounded-lg px-2 py-1 text-[11px] ${on ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#6b665e]"}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {(pro.windows[0] ? [0, 1] : [0]).map((index) => {
                  const window = pro.windows[index] || { start: 9, end: 12 };
                  return (
                    <div key={index} className="grid grid-cols-2 gap-2">
                      <Field label={index === 0 ? "Window 1 start" : "Window 2 start"}>
                        <select
                          className={inputClass}
                          value={window.start}
                          onChange={(e) => {
                            const next = [...pro.windows];
                            next[index] = { ...(next[index] || window), start: Number(e.target.value) };
                            updatePro(pro.id, { windows: next });
                          }}
                        >
                          {BOOKING_HOURS.map((h) => (
                            <option key={h} value={h}>{formatHour(h)}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="End">
                        <select
                          className={inputClass}
                          value={window.end}
                          onChange={(e) => {
                            const next = [...pro.windows];
                            next[index] = { ...(next[index] || window), end: Number(e.target.value) };
                            updatePro(pro.id, { windows: next });
                          }}
                        >
                          {BOOKING_HOURS.map((h) => (
                            <option key={h} value={h}>{formatHour(h)}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  );
                })}
                <textarea className={`${inputClass} sm:col-span-2`} rows={2} value={pro.bio} onChange={(e) => updatePro(pro.id, { bio: e.target.value })} />
              </div>
              {(draft.pros || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, pros: (draft.pros || []).filter((p) => p.id !== pro.id) })}
                  className="mt-2 text-[12px] text-[#991b1b]"
                >
                  Remove {pro.name}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Court 1 lesson holds</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-4">
          <Field label="Morning start">
            <select
              className={inputClass}
              value={draft.primeTeaching.morning.start}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  primeTeaching: { ...draft.primeTeaching, morning: { ...draft.primeTeaching.morning, start: Number(e.target.value) } },
                })
              }
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </Field>
          <Field label="Morning end">
            <select
              className={inputClass}
              value={draft.primeTeaching.morning.end}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  primeTeaching: { ...draft.primeTeaching, morning: { ...draft.primeTeaching.morning, end: Number(e.target.value) } },
                })
              }
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </Field>
          <Field label="Afternoon start">
            <select
              className={inputClass}
              value={draft.primeTeaching.afternoon.start}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  primeTeaching: { ...draft.primeTeaching, afternoon: { ...draft.primeTeaching.afternoon, start: Number(e.target.value) } },
                })
              }
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </Field>
          <Field label="Afternoon end">
            <select
              className={inputClass}
              value={draft.primeTeaching.afternoon.end}
              onChange={(e) =>
                setDraft({
                  ...draft,
                  primeTeaching: { ...draft.primeTeaching, afternoon: { ...draft.primeTeaching.afternoon, end: Number(e.target.value) } },
                })
              }
            >
              {BOOKING_HOURS.map((h) => (
                <option key={h} value={h}>{formatHour(h)}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-[#e8e5df] bg-white p-5">
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics</p>
        <div className="mt-3 space-y-4">
          {draft.clinics.map((c) => (
            <div key={c.id} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
              <p className="text-[12px] text-[#8a8477]">
                {clinicDayLabel(c.days)} · {clinicTimeLabel(c)}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <input className={inputClass} value={c.name} onChange={(e) => updateClinic(c.id, { name: e.target.value })} />
                <input className={inputClass} value={c.level} onChange={(e) => updateClinic(c.id, { level: e.target.value })} />
                <Field label="Start">
                  <select className={inputClass} value={c.startHour} onChange={(e) => updateClinic(c.id, { startHour: Number(e.target.value) })}>
                    {START_HOURS.map((h) => (
                      <option key={h} value={h}>{formatHour(h)}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Length">
                  <select className={inputClass} value={c.durationHours} onChange={(e) => updateClinic(c.id, { durationHours: Number(e.target.value) })}>
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d === 1 ? "1 hour" : `${d} hours`}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Member $">
                  <input className={inputClass} value={c.memberPrice} onChange={(e) => updateClinic(c.id, { memberPrice: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Guest $">
                  <input className={inputClass} value={c.guestPrice} onChange={(e) => updateClinic(c.id, { guestPrice: Number(e.target.value) || 0 })} />
                </Field>
                <Field label="Capacity">
                  <select className={inputClass} value={c.capacity} onChange={(e) => updateClinic(c.id, { capacity: Number(e.target.value) || 0 })}>
                    {[6, 8, 10, 12, 16, c.capacity].filter((n, i, arr) => arr.indexOf(n) === i).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </Field>
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
                <select className={inputClass} value={event.category} onChange={(e) => updateEvent(event.id, { category: e.target.value })}>
                  {["Social", "Competitive", "Junior", "Member", event.category]
                    .filter((v, i, arr) => arr.indexOf(v) === i)
                    .map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
                <input className={inputClass} value={event.memberPrice} onChange={(e) => updateEvent(event.id, { memberPrice: Number(e.target.value) || 0 })} />
                <input className={inputClass} value={event.guestPrice} onChange={(e) => updateEvent(event.id, { guestPrice: Number(e.target.value) || 0 })} />
                <Field label="Capacity">
                  <select className={inputClass} value={event.capacity} onChange={(e) => updateEvent(event.id, { capacity: Number(e.target.value) || 0 })}>
                    {[8, 12, 16, 20, 24, 32, event.capacity].filter((n, i, arr) => arr.indexOf(n) === i).map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </Field>
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
