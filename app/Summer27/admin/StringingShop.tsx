"use client";

import { formatPrettyDate } from "../summer27-data";
import { stringingShopStatus, type S27StringingOrder } from "../storage";
import { PaidPill } from "./ui";

type Props = {
  stringing: S27StringingOrder[];
  notifyingId?: string | null;
  onMarkReady: (id: string) => void;
  onMarkPickedUp: (id: string) => void;
};

export default function StringingShop({
  stringing,
  notifyingId,
  onMarkReady,
  onMarkPickedUp,
}: Props) {
  const shopQueue = stringing
    .filter((b) => stringingShopStatus(b) === "in_shop")
    .slice()
    .sort((a, b) => (a.createdAt || "").localeCompare(b.createdAt || ""));
  const readyForPickup = stringing
    .filter((b) => stringingShopStatus(b) === "ready")
    .slice()
    .sort((a, b) => (a.readyAt || "").localeCompare(b.readyAt || ""));
  const pickedUp = stringing
    .filter((b) => stringingShopStatus(b) === "picked_up")
    .slice()
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""))
    .slice(0, 12);

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Stringing</p>
        <h3 className="mt-0.5 text-xl font-semibold tracking-tight">Shop queue</h3>
        <p className="mt-1 text-[13px] text-[#6b665e]">
          Mark ready to email the member, then clear when they pick up.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">In shop</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{shopQueue.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Ready</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{readyForPickup.length}</p>
        </div>
        <div className="rounded-2xl border border-[#e8e5df] bg-white px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Recent pickups</p>
          <p className="mt-1 text-2xl font-semibold tracking-tight">{pickedUp.length}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
          In shop · {shopQueue.length}
        </p>
        {shopQueue.length === 0 ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">Nothing in the shop.</p>
        ) : (
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
                    <PaidPill status={row.paymentStatus} />
                    <button
                      type="button"
                      disabled={busy || !row.clientEmail}
                      onClick={() => onMarkReady(row.id)}
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
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
          Ready for pickup · {readyForPickup.length}
        </p>
        {readyForPickup.length === 0 ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">No rackets waiting.</p>
        ) : (
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
                <div className="flex flex-wrap items-center gap-2">
                  <PaidPill status={row.paymentStatus} />
                  <button
                    type="button"
                    onClick={() => onMarkPickedUp(row.id)}
                    className="rounded-full border border-[#e8e5df] bg-[#faf9f7] px-3.5 py-2 text-[12px] font-medium text-[#4a4a4a]"
                  >
                    Picked up
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {pickedUp.length > 0 && (
        <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
            Recently picked up
          </p>
          <ul className="divide-y divide-[#f0ede8]">
            {pickedUp.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium text-[#4a4a4a]">{row.clientName}</p>
                  <p className="text-[12px] text-[#8a8477]">
                    {row.racket} · {row.stringName}
                  </p>
                </div>
                <PaidPill status={row.paymentStatus} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
