"use client";

import { formatHour, formatPrettyDate, lessonProLabel } from "../summer27-data";
import type { S27Catalog } from "../schedule";
import type { S27AdminBlock } from "../schedule";
import {
  stringingShopStatus,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27StringingOrder,
} from "../storage";
import { PaidPill } from "./ui";

type Props = {
  today: string;
  members: S27MemberAccount[];
  courts: S27CourtBooking[];
  clinics: S27ClinicBooking[];
  lessons: S27LessonBooking[];
  events: S27EventBooking[];
  stringing: S27StringingOrder[];
  blocks: S27AdminBlock[];
  catalog: S27Catalog;
  notifyingId?: string | null;
  onOpenMember: (memberNumber: string) => void;
  onToggleCourt: (id: string) => void;
  onToggleClinic: (id: string) => void;
  onToggleLesson: (id: string) => void;
  onAcceptLessonRequest: (id: string) => void;
  onDeclineLessonRequest: (id: string) => void;
  onToggleEvent: (id: string) => void;
  onToggleStringing: (id: string) => void;
  onMarkStringingReady: (id: string) => void;
  onMarkStringingPickedUp: (id: string) => void;
};

type GlanceItem = {
  id: string;
  time: number;
  kind: string;
  title: string;
  name: string;
  extra?: string;
  status?: "paid" | "pending";
  memberNumber?: string;
  onToggle?: () => void;
};

function memberNumberFor(
  members: S27MemberAccount[],
  memberNumber?: string,
  email?: string
) {
  if (memberNumber) return memberNumber;
  if (!email) return undefined;
  return members.find((m) => m.email.trim().toLowerCase() === email.trim().toLowerCase())?.memberNumber;
}

export default function TodayBoard({
  today,
  members,
  courts,
  clinics,
  lessons,
  events,
  stringing,
  blocks,
  catalog,
  notifyingId,
  onOpenMember,
  onToggleCourt,
  onToggleClinic,
  onToggleLesson,
  onAcceptLessonRequest,
  onDeclineLessonRequest,
  onToggleEvent,
  onToggleStringing,
  onMarkStringingReady,
  onMarkStringingPickedUp,
}: Props) {
  const nowHour = new Date().getHours();
  const courtItems: GlanceItem[] = courts
    .filter((b) => b.date === today)
    .map((b) => ({
      id: b.id,
      time: b.hour,
      kind: b.courtName,
      title: `${b.courtName} · ${b.durationHours}h`,
      name: b.clientName,
      extra: `$${b.amount}`,
      status: b.paymentStatus,
      memberNumber: memberNumberFor(members, b.memberNumber, b.clientEmail),
      onToggle: () => onToggleCourt(b.id),
    }));
  const lessonItems: GlanceItem[] = lessons
    .filter((b) => b.date === today && b.requestStatus !== "declined" && b.requestStatus !== "requested")
    .map((b) => ({
      id: b.id,
      time: b.hour,
      kind: "Lesson",
      title: `${lessonProLabel(b)} · ${b.duration} min`,
      name: b.clientName,
      extra: b.focus || `$${b.amount}`,
      status: b.paymentStatus,
      memberNumber: memberNumberFor(members, b.memberNumber, b.clientEmail),
      onToggle: () => onToggleLesson(b.id),
    }));
  const lessonRequests = lessons
    .filter((b) => b.requestStatus === "requested")
    .slice()
    .sort((a, b) =>
      `${a.date}${String(a.hour).padStart(2, "0")}`.localeCompare(`${b.date}${String(b.hour).padStart(2, "0")}`)
    );
  const holdItems: GlanceItem[] = blocks
    .filter((b) => b.date === today)
    .map((b) => ({
      id: b.id,
      time: b.startHour,
      kind: "Hold",
      title: `${b.courtId === "both" ? "Both courts" : b.courtId === "court-1" ? "Court 1" : "Court 2"} · ${b.durationHours}h`,
      name: b.reason,
    }));

  const clinicGroups = Object.values(
    clinics
      .filter((b) => b.date === today)
      .reduce<Record<string, { clinicId: string; name: string; time: number; rows: S27ClinicBooking[] }>>(
        (acc, b) => {
          const def = catalog.clinics.find((c) => c.id === b.clinicId);
          const key = b.clinicId || b.clinicName;
          if (!acc[key]) {
            acc[key] = {
              clinicId: b.clinicId,
              name: b.clinicName,
              time: def?.startHour ?? 8,
              rows: [],
            };
          }
          acc[key].rows.push(b);
          return acc;
        },
        {}
      )
  ).sort((a, b) => a.time - b.time);

  const todayEvents = events.filter((b) => b.eventDate === today);
  const shopQueue = stringing
    .filter((b) => stringingShopStatus(b) === "in_shop")
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const readyForPickup = stringing
    .filter((b) => stringingShopStatus(b) === "ready")
    .slice()
    .sort((a, b) => (a.readyAt || "").localeCompare(b.readyAt || ""));
  const timeline = [...courtItems, ...lessonItems, ...holdItems].sort((a, b) => a.time - b.time || a.name.localeCompare(b.name));
  const hourGroups = timeline.reduce<Array<{ hour: number; items: GlanceItem[] }>>((acc, item) => {
    const last = acc[acc.length - 1];
    if (last && last.hour === item.time) last.items.push(item);
    else acc.push({ hour: item.time, items: [item] });
    return acc;
  }, []);

  const pendingRows = [
    ...courts.filter((b) => b.date === today && b.paymentStatus === "pending").map((b) => ({ id: b.id, name: b.clientName, label: b.courtName, amount: b.amount, onToggle: () => onToggleCourt(b.id) })),
    ...clinics.filter((b) => b.date === today && b.paymentStatus === "pending").map((b) => ({ id: b.id, name: b.clientName, label: b.clinicName, amount: b.amount, onToggle: () => onToggleClinic(b.id) })),
    ...lessons
      .filter((b) => b.date === today && b.paymentStatus === "pending" && b.requestStatus !== "requested" && b.requestStatus !== "declined")
      .map((b) => ({ id: b.id, name: b.clientName, label: lessonProLabel(b), amount: b.amount, onToggle: () => onToggleLesson(b.id) })),
    ...events.filter((b) => b.eventDate === today && b.paymentStatus === "pending").map((b) => ({ id: b.id, name: b.attendeeName, label: b.eventTitle, amount: b.amount, onToggle: () => onToggleEvent(b.id) })),
    ...stringing.filter((b) => b.pickupDate === today && b.paymentStatus === "pending").map((b) => ({ id: b.id, name: b.clientName, label: "Stringing", amount: b.amount, onToggle: () => onToggleStringing(b.id) })),
  ];
  const pendingTotal = pendingRows.reduce((sum, row) => sum + row.amount, 0);

  return (
    <div className="mt-4 space-y-4">
      <p className="text-[15px] font-medium text-[#1a1a1a]">{formatPrettyDate(today)}</p>

      {lessonRequests.length > 0 && (
        <section className="rounded-2xl border border-[#d7e0ef] bg-[#f4f7fb] p-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#3d5273]">
            Lesson requests · {lessonRequests.length}
          </p>
          <ul className="mt-2 space-y-2">
            {lessonRequests.map((b) => (
              <li key={b.id} className="flex flex-wrap items-start justify-between gap-2 text-[15px]">
                <div className="min-w-0">
                  <p className="font-medium leading-tight">{b.clientName}</p>
                  <p className="text-[13px] text-[#6b665e]">
                    {lessonProLabel(b)} · {formatPrettyDate(b.date)} {formatHour(b.hour)} · {b.duration} min
                    {b.focus ? ` · ${b.focus}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onAcceptLessonRequest(b.id)}
                    className="text-[13px] font-medium text-[#3d5c34]"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeclineLessonRequest(b.id)}
                    className="text-[13px] font-medium text-[#991b1b]"
                  >
                    Decline
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {pendingRows.length > 0 && (
        <section className="rounded-2xl border border-[#ead9c2] bg-[#fbf6ee] p-4">
          <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-[#8a6230]">
            Unpaid today · ${pendingTotal}
          </p>
          <ul className="mt-2 space-y-1.5">
            {pendingRows.map((row) => (
              <li key={row.id} className="flex items-baseline justify-between gap-2 text-[15px]">
                <span>
                  {row.name}
                  <span className="text-[#8a8477]"> · {row.label}</span>
                </span>
                <button type="button" onClick={row.onToggle} className="text-[13px] font-medium text-[#8a6230]">
                  ${row.amount} · mark paid
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
          Courts & lessons
        </p>
        {hourGroups.length === 0 ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">No court or lesson bookings today.</p>
        ) : (
          hourGroups.map((group) => {
            const current = Math.floor(nowHour) === Math.floor(group.hour);
            return (
              <div key={group.hour} className={`border-b border-[#f0ede8] last:border-0 ${current ? "bg-[#faf9f7]" : ""}`}>
                <p className="px-4 pt-3 text-[20px] font-semibold tracking-tight">
                  {formatHour(group.hour)}
                  {current ? <span className="ml-2 text-[11px] font-medium uppercase tracking-[0.12em] text-[#3d5c34]">Now</span> : null}
                </p>
                <ul className="px-4 pb-3">
                  {group.items.map((item) => (
                    <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-1.5">
                      <div>
                        <p className="text-[16px] font-medium leading-tight">{item.name}</p>
                        <p className="text-[13px] text-[#6b665e]">
                          {item.title}
                          {item.extra ? ` · ${item.extra}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.status && <PaidPill status={item.status} onToggle={item.onToggle} />}
                        {item.memberNumber && (
                          <button
                            type="button"
                            onClick={() => onOpenMember(item.memberNumber!)}
                            className="text-[12px] text-[#8a8477]"
                          >
                            File
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })
        )}
      </section>

      {clinicGroups.map((group) => (
        <section key={group.clinicId || group.name} className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="border-b border-[#f0ede8] px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinic · {formatHour(group.time)}</p>
            <p className="text-[18px] font-semibold tracking-tight">{group.name}</p>
            <p className="text-[13px] text-[#6b665e]">{group.rows.length} signed up</p>
          </div>
          <ul className="divide-y divide-[#f0ede8]">
            {group.rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const n = memberNumberFor(members, row.memberNumber, row.clientEmail);
                    if (n) onOpenMember(n);
                  }}
                  className="text-left text-[16px] font-medium"
                >
                  {row.clientName}
                </button>
                <PaidPill status={row.paymentStatus} onToggle={() => onToggleClinic(row.id)} />
              </li>
            ))}
          </ul>
        </section>
      ))}

      {todayEvents.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Events</p>
          {Object.values(
            todayEvents.reduce<Record<string, S27EventBooking[]>>((acc, row) => {
              acc[row.eventTitle] = acc[row.eventTitle] || [];
              acc[row.eventTitle].push(row);
              return acc;
            }, {})
          ).map((rows) => (
            <div key={rows[0].eventTitle} className="border-b border-[#f0ede8] px-4 py-3 last:border-0">
              <p className="text-[18px] font-semibold tracking-tight">{rows[0].eventTitle}</p>
              <ul className="mt-1">
                {rows.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-1">
                    <span className="text-[15px]">
                      {row.attendeeName}
                      <span className="text-[#8a8477]"> ×{row.guestCount}</span>
                    </span>
                    <PaidPill status={row.paymentStatus} onToggle={() => onToggleEvent(row.id)} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {(shopQueue.length > 0 || readyForPickup.length > 0) && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
            Stringing shop
          </p>

          {shopQueue.length > 0 && (
            <div className="border-b border-[#f0ede8] last:border-0">
              <p className="px-4 pt-3 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">
                In shop · {shopQueue.length}
              </p>
              <ul className="divide-y divide-[#f0ede8]">
                {shopQueue.map((row) => {
                  const busy = notifyingId === row.id;
                  return (
                    <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-[16px] font-medium">{row.clientName}</p>
                        <p className="text-[13px] text-[#6b665e]">
                          {row.racket} · {row.stringName} @ {/lbs/i.test(row.tension) ? row.tension : `${row.tension} lbs`}
                        </p>
                        {row.pickupDate ? (
                          <p className="mt-0.5 text-[12px] text-[#8a8477]">Asked for {formatPrettyDate(row.pickupDate)}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <PaidPill status={row.paymentStatus} onToggle={() => onToggleStringing(row.id)} />
                        <button
                          type="button"
                          disabled={busy || !row.clientEmail}
                          onClick={() => onMarkStringingReady(row.id)}
                          className="rounded-full bg-[#1a1a1a] px-3.5 py-2 text-[12px] font-medium text-white disabled:opacity-40"
                          title={!row.clientEmail ? "Needs an email on the order" : "Mark ready and email the member"}
                        >
                          {busy ? "Notifying…" : "Ready · notify"}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {readyForPickup.length > 0 && (
            <div>
              <p className="px-4 pt-3 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">
                Ready · {readyForPickup.length}
              </p>
              <ul className="divide-y divide-[#f0ede8]">
                {readyForPickup.map((row) => (
                  <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-[16px] font-medium">{row.clientName}</p>
                      <p className="text-[13px] text-[#6b665e]">
                        {row.racket} · {row.stringName} @ {/lbs/i.test(row.tension) ? row.tension : `${row.tension} lbs`}
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#3d5a2c]">
                        {row.notifiedAt ? "Member notified" : "Ready — notify may have failed"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onMarkStringingPickedUp(row.id)}
                      className="rounded-full border border-[#e8e5df] bg-[#faf9f7] px-3.5 py-2 text-[12px] font-medium text-[#4a4a4a]"
                    >
                      Picked up
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
