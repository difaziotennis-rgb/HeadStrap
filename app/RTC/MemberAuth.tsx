"use client";

import { useEffect, useState } from "react";
import {
  isValidMemberNumber,
  MEMBER_MODE_KEY,
  MEMBER_SESSION_EVENT,
  MEMBER_SESSION_KEY,
  parseMemberSession,
  type MemberSession,
} from "./member-session";

export default function MemberAuth() {
  const [session, setSession] = useState<MemberSession | null>(null);
  const [open, setOpen] = useState(false);
  const [memberNumber, setMemberNumber] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const next = parseMemberSession(localStorage.getItem(MEMBER_SESSION_KEY));
    setSession(next);
  }, []);

  function emitSessionChange() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(MEMBER_SESSION_EVENT));
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    const trimmedNumber = memberNumber.trim();
    const trimmedEmail = memberEmail.trim();
    const quickTestSignIn = !trimmedNumber && !trimmedEmail;

    if (!quickTestSignIn && !isValidMemberNumber(trimmedNumber)) {
      setMsg("Please enter a valid 3-digit member number.");
      return;
    }
    const next: MemberSession = {
      memberNumber: quickTestSignIn ? "000" : trimmedNumber,
      memberEmail: quickTestSignIn ? "" : trimmedEmail,
      memberName: quickTestSignIn ? "Derek DiFazio" : "",
      signedInAt: new Date().toISOString(),
    };
    localStorage.setItem(MEMBER_SESSION_KEY, JSON.stringify(next));
    localStorage.setItem(MEMBER_MODE_KEY, "true");
    setSession(next);
    setMsg(null);
    setOpen(false);
    emitSessionChange();
  }

  function handleSignOut() {
    localStorage.removeItem(MEMBER_SESSION_KEY);
    localStorage.setItem(MEMBER_MODE_KEY, "false");
    setSession(null);
    setMemberNumber("");
    setMemberEmail("");
    setMsg(null);
    setOpen(false);
    emitSessionChange();
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <span className="hidden rounded-md border border-[#dbead3] bg-[#f4faf1] px-2.5 py-1 text-[11px] font-medium text-[#2d5016] sm:inline">
          {session.memberName ? `${session.memberName} · ` : ""}Member #{session.memberNumber}
        </span>
        <button
          type="button"
          onClick={handleSignOut}
          className="rounded-md border border-[#d9d5cf] px-2.5 py-1.5 text-[11px] font-medium hover:bg-white"
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
        onClick={() => {
          setOpen((v) => !v);
          setMsg(null);
        }}
        className="rounded-md border border-[#d9d5cf] px-2.5 py-1.5 text-[11px] font-medium hover:bg-white"
      >
        Member Sign In
      </button>
      {open && (
        <form
          onSubmit={handleSignIn}
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(20rem,calc(100vw-2rem))] rounded-xl border border-[#e8e5df] bg-white p-3 shadow-[0_16px_34px_rgba(26,26,26,0.16)]"
        >
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Access</p>
          <div className="mt-2 grid gap-2">
            <input
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value.replace(/\D/g, "").slice(0, 3))}
              placeholder="Member number (3 digits)"
              inputMode="numeric"
              maxLength={3}
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
            />
            <input
              value={memberEmail}
              onChange={(e) => setMemberEmail(e.target.value)}
              placeholder="Email (optional)"
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[12px]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
            >
              Stay Signed In
            </button>
            <p className="text-[10px] text-[#8a8477]">
              Leave both fields blank for test sign-in as Derek DiFazio (Member #000).
            </p>
            {msg && <p className="text-[11px] text-[#7f1d1d]">{msg}</p>}
          </div>
        </form>
      )}
    </div>
  );
}
