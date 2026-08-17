import { sendEmail } from "@/lib/send-email";
import { canSendS27MemberEmail } from "./stripe-server";

type SendOpts = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

function isFakeAddress(email: string) {
  const e = email.trim().toLowerCase();
  return !e || /@(example\.com|test\.com|example\.org)$/i.test(e);
}

/**
 * Club member mail. No-ops until live Stripe (or S27_SEND_EMAIL=1).
 * Never delivers to mock @example.com addresses.
 */
export async function sendS27MemberEmail(
  opts: SendOpts
): Promise<{ success: boolean; emailed: boolean; skipped?: "preview" | "fake-address"; error?: string }> {
  const to = opts.to.trim();
  if (isFakeAddress(to)) {
    return { success: true, emailed: false, skipped: "fake-address" };
  }
  if (!canSendS27MemberEmail()) {
    console.info("[s27 email] skipped until live", { to, subject: opts.subject });
    return { success: true, emailed: false, skipped: "preview" };
  }
  const result = await sendEmail({
    to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.replyTo || "difaziotennis@gmail.com",
  });
  return { success: result.success, emailed: !!result.success, error: result.error };
}
