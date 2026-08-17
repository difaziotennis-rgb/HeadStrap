export const S27_PRO_SESSION_KEY = "s27_pro_session_v1";
export const S27_PRO_SESSION_EVENT = "s27-pro-session-changed";

export type S27ProSession = {
  proId: string;
  proEmail: string;
  proName: string;
  signedInAt: string;
};

export function parseS27ProSession(raw: string | null): S27ProSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<S27ProSession>;
    if (!parsed?.proId || !parsed?.proEmail) return null;
    return {
      proId: String(parsed.proId).trim(),
      proEmail: String(parsed.proEmail).trim(),
      proName: String(parsed.proName || "").trim(),
      signedInAt: String(parsed.signedInAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

function canUseStorage() {
  return typeof window !== "undefined";
}

export function emitS27ProSessionChange() {
  if (!canUseStorage()) return;
  window.dispatchEvent(new Event(S27_PRO_SESSION_EVENT));
}

export function readS27ProSession(): S27ProSession | null {
  if (!canUseStorage()) return null;
  try {
    return parseS27ProSession(localStorage.getItem(S27_PRO_SESSION_KEY));
  } catch {
    return null;
  }
}

export function writeS27ProSession(session: S27ProSession) {
  if (!canUseStorage()) return;
  try {
    localStorage.setItem(S27_PRO_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore
  }
  emitS27ProSessionChange();
}

export function clearS27ProSession() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(S27_PRO_SESSION_KEY);
  } catch {
    // ignore
  }
  emitS27ProSessionChange();
}
