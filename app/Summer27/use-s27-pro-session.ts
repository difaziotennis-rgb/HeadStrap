"use client";

import { useEffect, useState } from "react";
import {
  readS27ProSession,
  S27_PRO_SESSION_EVENT,
  type S27ProSession,
} from "./pro-session";

export function useS27ProSession() {
  const [session, setSession] = useState<S27ProSession | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    function apply() {
      setSession(readS27ProSession());
    }
    apply();
    window.addEventListener(S27_PRO_SESSION_EVENT, apply);
    window.addEventListener("storage", apply);
    return () => {
      window.removeEventListener(S27_PRO_SESSION_EVENT, apply);
      window.removeEventListener("storage", apply);
    };
  }, []);

  return session;
}
