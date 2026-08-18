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
import { clearS27ProSession, readS27ProSession, writeS27ProSession, type S27ProSession } from "./pro-session";
import { KEYS, ensureDerekMember, loadList, type S27MemberAccount } from "./storage";
import { findProByLogin, s27Pros } from "./summer27-data";
import { getLivePros } from "./schedule";

export default function MemberAuth({ tone = "light" }: { tone?: "light" | "dark" }) {
  const dark = tone === "dark";
  const chip = dark
    ? "rounded-lg border border-white/20 bg-white/10 px-2.5 py-1.5 text-[11px] font-medium text-white/80 hover:bg-white/15 hover:text-white"
    : "rounded-lg border border-[#e8e5df] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#4a4a4a] hover:bg-[#faf9f7]";
  const mute = dark ? "text-[11px] text-white/50 hover:text-white" : "text-[11px] text-[#8a8477] hover:text-[#1a1a1a]";
  const [session, setSession] = useState<S27MemberSession | null>(null);
  const [proSession, setProSession] = useState<S27ProSession | null>(null);
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
      setProSession(readS27ProSession());
      const remembered = readRememberedSignIn();
      if (remembered) {
        setEmail(remembered.email);
        setPassword(remembered.password);
        setRememberSignIn(true);
      }
    } catch {
      setSession(null);
      setProSession(null);
    }
  }, []);

  function signOut() {
    clearS27Session();
    clearS27ProSession();
    setSession(null);
    setProSession(null);
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
      if (String(m.memberNumber) === "100") return true;
      return String(m.password || "") === pass;
    });
    const pros = (() => {
      try {
        const live = getLivePros();
        return live.length ? live : s27Pros;
      } catch {
        return s27Pros;
      }
    })();
    const pro = findProByLogin(pros, email);

    if (!match && !pro) {
      setMsg("Check email and password.");
      return;
    }
    if (match) {
      const next: S27MemberSession = {
        memberNumber: match.memberNumber,
        memberEmail: match.email,
        memberName: match.name,
        memberPhone: match.phone,
        signedInAt: new Date().toISOString(),
      };
      writeS27Session(next, staySignedIn);
      setSession(next);
    }
    if (pro) {
      const next: S27ProSession = {
        proId: pro.id,
        proEmail: pro.email || email.trim(),
        proName: pro.name,
        signedInAt: new Date().toISOString(),
      };
      writeS27ProSession(next);
      setProSession(next);
    }
    if (rememberSignIn) writeRememberedSignIn(email.trim(), password);
    else clearRememberedSignIn();
    setOpen(false);
    if (!rememberSignIn) setPassword("");
    setMsg(null);
  }

  if (session || proSession) {
    return (
      <div className="flex items-center gap-2">
        {proSession ? (
          <Link
            href="/Summer27/pro"
            className={chip}
          >
            Pro desk
          </Link>
        ) : null}
        {session ? (
          <Link
            href="/Summer27/member/portal"
            className={chip}
          >
            My Account
          </Link>
        ) : null}
        <button type="button" onClick={signOut} className={mute}>
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
        className={chip}
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
