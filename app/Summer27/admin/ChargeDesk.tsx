"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { formatDateInput, formatPrettyDate } from "../summer27-data";
import { getPaymentProfile } from "../payments";
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

function scoreMember(m: S27MemberAccount, q: string): number {
  const name = m.name.toLowerCase();
  const email = m.email.toLowerCase();
  const num = m.memberNumber;
  if (!q) return 0;
  if (num === q) return 1000;
  if (num.startsWith(q)) return 900 - num.length;
  if (name === q) return 800;
  if (name.startsWith(q)) return 700;
  const parts = name.split(/\s+/);
  if (parts.some((p) => p.startsWith(q))) return 600;
  if (name.includes(q)) return 400;
  if (email.startsWith(q)) return 300;
  if (email.includes(q)) return 200;
  if (num.includes(q)) return 100;
  return 0;
}

export default function ChargeDesk({ members, charges, onCharges }: Props) {
  const [query, setQuery] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [amount, setAmount] = useState("5");
  const [description, setDescription] = useState("Can of balls");
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const member = members.find((m) => m.memberNumber === memberNumber) || null;

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return members.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);
    }
    return members
      .map((m) => ({ m, score: scoreMember(m, q) }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score || a.m.name.localeCompare(b.m.name))
      .map((row) => row.m)
      .slice(0, 8);
  }, [members, query]);

  // Exact member # → auto-select as you type.
  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const exact = members.find((m) => m.memberNumber === q);
    if (exact && memberNumber !== exact.memberNumber) {
      setMemberNumber(exact.memberNumber);
      setGuestName("");
      setGuestEmail("");
      setOpen(false);
    }
  }, [query, members, memberNumber]);

  // Single strong name match → keep selected when query still matches that member.
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (!q || /^\d+$/.test(q)) return;
    if (member && (member.name.toLowerCase().startsWith(q) || member.name.toLowerCase() === q)) return;
    if (suggestions.length === 1 && suggestions[0].name.toLowerCase().startsWith(q)) {
      // Don't lock yet — wait for Enter/click — but highlight first
      setHighlight(0);
    }
  }, [query, suggestions, member]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  function selectMember(m: S27MemberAccount) {
    setMemberNumber(m.memberNumber);
    setQuery(`${m.name} · #${m.memberNumber}`);
    setGuestName("");
    setGuestEmail("");
    setOpen(false);
    setMsg(null);
  }

  function clearMember() {
    setMemberNumber("");
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function onQueryChange(value: string) {
    setQuery(value);
    setOpen(true);
    setMsg(null);
    // If they edit away from the selected member label, clear selection.
    if (memberNumber) {
      const selected = members.find((m) => m.memberNumber === memberNumber);
      const label = selected ? `${selected.name} · #${selected.memberNumber}` : "";
      if (value !== label) setMemberNumber("");
    }
  }

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

    // If they typed a name/number but didn't click, take the top suggestion.
    let selected = member;
    if (!selected && suggestions.length > 0 && query.trim()) {
      selected = suggestions[Math.min(highlight, suggestions.length - 1)];
      selectMember(selected);
    }

    const name = selected?.name || guestName.trim() || query.trim();
    const email = selected?.email || guestEmail.trim();
    if (!name) {
      setMsg("Type a member name or #, or enter a guest name.");
      return;
    }

    let paymentMethod: S27Charge["paymentMethod"] = "manual";
    if (selected) {
      const card = getPaymentProfile(selected.memberNumber);
      if (!card?.last4) {
        setMsg(`${selected.name} needs a card on file before you can charge.`);
        return;
      }
      paymentMethod = "saved-card";
    }

    const row: S27Charge = {
      id: `charge-${Date.now()}`,
      date: formatDateInput(new Date()),
      description: note,
      clientName: name,
      clientEmail: email,
      memberNumber: selected?.memberNumber,
      amount: dollars,
      paymentStatus: "paid",
      paymentMethod,
      createdAt: new Date().toISOString(),
    };
    onCharges([row, ...charges]);
    setMsg(
      selected
        ? `Charged ${name} $${dollars.toFixed(dollars % 1 ? 2 : 0)} to card on file · ${note}`
        : `Recorded $${dollars.toFixed(dollars % 1 ? 2 : 0)} for ${name} · ${note}`
    );
    setGuestName("");
    setGuestEmail("");
    setMemberNumber("");
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      setOpen(true);
      return;
    }
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter" && member) return; // let form submit
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectMember(suggestions[highlight] || suggestions[0]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const recent = useMemo(
    () =>
      charges
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 20),
    [charges]
  );

  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Quick charge</p>
        <h3 className="mt-0.5 text-xl font-semibold tracking-tight">Pro shop & misc</h3>
        <p className="mt-1 max-w-xl text-[13px] text-[#6b665e]">
          Type a name or member # — members are charged on the card on file right away. Guests are recorded as paid at the desk.
        </p>
      </div>

      <form onSubmit={charge} className="space-y-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
        <div className="relative">
          <p className="mb-2 text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Who</p>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              className={`${inputClass} w-full`}
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => {
                if (blurTimer.current) window.clearTimeout(blurTimer.current);
                setOpen(true);
              }}
              onBlur={() => {
                blurTimer.current = window.setTimeout(() => setOpen(false), 150);
              }}
              onKeyDown={onKeyDown}
              placeholder="Name or member #"
              autoComplete="off"
              aria-autocomplete="list"
              aria-expanded={open}
            />
            {(member || query) && (
              <button
                type="button"
                onClick={clearMember}
                className="shrink-0 rounded-lg border border-[#e8e5df] px-3 text-[12px] text-[#6b665e] hover:bg-[#faf9f7]"
              >
                Clear
              </button>
            )}
          </div>

          {open && (
            <div className="absolute z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-[#e8e5df] bg-white shadow-lg">
              {suggestions.length === 0 ? (
                <p className="px-3 py-2.5 text-[13px] text-[#8a8477]">
                  {query.trim() ? "No member match — use guest fields below." : "Start typing a name or #"}
                </p>
              ) : (
                <ul role="listbox">
                  {suggestions.map((m, i) => {
                    const active = i === highlight;
                    return (
                      <li key={m.memberNumber}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={active}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => selectMember(m)}
                          onMouseEnter={() => setHighlight(i)}
                          className={`flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-[13px] ${
                            active || memberNumber === m.memberNumber ? "bg-[#faf9f7]" : "hover:bg-[#faf9f7]"
                          }`}
                        >
                          <span>
                            <span className="font-medium text-[#1a1a1a]">{m.name}</span>
                            <span className="mt-0.5 block text-[11px] text-[#8a8477]">{m.email}</span>
                          </span>
                          <span className="shrink-0 tabular-nums text-[12px] text-[#6b665e]">#{m.memberNumber}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}

          {member ? (
            <p className="mt-2 text-[13px] text-[#4a4a4a]">
              Charging <span className="font-medium">{member.name}</span>
              <span className="text-[#8a8477]"> · #{member.memberNumber}</span>
            </p>
          ) : (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <input
                className={inputClass}
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                placeholder="Guest name (if not a member)"
              />
              <input
                className={inputClass}
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                placeholder="Guest email (optional)"
              />
            </div>
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
                  <p className="text-[15px] font-medium">
                    {row.clientName}
                    {row.memberNumber ? (
                      <span className="ml-1.5 text-[12px] font-normal text-[#8a8477]">#{row.memberNumber}</span>
                    ) : null}
                  </p>
                  <p className="text-[13px] text-[#6b665e]">
                    {row.description}
                    <span className="text-[#8a8477]"> · {formatPrettyDate(row.date)}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[14px] tabular-nums">${row.amount}</span>
                  <PaidPill status={row.paymentStatus} />
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
