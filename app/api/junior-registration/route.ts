import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/send-email";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const {
      childName,
      childAge,
      parentName,
      parentEmail,
      parentPhone,
      experience,
      ageGroup,
      ageGroupLabel,
      registrationType,
      selectedWeeks,
      selectedDay,
      totalPrice,
      notes,
    } = data;

    const typeLabel = registrationType === "weekly" ? "Weekly" : "Drop-in";
    const scheduleDetail = registrationType === "weekly"
      ? `${(selectedWeeks || []).length} week(s)`
      : `Drop-in: ${selectedDay || "TBD"}`;
    const timeSlot = ageGroup === "6-11" ? "11:00 AM – 12:00 PM" : "12:00 – 1:00 PM";
    const groupLabel = ageGroupLabel || (ageGroup === "6-11" ? "Ages 6–11" : "Ages 12–16");

    if (!childName || !parentName || !parentEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const adminEmail = "difaziotennis@gmail.com";

    // Email to admin
    const adminHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#f7f7f5; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a; }
  .wrapper { width:100%; background:#f7f7f5; padding:40px 16px; }
  .email { max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .header { padding:32px 32px 24px; border-bottom:1px solid #f0ede8; }
  .brand { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#8a8477; margin-bottom:8px; }
  .body { padding:28px 32px; }
  .footer { padding:20px 32px; border-top:1px solid #f0ede8; text-align:center; }
  .footer-text { font-size:11px; color:#b0a99f; }
  h1 { font-size:22px; font-weight:600; color:#1a1a1a; margin:0; }
  p { font-size:14px; line-height:1.6; color:#4a4a4a; margin:0 0 16px; }
  .tag { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; background:#e8f5e1; color:#2d5016; }
  .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f3f0; }
  .row:last-child { border-bottom:none; }
  .label { font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#8a8477; }
  .value { font-size:14px; font-weight:500; color:#1a1a1a; text-align:right; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="email">
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
        <h1>New Junior Registration</h1>
        <span class="tag">Summer Clinic</span>
      </div>
    </div>
    <div class="body">
      <p>A new registration has come in for the Junior Summer Clinic.</p>
      <div style="margin:20px 0;">
        <div class="row"><span class="label">Player</span><span class="value">${childName}</span></div>
        <div class="row"><span class="label">Age</span><span class="value">${childAge || "Not provided"}</span></div>
        <div class="row"><span class="label">Group</span><span class="value">${groupLabel}</span></div>
        <div class="row"><span class="label">Time</span><span class="value">${timeSlot}</span></div>
        <div class="row"><span class="label">Experience</span><span class="value">${experience || "Not specified"}</span></div>
        <div class="row"><span class="label">Type</span><span class="value">${typeLabel} — ${scheduleDetail}</span></div>
        <div class="row"><span class="label">Total</span><span class="value">$${totalPrice || 0}</span></div>
        <div class="row"><span class="label">Parent</span><span class="value">${parentName}</span></div>
        <div class="row"><span class="label">Email</span><span class="value"><a href="mailto:${parentEmail}" style="color:#2d5016; text-decoration:none;">${parentEmail}</a></span></div>
        ${parentPhone ? `<div class="row"><span class="label">Phone</span><span class="value"><a href="tel:${parentPhone}" style="color:#2d5016; text-decoration:none;">${parentPhone}</a></span></div>` : ""}
        ${notes ? `<div class="row"><span class="label">Notes</span><span class="value" style="font-size:13px; max-width:280px;">${notes}</span></div>` : ""}
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">Registered ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</div>
    </div>
  </div>
</div>
</body>
</html>`;

    const adminText = `New Junior Registration

Player: ${childName}
Age: ${childAge || "Not provided"}
Group: ${groupLabel}
Time: ${timeSlot}
Experience: ${experience || "Not specified"}
Type: ${typeLabel} — ${scheduleDetail}
Total: $${totalPrice || 0}
Parent: ${parentName}
Email: ${parentEmail}
Phone: ${parentPhone || "Not provided"}
Notes: ${notes || "None"}`;

    // Email to parent
    const parentHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin:0; padding:0; background:#f7f7f5; font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; color:#1a1a1a; }
  .wrapper { width:100%; background:#f7f7f5; padding:40px 16px; }
  .email { max-width:520px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
  .header { padding:32px 32px 24px; border-bottom:1px solid #f0ede8; }
  .brand { font-size:11px; letter-spacing:0.2em; text-transform:uppercase; color:#8a8477; margin-bottom:8px; }
  .body { padding:28px 32px; }
  .footer { padding:20px 32px; border-top:1px solid #f0ede8; text-align:center; }
  .footer-text { font-size:11px; color:#b0a99f; line-height:1.6; }
  .footer-text a { color:#8a8477; text-decoration:none; }
  h1 { font-size:22px; font-weight:600; color:#1a1a1a; margin:0; }
  p { font-size:14px; line-height:1.6; color:#4a4a4a; margin:0 0 16px; }
  .row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f3f0; }
  .row:last-child { border-bottom:none; }
  .label { font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#8a8477; }
  .value { font-size:14px; font-weight:500; color:#1a1a1a; text-align:right; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="email">
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <h1>You're registered!</h1>
    </div>
    <div class="body">
      <p>Hi ${parentName},</p>
      <p>Thanks for registering ${childName} for the Junior Summer Clinic! Here's a summary of your registration.</p>
      <div style="margin:20px 0;">
        <div class="row"><span class="label">Player</span><span class="value">${childName}</span></div>
        <div class="row"><span class="label">Group</span><span class="value">${groupLabel}</span></div>
        <div class="row"><span class="label">Schedule</span><span class="value">Sun / Wed / Fri</span></div>
        <div class="row"><span class="label">Time</span><span class="value">${timeSlot}</span></div>
        <div class="row"><span class="label">Registration</span><span class="value">${typeLabel} — ${scheduleDetail}</span></div>
        <div class="row"><span class="label">Total</span><span class="value">$${totalPrice || 0}</span></div>
        <div class="row"><span class="label">Location</span><span class="value">Rhinebeck Tennis Club</span></div>
      </div>
      <p>We'll follow up with additional details including start date, what to bring, and payment information. In the meantime, feel free to reach out with any questions!</p>
    </div>
    <div class="footer">
      <div class="footer-text">
        DiFazio Tennis &middot; Rhinebeck, NY<br>
        <a href="mailto:difaziotennis@gmail.com">difaziotennis@gmail.com</a> &middot; <a href="tel:6319015220">631-901-5220</a>
      </div>
    </div>
  </div>
</div>
</body>
</html>`;

    const parentText = `You're registered!

Hi ${parentName},

Thanks for registering ${childName} for the Junior Summer Clinic!

Group: ${groupLabel}
Schedule: Sunday, Wednesday, Friday
Time: ${timeSlot}
Registration: ${typeLabel} — ${scheduleDetail}
Total: $${totalPrice || 0}
Location: Rhinebeck Tennis Club, Rhinebeck, NY

We'll follow up with additional details including start date, what to bring, and payment information.

DiFazio Tennis - Rhinebeck, NY
difaziotennis@gmail.com | 631-901-5220`;

    // Send both emails
    const [adminResult, parentResult] = await Promise.all([
      sendEmail({
        to: adminEmail,
        subject: `Junior Clinic Registration: ${childName} (age ${childAge || "?"})`,
        html: adminHtml,
        text: adminText,
      }),
      sendEmail({
        to: parentEmail,
        subject: "You're Registered! – DiFazio Tennis Junior Summer Clinic",
        html: parentHtml,
        text: parentText,
      }),
    ]);

    return NextResponse.json({
      success: true,
      emailsSent: {
        admin: adminResult.success,
        parent: parentResult.success,
      },
    });
  } catch (error: any) {
    console.error("Junior registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
