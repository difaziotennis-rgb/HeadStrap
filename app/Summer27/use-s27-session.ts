"use client";

import { useEffect, useState } from "react";
import {
  parseS27Session,
  S27_MEMBER_SESSION_EVENT,
  S27_MEMBER_SESSION_KEY,
  type S27MemberSession,
} from "./member-session";

export function useS27Session() {
  const [session, setSession] = useState<S27MemberSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function apply() {
      setSession(parseS27Session(localStorage.getItem(S27_MEMBER_SESSION_KEY)));
    }
    apply();
    window.addEventListener(S27_MEMBER_SESSION_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(S27_MEMBER_SESSION_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return session;
}
