"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../use-s27-session";
import { canOneClick, startStripeCheckout } from "../payments";
import { STRING_OPTIONS } from "../summer27-data";
import { getLiveStringingLabor } from "../schedule";
import { KEYS, loadList, rememberStringing, saveList, stringPrefForMember, type S27StringingOrder } from "../storage";

export default function Summer27StringingPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading stringing…</div>}>
      <Summer27StringingInner />
    </Suspense>
  );
}

function Summer27StringingInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const [racket, setRacket] = useState("");
  const [stringId, setStringId] = useState(STRING_OPTIONS[0].id);
  const [tension, setTension] = useState("52");
  const [pickupDate, setPickupDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<S27StringingOrder[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);

  const option = STRING_OPTIONS.find((s) => s.id === stringId) || STRING_OPTIONS[0];
  const labor = getLiveStringingLabor();
  const amount = labor + option.extra;
  const isMember = !!session;
  const savedCard = canOneClick(session);

  useEffect(() => {
    const all = loadList<S27StringingOrder>(KEYS.stringing);
    setOrders(all);
    if (!session) return;
    const pref = stringPrefForMember(session.memberNumber, all);
    if (!pref) return;
    setRacket(pref.racket);
    if (STRING_OPTIONS.some((s) => s.id === pref.stringId)) setStringId(pref.stringId);
    else {
      const match = STRING_OPTIONS.find((s) => s.name === pref.stringName);
      if (match) setStringId(match.id);
    }
    if (pref.tension) setTension(pref.tension.replace(/[^\d.]/g, "") || pref.tension);
  }, [session]);

  useEffect(() => {
    const status = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (status === "success" && bookingId) {
      const all = loadList<S27StringingOrder>(KEYS.stringing).map((o) =>
        o.id === bookingId ? { ...o, paymentStatus: "paid" as const, paymentMethod: "stripe" as const } : o
      );
      saveList(KEYS.stringing, all);
      setOrders(all);
      setMsg("Paid. Drop the frame at the shop.");
    }
  }, [searchParams]);

  const mine = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.paymentStatus === "paid" &&
          (session ? o.memberNumber === session.memberNumber || o.clientEmail === session.memberEmail : false)
      ),
    [orders, session]
  );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const clientName = isMember ? session!.memberName : name.trim();
    const clientEmail = isMember ? session!.memberEmail : email.trim();
    if (!clientName || !clientEmail || !racket.trim()) {
      setMsg("Please add your name, email, and racket.");
      return;
    }
    const id = `string-${Date.now()}`;
    const order: S27StringingOrder = {
      id,
      racket: racket.trim(),
      stringId: option.id,
      stringName: option.name,
      tension,
      pickupDate,
      clientName,
      clientEmail,
      memberNumber: session?.memberNumber,
      amount,
      paymentStatus: "pending",
      paymentMethod: savedCard ? "saved-card" : "stripe",
      createdAt: new Date().toISOString(),
    };
    rememberStringing(session?.memberNumber, order);
    if (savedCard) {
      order.paymentStatus = "paid";
      const next = [...orders, order];
      saveList(KEYS.stringing, next);
      setOrders(next);
      setMsg(`Order in. $${amount} charged. Drop the frame at the shop.`);
      return;
    }
    const next = [...orders, order];
    saveList(KEYS.stringing, next);
    setOrders(next);
    setPaying(true);
    const checkout = await startStripeCheckout({
      amount,
      email: clientEmail,
      description: `Stringing · ${option.name} · ${racket}`,
      successPath: "/Summer27/stringing",
      bookingId: id,
      metadata: { type: "stringing" },
    });
    setPaying(false);
    if (checkout.url) window.location.href = checkout.url;
    else setMsg(checkout.error || "Checkout failed.");
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Pro shop</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Stringing</h2>
      <p className="mt-2 text-[14px] text-[#6b665e]">
        ${labor} labor plus string. Drop frames at the shop — usually ready in a day or two.
      </p>

      <form onSubmit={submit} className="mt-6 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        <label className="block text-[12px] text-[#6b665e]">
          Racket
          <input value={racket} onChange={(e) => setRacket(e.target.value)} placeholder="Model" className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
        </label>
        <label className="block text-[12px] text-[#6b665e]">
          String
          <select value={stringId} onChange={(e) => setStringId(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
            {STRING_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.extra ? ` · +$${s.extra}` : ""}
              </option>
            ))}
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[12px] text-[#6b665e]">
            Tension
            <select value={tension} onChange={(e) => setTension(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              {["48", "50", "51", "52", "53", "54", "55", "56", "58"].map((t) => (
                <option key={t} value={t}>{t} lbs</option>
              ))}
            </select>
          </label>
          <label className="text-[12px] text-[#6b665e]">
            Pickup
            <input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </label>
        </div>
        {!isMember && (
          <>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
          </>
        )}
        <p className="text-[13px] text-[#6b665e]">
          ${amount} total
        </p>
        {msg && <p className="text-[13px]">{msg}</p>}
        <button disabled={paying} className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white">
          Order · ${amount}
        </button>
      </form>

      {mine.length > 0 && (
        <div className="mt-6 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Your orders</p>
          <ul className="mt-2 space-y-2 text-[13px]">
            {mine.map((o) => (
              <li key={o.id}>
                {o.racket} · {o.stringName} @ {/lbs/i.test(o.tension) ? o.tension : `${o.tension} lbs`} · ${o.amount}
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
