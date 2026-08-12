"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useS27Session } from "../use-s27-session";
import {
  KEYS,
  directoryContactLabel,
  loadList,
  type S27MemberAccount,
} from "../storage";

export default function Summer27MembersPage() {
  const session = useS27Session();
  const [members, setMembers] = useState<S27MemberAccount[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<S27MemberAccount | null>(null);

  useEffect(() => {
    setMembers(loadList<S27MemberAccount>(KEYS.members));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => m.directoryVisible)
      .filter((m) => !session || m.memberNumber !== session.memberNumber)
      .filter((m) => {
        if (!q) return true;
        return (
          m.name.toLowerCase().includes(q) ||
          (m.directoryNote || "").toLowerCase().includes(q) ||
          m.memberNumber.includes(q)
        );
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [members, query, session]);

  if (!session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Members</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Club directory</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">Sign in to browse members who’ve opted in.</p>
        <Link href="/Summer27/member" className="mt-4 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-white">
          Sign in / join
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Members</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">Club directory</h2>
      <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-[#6b665e]">
        Members who choose to list themselves. Contact shows only when they’ve shared it.{" "}
        <Link href="/Summer27/member/portal?tab=settings" className="text-[#1a1a1a] underline-offset-2 hover:underline">
          Update your listing
        </Link>
      </p>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by name…"
        className="mt-5 w-full rounded-xl border border-[#e8e5df] bg-white px-3 py-3 text-[15px]"
      />

      {visible.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[#e8e5df] bg-white px-4 py-8 text-center text-[14px] text-[#8a8477]">
          {query.trim() ? "No matches." : "Nobody’s listed yet — be the first in Settings."}
        </p>
      ) : (
        <ul className="mt-4 overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          {visible.map((m) => (
            <li key={m.memberNumber} className="border-b border-[#f0ede8] last:border-0">
              <button
                type="button"
                onClick={() => setSelected(m)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left hover:bg-[#faf9f7]"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-medium">{m.name}</p>
                  {m.directoryNote ? (
                    <p className="mt-0.5 truncate text-[12px] text-[#6b665e]">{m.directoryNote}</p>
                  ) : (
                    <p className="mt-0.5 text-[12px] text-[#8a8477]">Member #{m.memberNumber}</p>
                  )}
                </div>
                <span className="shrink-0 text-[12px] text-[#8a8477]">View</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selected && (
        <div className="fixed inset-0 z-40 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-4">
          <button
            type="button"
            aria-label="Close"
            className="absolute inset-0 bg-[#1a1a1a]/30"
            onClick={() => setSelected(null)}
          />
          <div className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-xl">
            <div className="border-b border-[#ece8e2] px-4 py-3.5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Member</p>
              <p className="mt-1 text-[18px] font-semibold tracking-tight">{selected.name}</p>
              <p className="mt-0.5 text-[12px] text-[#8a8477]">#{selected.memberNumber}</p>
            </div>
            <div className="space-y-3 px-4 py-4">
              {selected.directoryNote && (
                <p className="text-[14px] leading-relaxed text-[#4a4a4a]">{selected.directoryNote}</p>
              )}
              {directoryContactLabel(selected) ? (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Preferred contact</p>
                  <p className="mt-1 text-[15px] font-medium">{directoryContactLabel(selected)}</p>
                </div>
              ) : (
                <p className="text-[13px] text-[#6b665e]">
                  No contact shared — say hello at the courts or ask the desk to connect you.
                </p>
              )}
              <div className="flex gap-2 pt-1">
                <Link
                  href="/Summer27/play"
                  className="flex-1 rounded-2xl bg-[#1a1a1a] py-3 text-center text-[14px] font-medium text-white"
                  onClick={() => setSelected(null)}
                >
                  Looking for a game
                </Link>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-2xl border border-[#e8e5df] px-4 py-3 text-[14px] font-medium text-[#4a4a4a]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
