import { Booking } from "@/lib/types";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

// Shared elegant email wrapper
function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background-color: #f7f7f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; -webkit-font-smoothing: antialiased; }
  .wrapper { width: 100%; background-color: #f7f7f5; padding: 40px 16px; }
  .email { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { padding: 32px 32px 24px; border-bottom: 1px solid #f0ede8; }
  .brand { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8477; margin-bottom: 8px; }
  .body { padding: 28px 32px; }
  .footer { padding: 20px 32px; border-top: 1px solid #f0ede8; text-align: center; }
  .footer-text { font-size: 11px; color: #b0a99f; line-height: 1.6; }
  .footer-text a { color: #8a8477; text-decoration: none; }
  h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0; letter-spacing: -0.01em; }
  p { font-size: 14px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px; }
  .detail-grid { margin: 20px 0; }
  .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f5f3f0; }
  .detail-row:last-child { border-bottom: none; }
  .detail-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; color: #8a8477; }
  .detail-value { font-size: 14px; font-weight: 500; color: #1a1a1a; text-align: right; }
  .btn { display: inline-block; padding: 14px 32px; border-radius: 8px; font-size: 14px; font-weight: 600; text-decoration: none; text-align: center; }
  .btn-primary { background-color: #2d5016; color: #ffffff !important; }
  .btn-dark { background-color: #1a1a1a; color: #ffffff !important; }
  .btn-outline { background-color: #ffffff; color: #1a1a1a !important; border: 1px solid #d9d5cf; }
  .btn-container { text-align: center; margin: 24px 0; }
  .payment-grid { margin: 16px 0 8px; }
  .payment-btn { display: block; width: 100%; padding: 14px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; text-decoration: none; text-align: center; margin-bottom: 8px; box-sizing: border-box; }
  .divider { height: 1px; background-color: #f0ede8; margin: 24px 0; }
  .muted { font-size: 12px; color: #8a8477; }
  .tag { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 500; letter-spacing: 0.05em; text-transform: uppercase; }
  .tag-green { background-color: #e8f5e1; color: #2d5016; }
  .tag-amber { background-color: #fef3c7; color: #92400e; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="email">
    ${content}
  </div>
</div>
</body>
</html>`;
}

// Helper to format booking details
function formatBookingDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function formatTime(hour: number): string {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const h = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
  return `${h}:${minutes.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

// Build payment links
function getPaymentLinks(booking: Booking, formattedDate: string, formattedTime: string) {
  const note = `Tennis lesson - ${formattedDate} at ${formattedTime}`;

  const venmo = PAYMENT_CONFIG.venmoHandle
    ? `https://venmo.com/?txn=pay&recipients=${encodeURIComponent(PAYMENT_CONFIG.venmoHandle.replace(/^@/, ""))}&amount=${booking.amount}&note=${encodeURIComponent(note)}`
    : "";

  // PayPal.me link with amount in the path (e.g. paypal.me/difaziotennis/160.00)
  const paypal = PAYMENT_CONFIG.paypalMeUsername
    ? `https://www.paypal.me/${PAYMENT_CONFIG.paypalMeUsername.replace(/^@/, "").replace(/^paypal\.me\//, "")}/${booking.amount.toFixed(2)}USD`
    : PAYMENT_CONFIG.paypalEmail
    ? `https://www.paypal.com/paypalme/${encodeURIComponent(PAYMENT_CONFIG.paypalEmail)}/${booking.amount.toFixed(2)}`
    : "";

  return { venmo, paypal };
}

// ─── CLIENT CONFIRMATION EMAIL ───────────────────────────────────

export function clientConfirmationEmail(booking: Booking, stripeCheckoutUrl?: string) {
  const date = formatBookingDate(booking.date);
  const time = formatTime(booking.hour);
  const { venmo, paypal } = getPaymentLinks(booking, date, time);

  const html = emailWrapper(`
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <h1>Your lesson is confirmed</h1>
    </div>

    <div class="body">
      <p>Hi ${booking.clientName || "there"}, your private lesson has been confirmed. Details below.</p>

      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Duration</span>
          <span class="detail-value">1 hour</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Location</span>
          <span class="detail-value">Rhinebeck Tennis Club</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Lesson fee</span>
          <span class="detail-value">$${booking.amount}</span>
        </div>
      </div>

      <div class="divider"></div>

      <p style="font-size:13px; color:#8a8477; margin-bottom:12px;">SUBMIT PAYMENT</p>
      <p style="font-size:13px; margin-bottom:16px;">Please pay ahead of your lesson using any option below.</p>

      <div class="payment-grid">
        ${venmo ? `<a href="${venmo}" target="_blank" rel="noopener" class="payment-btn btn-dark">Pay $${booking.amount} with Venmo</a>` : ""}
        ${paypal ? `<a href="${paypal}" target="_blank" rel="noopener" class="payment-btn btn-dark">Pay $${booking.amount} with PayPal</a>` : ""}
        ${stripeCheckoutUrl ? `<a href="${stripeCheckoutUrl}" target="_blank" rel="noopener" class="payment-btn btn-outline">Pay $${booking.amount} with Card</a>` : ""}
      </div>

    </div>

    <div class="footer">
      <div class="footer-text">
        DiFazio Tennis &middot; Rhinebeck, NY<br>
        <a href="mailto:difaziotennis@gmail.com" style="color:#8a8477;">difaziotennis@gmail.com</a> &middot; <a href="tel:6319015220" style="color:#8a8477;">631-901-5220</a>
      </div>
    </div>
  `);

  const text = `
Your lesson is confirmed!

Hi ${booking.clientName || "there"},

Date: ${date}
Time: ${time}
Duration: 1 hour
Location: Rhinebeck Tennis Club
Fee: $${booking.amount}

PAYMENT OPTIONS:
${venmo ? `Venmo: ${venmo}` : ""}
${paypal ? `PayPal: ${paypal}` : ""}
${stripeCheckoutUrl ? `Card: ${stripeCheckoutUrl}` : ""}

DiFazio Tennis - Rhinebeck, NY
difaziotennis@gmail.com | 631-901-5220
  `.trim();

  const subject = `Lesson Confirmed - ${date} at ${time}`;

  return { subject, html, text };
}

// ─── ADMIN CONFIRMATION EMAIL ────────────────────────────────────

export function adminConfirmationEmail(booking: Booking) {
  const date = formatBookingDate(booking.date);
  const time = formatTime(booking.hour);

  const html = emailWrapper(`
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
        <h1>Lesson confirmed</h1>
        <span class="tag tag-green">Accepted</span>
      </div>
    </div>

    <div class="body">
      <p>You accepted this lesson. A confirmation with payment links has been sent to the client.</p>

      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Client</span>
          <span class="detail-value">${booking.clientName || "Not provided"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value"><a href="mailto:${booking.clientEmail}" style="color:#2d5016; text-decoration:none;">${booking.clientEmail}</a></span>
        </div>
        ${booking.clientPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-value"><a href="tel:${booking.clientPhone}" style="color:#2d5016; text-decoration:none;">${booking.clientPhone}</a></span>
        </div>` : ""}
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">$${booking.amount}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">Confirmed ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    </div>
  `);

  const text = `
Lesson Confirmed

Client: ${booking.clientName || "Not provided"}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || "Not provided"}
Date: ${date}
Time: ${time}
Amount: $${booking.amount}

A confirmation has been sent to the client.
  `.trim();

  const subject = `Confirmed: ${booking.clientName || "Client"} - ${date} at ${time}`;

  return { subject, html, text };
}

// ─── COURT UNAVAILABLE / ALTERNATIVES EMAIL (to client) ─────────

export function courtUnavailableEmail(
  booking: Booking,
  alternativeSlots: { date: string; hour: number }[]
) {
  const date = formatBookingDate(booking.date);
  const time = formatTime(booking.hour);

  const altRows = alternativeSlots
    .map((s) => {
      const d = formatBookingDate(s.date);
      const t = formatTime(s.hour);
      const bookUrl = `https://difaziotennis.com/book?date=${s.date}&hour=${s.hour}`;
      return `
        <a href="${bookUrl}" style="display:block; padding:12px 16px; border-bottom:1px solid #f5f3f0; text-decoration:none; color:#2d5016; font-size:14px; font-weight:500;">
          ${d} at ${t}
        </a>`;
    })
    .join("");

  const altText = alternativeSlots
    .map((s) => `  - ${formatBookingDate(s.date)} at ${formatTime(s.hour)}: https://difaziotennis.com/book?date=${s.date}&hour=${s.hour}`)
    .join("\n");

  const html = emailWrapper(`
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <h1>Scheduling update</h1>
    </div>

    <div class="body">
      <p>Hi ${booking.clientName || "there"},</p>
      <p>Unfortunately the indoor court is not available for your requested time on <strong>${date} at ${time}</strong>. Apologies for the inconvenience.</p>

      ${alternativeSlots.length > 0 ? `
        <p>Here are some upcoming available times that you may be interested in:</p>
        <div style="margin:20px 0; border:1px solid #e8e5df; border-radius:10px; overflow:hidden;">
          ${altRows}
        </div>

        <p class="muted" style="text-align:center;">Tap any time above to book it, or browse all available times below.</p>
        <div class="btn-container">
          <a href="https://difaziotennis.com/book" class="btn btn-primary">View All Available Times</a>
        </div>
      ` : `
        <div class="btn-container">
          <a href="https://difaziotennis.com/book" class="btn btn-primary">View Available Times</a>
        </div>
      `}
    </div>

    <div class="footer">
      <div class="footer-text">
        DiFazio Tennis &middot; Rhinebeck, NY<br>
        <a href="mailto:difaziotennis@gmail.com" style="color:#8a8477;">difaziotennis@gmail.com</a> &middot; <a href="tel:6319015220" style="color:#8a8477;">631-901-5220</a>
      </div>
    </div>
  `);

  const text = `
Hi ${booking.clientName || "there"},

Unfortunately the indoor court is not available for your requested time on ${date} at ${time}. Apologies for the inconvenience.

${alternativeSlots.length > 0 ? `Here are some upcoming available times that you may be interested in:\n${altText}\n\nBook a new time: https://difaziotennis.com/book` : `View available times: https://difaziotennis.com/book`}

DiFazio Tennis - Rhinebeck, NY
difaziotennis@gmail.com | 631-901-5220
  `.trim();

  const subject = `Scheduling Update - ${date} at ${time}`;

  return { subject, html, text };
}

// ─── ADMIN DECLINE CONFIRMATION EMAIL ───────────────────────────

export function adminDeclineConfirmationEmail(
  booking: Booking,
  alternativeSlots: { date: string; hour: number }[]
) {
  const date = formatBookingDate(booking.date);
  const time = formatTime(booking.hour);

  const altList = alternativeSlots
    .map((s) => `${formatBookingDate(s.date)} at ${formatTime(s.hour)}`)
    .join(", ");

  const html = emailWrapper(`
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
        <h1>Lesson declined</h1>
        <span class="tag tag-amber">Court Unavailable</span>
      </div>
    </div>

    <div class="body">
      <p>You declined this lesson due to court unavailability. The client has been notified${alternativeSlots.length > 0 ? " with alternative times" : ""}.</p>

      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Client</span>
          <span class="detail-value">${booking.clientName || "Not provided"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Requested</span>
          <span class="detail-value">${date} at ${time}</span>
        </div>
        ${alternativeSlots.length > 0 ? `
        <div class="detail-row">
          <span class="detail-label">Alternatives Sent</span>
          <span class="detail-value" style="font-size:12px;">${altList}</span>
        </div>` : ""}
      </div>
    </div>

    <div class="footer">
      <div class="footer-text">Declined ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
    </div>
  `);

  const text = `
Lesson Declined (Court Unavailable)

Client: ${booking.clientName || "Not provided"}
Requested: ${date} at ${time}
${alternativeSlots.length > 0 ? `Alternatives sent: ${altList}` : "No alternatives available"}

The client has been notified.
  `.trim();

  const subject = `Declined: ${booking.clientName || "Client"} - ${date} at ${time} (court unavailable)`;

  return { subject, html, text };
}

// ─── ADMIN LESSON REQUEST EMAIL ──────────────────────────────────

export function adminRequestEmail(booking: Booking, confirmUrl: string, declineUrl?: string) {
  const date = formatBookingDate(booking.date);
  const time = formatTime(booking.hour);

  const html = emailWrapper(`
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
        <h1>New lesson request</h1>
        <span class="tag tag-amber">Pending</span>
      </div>
    </div>

    <div class="body">
      <p>A client has requested a lesson. Review the details and accept below.</p>

      <div class="detail-grid">
        <div class="detail-row">
          <span class="detail-label">Client</span>
          <span class="detail-value">${booking.clientName || "Not provided"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email</span>
          <span class="detail-value">${booking.clientEmail}</span>
        </div>
        ${booking.clientPhone ? `
        <div class="detail-row">
          <span class="detail-label">Phone</span>
          <span class="detail-value">${booking.clientPhone}</span>
        </div>` : ""}
        <div class="detail-row">
          <span class="detail-label">Date</span>
          <span class="detail-value">${date}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time</span>
          <span class="detail-value">${time}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">$${booking.amount}</span>
        </div>
      </div>

      <div class="btn-container" style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        <a href="${confirmUrl}" class="btn btn-primary">Accept Lesson</a>
        ${declineUrl ? `<a href="${declineUrl}" class="btn btn-outline" style="color:#92400e !important; border-color:#e8c87a;">Court Unavailable</a>` : ""}
      </div>

      <p class="muted" style="text-align:center;">Accept sends a confirmation with payment links. Court Unavailable notifies the client and suggests alternative times.</p>
    </div>

    <div class="footer">
      <div class="footer-text">Requested ${new Date(booking.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
    </div>
  `);

  const text = `
New Lesson Request

Client: ${booking.clientName || "Not provided"}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || "Not provided"}
Date: ${date}
Time: ${time}
Amount: $${booking.amount}

Accept this lesson: ${confirmUrl}
${declineUrl ? `\nCourt unavailable? Notify client with alternatives: ${declineUrl}` : ""}
  `.trim();

  const subject = `New Lesson Request: ${booking.clientName || "Client"} - ${date} at ${time}`;

  return { subject, html, text };
}
