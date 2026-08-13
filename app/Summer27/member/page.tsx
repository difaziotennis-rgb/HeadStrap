"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  writeS27Session,
} from "../member-session";
import {
  KEYS,
  loadList,
  nextMemberNumber,
  saveList,
  type S27MemberAccount,
  type S27PaymentProfile,
} from "../storage";

export default function Summer27JoinPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [brand, setBrand] = useState<S27PaymentProfile["brand"]>("Visa");
  const [last4, setLast4] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [zip, setZip] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  function join(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || password.length < 4) {
      setMsg("Name, email, and a password are required.");
      return;
    }
    if (last4.trim().length !== 4) {
      setMsg("Add a card on file (last 4 digits) to join.");
      return;
    }
    const members = loadList<S27MemberAccount>(KEYS.members);
    if (members.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      setMsg("That email already has an account. Sign in from the header.");
      return;
    }
    const memberNumber = nextMemberNumber(members);
    const account: S27MemberAccount = {
      memberNumber,
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      password,
      createdAt: new Date().toISOString(),
    };
    saveList(KEYS.members, [...members, account]);

    const payments = loadList<S27PaymentProfile>(KEYS.payment);
    payments.push({
      memberNumber,
      brand,
      last4: last4.trim(),
      expMonth,
      expYear,
      billingZip: zip,
      oneClick: true,
    });
    saveList(KEYS.payment, payments);

    writeS27Session(
      {
        memberNumber,
        memberEmail: account.email,
        memberName: account.name,
        memberPhone: account.phone,
        signedInAt: new Date().toISOString(),
      },
      staySignedIn
    );
    router.push("/Summer27/member/portal");
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Membership</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Join</h2>
      <p className="mt-2 text-[14px] text-[#6b665e]">
        Member court time $50/hour, clinic and event rates, and a simple account for everything you book. Add a card on file — it’s how all bookings and shop charges are paid.
      </p>

      <form onSubmit={join} className="mt-6 space-y-3 rounded-2xl border border-[#e8e5df] bg-white p-5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          name="name"
          autoComplete="name"
          className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          type="email"
          name="email"
          autoComplete="username"
          className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone"
          name="tel"
          autoComplete="tel"
          className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          type="password"
          name="new-password"
          autoComplete="new-password"
          className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
        />

        <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Card on file (required)</p>
          <p className="mt-1 text-[12px] text-[#6b665e]">Used automatically when you book and when the shop charges your account.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <select value={brand} onChange={(e) => setBrand(e.target.value as S27PaymentProfile["brand"])} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]">
              <option>Visa</option>
              <option>Mastercard</option>
              <option>Amex</option>
            </select>
            <input value={last4} onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="Last 4" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]" />
            <input value={expMonth} onChange={(e) => setExpMonth(e.target.value)} placeholder="Exp month" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]" />
            <input value={expYear} onChange={(e) => setExpYear(e.target.value)} placeholder="Exp year" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px]" />
            <input value={zip} onChange={(e) => setZip(e.target.value)} placeholder="Billing ZIP" className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2 text-[13px] sm:col-span-2" />
          </div>
        </div>

        <label className="flex cursor-pointer items-start gap-2 text-[12px] leading-snug text-[#6b665e]">
          <input
            type="checkbox"
            checked={staySignedIn}
            onChange={(e) => setStaySignedIn(e.target.checked)}
            className="mt-0.5"
          />
          <span>Stay signed in on this device</span>
        </label>

        {msg && <p className="text-[13px] text-[#991b1b]">{msg}</p>}
        <button className="w-full rounded-lg bg-[#1a1a1a] py-2.5 text-[13px] font-medium text-white">
          Join
        </button>
      </form>
    </main>
  );
}
