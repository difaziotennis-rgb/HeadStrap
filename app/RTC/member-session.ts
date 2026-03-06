export const MEMBER_MODE_KEY = "rtc_member_mode_v1";
export const MEMBER_SESSION_KEY = "rtc_member_session_v1";
export const MEMBER_SESSION_EVENT = "rtc-member-session-changed";

export type MemberSession = {
  memberNumber: string;
  memberEmail: string;
  memberName?: string;
  signedInAt: string;
};

export function isValidMemberNumber(value: string): boolean {
  return /^\d{3}$/.test(value.trim());
}

export function parseMemberSession(raw: string | null): MemberSession | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<MemberSession>;
    if (!parsed?.memberNumber || !isValidMemberNumber(parsed.memberNumber)) return null;
    return {
      memberNumber: parsed.memberNumber.trim(),
      memberEmail: String(parsed.memberEmail || "").trim(),
      memberName: String(parsed.memberName || "").trim(),
      signedInAt: String(parsed.signedInAt || new Date().toISOString()),
    };
  } catch {
    return null;
  }
}
