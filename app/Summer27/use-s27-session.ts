"use client";

import { useEffect, useState } from "react";
import {
  readS27Session,
  S27_MEMBER_SESSION_EVENT,
  type S27MemberSession,
} from "./member-session";

export function useS27Session() {
  const [session, setSession] = useState<S27MemberSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function apply() {
      setSession(readS27Session());
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
