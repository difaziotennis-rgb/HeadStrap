import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}

// Create a reusable Gmail SMTP transporter
function createTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user,
      pass,
    },
  });
}

/**
 * Send an email using Gmail SMTP via Nodemailer.
 * Emails are sent directly from difaziotennis@gmail.com.
 */
export async function sendEmail({ to, subject, html, text, replyTo }: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    console.error("Gmail SMTP not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.");
    return { success: false, error: "Email not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: `"DiFazio Tennis" <${process.env.GMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(", ") : to,
      subject,
      html,
      text,
      replyTo: replyTo || process.env.GMAIL_USER,
    });

    console.log("Email sent:", info.messageId, "to:", to);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to send email:", error.message);
    return { success: false, error: error.message };
  }
}
