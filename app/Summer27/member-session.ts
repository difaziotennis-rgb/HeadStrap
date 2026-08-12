export const S27_MEMBER_SESSION_KEY = "s27_member_session_v1";
export const S27_MEMBER_SESSION_EVENT = "s27-member-session-changed";

export type S27MemberSession = {
  memberNumber: string;
  memberEmail: string;
  memberName: string;
  memberPhone?: string;
  signedInAt: string;
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
