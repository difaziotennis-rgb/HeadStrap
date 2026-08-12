"use client";

import { useMemo, useState } from "react";
import { formatDateInput, formatPrettyDate } from "../summer27-data";
import { type S27Charge, type S27MemberAccount } from "../storage";
import { PaidPill, inputClass } from "./ui";

const PRESETS: { label: string; amount: number; description: string }[] = [
  { label: "Balls", amount: 5, description: "Can of balls" },
  { label: "Grip", amount: 8, description: "Overgrip" },
  { label: "Drink", amount: 3, description: "Drink from pro shop" },
  { label: "Demo", amount: 25, description: "Demo racket rental" },
];

type Props = {
  members: S27MemberAccount[];
  charges: S27Charge[];
  onCharges: (next: S27Charge[]) => void;
};

export default function ChargeDesk({ members, charges, onCharges }: Props) {
  const [query, setQuery] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState("5");
  const [description, setDescription] = useState("Can of balls");
  const [status, setStatus] = useState<"paid" | "pending">("paid");
  const [msg, setMsg] = useState<string | null>(null);

  const member = members.find((m) => m.memberNumber === memberNumber) || null;

  const filteredMembers = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members.slice().sort((a, b) => a.name.localeCompare(b.name));
    return members
      .filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.memberNumber.includes(q)
      )
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, query]);

  const recent = useMemo(
    () =>
      charges
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 20),
    [charges]
  );

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setAmount(String(preset.amount));
    setDescription(preset.description);
  }

  function charge(e: React.FormEvent) {
    e.preventDefault();
    const dollars = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(dollars) || dollars <= 0) {
      setMsg("Enter an amount.");
      return;
    }
    const note = description.trim();
    if (!note) {
      setMsg("Add a short note — members see this on their bill.");
      return;
    }
    const name = member?.name || guestName.trim();
    const email = member?.email || guestEmail.trim();
    if (!name) {
      setMsg("Pick a member or enter a name.");
      return;
    }

    const row: S27Charge = {
      id: `charge-${Date.now()}`,
      date: formatDateInput(new Date()),
      description: note,
      clientName: name,
      clientEmail: email,
      memberNumber: member?.memberNumber,
      amount: dollars,
      paymentStatus: status,
      paymentMethod: "manual",
      createdAt: new Date().toISOString(),
    };
    onCharges([row, ...charges]);
    setMsg(`Charged ${name} $${dollars.toFixed(dollars % 1 ? 2 : 0)} · ${note}`);
    setGuestName("");
    setGuestEmail("");
  }

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Quick charge</p>
        <h3 className="mt-0.5 text-xl font-semibold tracking-tight">Pro shop & misc</h3>
        <p className="mt-1 max-w-xl text-[13px] text-[#6b665e]">
          Balls, grips, drinks, or anything else. The note shows on the member’s account.
        </p>
      </div>

      <form onSubmit={charge} className="space-y-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Who</p>
          <input
            className={inputClass + " w-full"}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search members"
          />
          <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-[#ece8e2]">
            <button
              type="button"
              onClick={() => {
                setMemberNumber("");
                setQuery("");
              }}
              className={`flex w-full items-center justify-between px-3 py-2 text-left text-[13px] ${
                !memberNumber ? "bg-[#faf9f7] font-medium" : "hover:bg-[#faf9f7]"
              }`}
            >
              <span>Walk-up / guest</span>
            </button>
            {filteredMembers.map((m) => (
              <button
                key={m.memberNumber}
                type="button"
                onClick={() => {
                  setMemberNumber(m.memberNumber);
                  setQuery(m.name);
                }}
                className={`flex w-full items-center justify-between border-t border-[#f0ede8] px-3 py-2 text-left text-[13px] ${
                  memberNumber === m.memberNumber ? "bg-[#faf9f7] font-medium" : "hover:bg-[#faf9f7]"
                }`}
              >
                <span>{m.name}</span>
                <span className="text-[11px] text-[#8a8477]">#{m.memberNumber}</span>
              </button>
            ))}
          </div>
          {!member && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name"
              />
              <input
                className={inputClass}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Email (optional)"
              />
            </div>
          )}
          {member && (
            <p className="mt-2 text-[13px] text-[#4a4a4a]">
              Charging <span className="font-medium">{member.name}</span>
              <span className="text-[#8a8477]"> · #{member.memberNumber}</span>
            </p>
          )}
        </div>

        <div>
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Quick picks</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => applyPreset(preset)}
                className="rounded-full border border-[#e8e5df] bg-[#faf9f7] px-3.5 py-2 text-[13px] font-medium text-[#1a1a1a] hover:border-[#1a1a1a]"
              >
                {preset.label} · ${preset.amount}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-[8rem_1fr]">
          <label className="text-[12px] text-[#6b665e]">
            Amount ($)
            <input
              className={`${inputClass} mt-1 w-full`}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </label>
          <label className="text-[12px] text-[#6b665e]">
            Note on their bill
            <input
              className={`${inputClass} mt-1 w-full`}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Can of balls · Wilson US Open"
            />
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            className={inputClass}
            value={status}
            onChange={(e) => setStatus(e.target.value as "paid" | "pending")}
          >
            <option value="paid">Mark paid now</option>
            <option value="pending">Leave unpaid</option>
          </select>
          <button type="submit" className="rounded-xl bg-[#1a1a1a] px-5 py-2.5 text-[14px] font-medium text-white">
            Charge ${Number(amount) > 0 ? (Number(amount) % 1 ? Number(amount).toFixed(2) : amount) : "—"}
          </button>
        </div>
        {msg && <p className="text-[13px] text-[#4a4a4a]">{msg}</p>}
      </form>

      <section className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
        <p className="border-b border-[#f0ede8] px-4 py-3 text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">
          Recent charges
        </p>
        {recent.length === 0 ? (
          <p className="px-4 py-5 text-[15px] text-[#8a8477]">No charges yet.</p>
        ) : (
          <ul className="divide-y divide-[#f0ede8]">
            {recent.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{row.clientName}</p>
                  <p className="text-[13px] text-[#6b665e]">
                    {row.description}
                    <span className="text-[#8a8477]"> · {formatPrettyDate(row.date)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] tabular-nums">${row.amount}</span>
                  <PaidPill
                    status={row.paymentStatus}
                    onToggle={() =>
                      onCharges(
                        charges.map((x) =>
                          x.id === row.id
                            ? { ...x, paymentStatus: x.paymentStatus === "paid" ? "pending" : "paid" }
                            : x
                        )
                      )
                    }
                  />
                  <button
                    type="button"
                    onClick={() => onCharges(charges.filter((x) => x.id !== row.id))}
                    className="text-[12px] text-[#991b1b]"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
