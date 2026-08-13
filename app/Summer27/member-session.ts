export const S27_MEMBER_SESSION_KEY = "s27_member_session_v1";
export const S27_MEMBER_REMEMBER_KEY = "s27_member_remember_v1";
export const S27_MEMBER_SESSION_EVENT = "s27-member-session-changed";

export type S27MemberSession = {
  memberNumber: string;
  memberEmail: string;
  memberName: string;
  memberPhone?: string;
  signedInAt: string;
};

export type S27RememberedSignIn = {
  email: string;
  password: string;
};

export function parseS27Session(raw: string | null): S27MemberSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<S27MemberSession>;
    if (!parsed?.memberNumber || !parsed?.memberEmail) return null;
    return {
      memberNumber: String(parsed.memberNumber).trim(),
      memberEmail: String(parsed.memberEmail).trim(),
      memberName: String(parsed.memberName || "").trim(),
      memberPhone: String(parsed.memberPhone || "").trim(),
      signedInAt: String(parsed.signedInAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function emitS27SessionChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(S27_MEMBER_SESSION_EVENT));
}

function canUseStorage() {
  return typeof window !== "undefined";
}

/** Prefer persistent localStorage session; fall back to this-browser-session only. */
export function readS27Session(): S27MemberSession | null {
  if (!canUseStorage()) return null;
  try {
    return (
      parseS27Session(localStorage.getItem(S27_MEMBER_SESSION_KEY)) ||
      parseS27Session(sessionStorage.getItem(S27_MEMBER_SESSION_KEY))
    );
  } catch {
    return null;
  }
}

export function sessionIsPersistent(): boolean {
  if (!canUseStorage()) return false;
  try {
    return !!localStorage.getItem(S27_MEMBER_SESSION_KEY);
  } catch {
    return false;
  }
}

export function writeS27Session(session: S27MemberSession, persist: boolean) {
  if (!canUseStorage()) return;
  const raw = JSON.stringify(session);
  try {
    localStorage.removeItem(S27_MEMBER_SESSION_KEY);
    sessionStorage.removeItem(S27_MEMBER_SESSION_KEY);
    if (persist) localStorage.setItem(S27_MEMBER_SESSION_KEY, raw);
    else sessionStorage.setItem(S27_MEMBER_SESSION_KEY, raw);
  } catch {
    // storage full / blocked
  }
  emitS27SessionChange();
}

export function clearS27Session() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(S27_MEMBER_SESSION_KEY);
    sessionStorage.removeItem(S27_MEMBER_SESSION_KEY);
  } catch {
    // ignore
  }
  emitS27SessionChange();
}

/** Update the active session in whichever store it’s currently in. */
export function patchS27Session(patch: Partial<S27MemberSession>) {
  const current = readS27Session();
  if (!current) return null;
  const next: S27MemberSession = {
    ...current,
    ...patch,
    memberNumber: String(patch.memberNumber ?? current.memberNumber).trim(),
    memberEmail: String(patch.memberEmail ?? current.memberEmail).trim(),
    memberName: String(patch.memberName ?? current.memberName).trim(),
    memberPhone: String(patch.memberPhone ?? current.memberPhone ?? "").trim(),
    signedInAt: String(patch.signedInAt ?? current.signedInAt),
  };
  writeS27Session(next, sessionIsPersistent());
  return next;
}

export function readRememberedSignIn(): S27RememberedSignIn | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(S27_MEMBER_REMEMBER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<S27RememberedSignIn>;
    const email = String(parsed.email || "").trim();
    if (!email) return null;
    return { email, password: String(parsed.password || "") };
  } catch {
    return null;
  }
}

export function writeRememberedSignIn(email: string, password: string) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(
      S27_MEMBER_REMEMBER_KEY,
      JSON.stringify({ email: email.trim(), password })
    );
  } catch {
    // ignore
  }
}

export function clearRememberedSignIn() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(S27_MEMBER_REMEMBER_KEY);
  } catch {
    // ignore
  }
}
