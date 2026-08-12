"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  emitS27SessionChange,
  parseS27Session,
  S27_MEMBER_SESSION_KEY,
  type S27MemberSession,
} from "./member-session";
import { DEREK_MEMBER, KEYS, ensureDerekMember, loadList, type S27MemberAccount } from "./storage";

export default function MemberAuth() {
  const [session, setSession] = useState<S27MemberSession | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    ensureDerekMember();
    setSession(parseS27Session(localStorage.getItem(S27_MEMBER_SESSION_KEY)));
  }, []);

  function signOut() {
    localStorage.removeItem(S27_MEMBER_SESSION_KEY);
    setSession(null);
    emitS27SessionChange();
    setOpen(false);
  }

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    const members = loadList<S27MemberAccount>(KEYS.members);
    const match = members.find(
      (m) =>
        (m.email.toLowerCase() === email.trim().toLowerCase() || m.memberNumber === email.trim()) &&
        m.password === password
    );
    if (!match) {
      setMsg("No match. Check email / member # and password, or join first.");
      return;
    }
    const next: S27MemberSession = {
      memberNumber: match.memberNumber,
      memberEmail: match.email,
      memberName: match.name,
      memberPhone: match.phone,
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(S27_MEMBER_SESSION_KEY, JSON.stringify(next));
    setSession(next);
    emitS27SessionChange();
    setOpen(false);
    setPassword("");
    setMsg(null);
  }

  function signInAsDerek() {
    const derek = ensureDerekMember();
    const next: S27MemberSession = {
      memberNumber: derek.memberNumber,
      memberEmail: derek.email,
      memberName: derek.name,
      memberPhone: derek.phone,
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(S27_MEMBER_SESSION_KEY, JSON.stringify(next));
    setSession(next);
    emitS27SessionChange();
    setOpen(false);
    setMsg(null);
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/Summer27/member/portal"
          className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4a4a4a] hover:bg-[#faf9f7]"
        >
          {session.memberName?.split(" ")[0] || "Member"} · #{session.memberNumber}
        </Link>
        <button
          type="button"
          onClick={signOut}
          className="text-[11px] text-[#8a8477] hover:text-[#1a1a1a]"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4a4a4a] hover:bg-[#faf9f7]"
      >
        Member login
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[#e8e5df] bg-white p-3 shadow-lg">
          <form onSubmit={signIn} className="space-y-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email or member #"
              className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] outline-none focus:border-[#1a1a1a]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] outline-none focus:border-[#1a1a1a]"
            />
            {msg && <p className="text-[12px] text-[#991b1b]">{msg}</p>}
            <button
              type="submit"
              className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[12px] font-medium text-white"
            >
              Sign in
            </button>
          </form>
          <button
            type="button"
            onClick={signInAsDerek}
            className="mt-2 w-full rounded-lg border border-[#e8e5df] bg-[#faf9f7] py-2 text-[12px] font-medium text-[#4a4a4a] hover:bg-white"
          >
            Sign in as Derek DiFazio
          </button>
          <p className="mt-2 text-center text-[11px] text-[#8a8477]">
            #{DEREK_MEMBER.memberNumber} · {DEREK_MEMBER.email} · {DEREK_MEMBER.password}
          </p>
          <Link
            href="/Summer27/member"
            className="mt-2 block text-center text-[11px] text-[#8a8477] hover:text-[#1a1a1a]"
            onClick={() => setOpen(false)}
          >
            Join as a member
          </Link>
        </div>
      )}
    </div>
  );
}
