"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  clearRememberedSignIn,
  clearS27Session,
  readRememberedSignIn,
  readS27Session,
  writeRememberedSignIn,
  writeS27Session,
  type S27MemberSession,
} from "./member-session";
import { KEYS, ensureDerekMember, loadList, type S27MemberAccount } from "./storage";

export default function MemberAuth() {
  const [session, setSession] = useState<S27MemberSession | null>(null);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [rememberSignIn, setRememberSignIn] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      ensureDerekMember();
      setSession(readS27Session());
      const remembered = readRememberedSignIn();
      if (remembered) {
        setEmail(remembered.email);
        setPassword(remembered.password);
        setRememberSignIn(true);
      }
    } catch {
      setSession(null);
    }
  }, []);

  function signOut() {
    clearS27Session();
    setSession(null);
    setOpen(false);
    const remembered = readRememberedSignIn();
    if (remembered) {
      setEmail(remembered.email);
      setPassword(remembered.password);
      setRememberSignIn(true);
    } else {
      setEmail("");
      setPassword("");
      setRememberSignIn(false);
    }
  }

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    ensureDerekMember();
    const members = loadList<S27MemberAccount>(KEYS.members);
    const key = email.trim().toLowerCase().replace(/^#/, "");
    const pass = password.trim();
    const match = members.find((m) => {
      if (!m || typeof m.email !== "string") return false;
      const idMatch =
        m.email.toLowerCase() === key ||
        String(m.memberNumber) === key ||
        String(m.name || "").trim().toLowerCase() === key;
      if (!idMatch) return false;
      // Member #100 (director) can sign in with no password.
      if (String(m.memberNumber) === "100") return true;
      return String(m.password || "") === pass;
    });
    if (!match) {
      setMsg("Check email and password.");
      return;
    }
    const next: S27MemberSession = {
      memberNumber: match.memberNumber,
      memberEmail: match.email,
      memberName: match.name,
      memberPhone: match.phone,
      signedInAt: new Date().toISOString(),
    };
    writeS27Session(next, staySignedIn);
    if (rememberSignIn) writeRememberedSignIn(email.trim(), password);
    else clearRememberedSignIn();
    setSession(next);
    setOpen(false);
    if (!rememberSignIn) setPassword("");
    setMsg(null);
  }

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/Summer27/member/portal"
          className="rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4a4a4a] hover:bg-[#faf9f7]"
        >
          My Account
        </Link>
        <button type="button" onClick={signOut} className="text-[11px] text-[#8a8477] hover:text-[#1a1a1a]">
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
        Sign in
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-[#e8e5df] bg-white p-3 shadow-lg">
          <form onSubmit={signIn} className="space-y-2">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email, name, or member #"
              name="username"
              autoComplete="username"
              className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] outline-none focus:border-[#1a1a1a]"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              name="password"
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px] outline-none focus:border-[#1a1a1a]"
            />
            <label className="flex cursor-pointer items-start gap-2 pt-0.5 text-[11px] leading-snug text-[#6b665e]">
              <input
                type="checkbox"
                checked={staySignedIn}
                onChange={(e) => setStaySignedIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>Stay signed in on this device</span>
            </label>
            <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-snug text-[#6b665e]">
              <input
                type="checkbox"
                checked={rememberSignIn}
                onChange={(e) => setRememberSignIn(e.target.checked)}
                className="mt-0.5"
              />
              <span>Remember email &amp; password for next visit</span>
            </label>
            {msg && <p className="text-[12px] text-[#991b1b]">{msg}</p>}
            <button type="submit" className="w-full rounded-lg bg-[#1a1a1a] py-2 text-[12px] font-medium text-white">
              Sign in
            </button>
          </form>
          <Link
            href="/Summer27/member"
            className="mt-2 block text-center text-[11px] text-[#8a8477] hover:text-[#1a1a1a]"
            onClick={() => setOpen(false)}
          >
            Join
          </Link>
        </div>
      )}
    </div>
  );
}
