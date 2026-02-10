import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingServerClient } from "@/lib/supabase/booking-server";
import { sendEmail } from "@/lib/send-email";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const supabase = getBookingServerClient();
  const now = new Date().toISOString();

  // Find member bookings that are due for auto-charge
  const { data: dueBookings, error } = await supabase
    .from("bookings")
    .select("*")
    .not("member_id", "is", null)
    .not("auto_charge_at", "is", null)
    .lte("auto_charge_at", now)
    .eq("auto_charge_cancelled", false)
    .neq("payment_status", "paid")
    .eq("status", "confirmed");

  if (error) {
    console.error("[cron] Error fetching due bookings:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  if (!dueBookings || dueBookings.length === 0) {
    return NextResponse.json({ processed: 0, message: "No charges due" });
  }

  const results: { bookingId: string; success: boolean; error?: string }[] = [];

  for (const booking of dueBookings) {
    try {
      // Get member info
      const { data: member } = await supabase
        .from("members")
        .select("*")
        .eq("id", booking.member_id)
        .single();

      if (!member) {
        results.push({ bookingId: booking.id, success: false, error: "Member not found" });
        continue;
      }

      // Get payment method
      const paymentMethods = await stripe.paymentMethods.list({
        customer: member.stripe_customer_id,
        type: "card",
      });

      if (paymentMethods.data.length === 0) {
        results.push({ bookingId: booking.id, success: false, error: "No card on file" });

        // Notify admin
        await sendEmail({
          to: "difaziotennis@gmail.com",
          subject: `Auto-charge failed: ${member.name} — no card on file`,
          html: `<p>Auto-charge for <strong>${member.name}</strong> ($${booking.amount}) failed — no payment method on file.</p>`,
          text: `Auto-charge failed for ${member.name} ($${booking.amount}) — no card on file.`,
        });
        continue;
      }

      const paymentMethod = paymentMethods.data[0];

      // Charge the card
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(booking.amount * 100),
        currency: "usd",
        customer: member.stripe_customer_id,
        payment_method: paymentMethod.id,
        off_session: true,
        confirm: true,
        description: `Tennis lesson — ${member.name} — ${booking.date}`,
        metadata: {
          bookingId: booking.id,
          memberId: member.id,
          memberCode: member.member_code,
          autoCharged: "true",
        },
      });

      // Update booking payment status
      await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", booking.id);

      // Send receipt to client
      const receiptHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
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
  .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f3f0; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#8a8477; }
  .detail-value { font-size:14px; font-weight:500; color:#1a1a1a; text-align:right; }
  .tag { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; background:#e8f5e1; color:#2d5016; }
</style>
</head><body>
<div class="wrapper"><div class="email">
  <div class="header">
    <div class="brand">DiFazio Tennis</div>
    <div style="display:flex; align-items:center; gap:10px; margin-top:6px;">
      <h1>Payment receipt</h1>
      <span class="tag">Paid</span>
    </div>
  </div>
  <div class="body">
    <p>Hi ${member.name}, your card on file has been charged for your tennis lesson.</p>
    <div style="margin:20px 0;">
      <div class="detail-row"><span class="detail-label">Amount</span><span class="detail-value">$${booking.amount}</span></div>
      <div class="detail-row"><span class="detail-label">Card</span><span class="detail-value">•••• ${paymentMethod.card?.last4 || "****"}</span></div>
      <div class="detail-row"><span class="detail-label">Lesson</span><span class="detail-value">${booking.date}</span></div>
    </div>
    <p style="font-size:13px; color:#8a8477;">Thank you for your lesson! See you on the court.</p>
  </div>
  <div class="footer"><div class="footer-text">DiFazio Tennis &middot; Rhinebeck, NY<br><a href="mailto:difaziotennis@gmail.com">difaziotennis@gmail.com</a> &middot; <a href="tel:6319015220">631-901-5220</a></div></div>
</div></div>
</body></html>`;

      await sendEmail({
        to: member.email,
        subject: `Payment Receipt — $${booking.amount} — DiFazio Tennis`,
        html: receiptHtml,
        text: `Hi ${member.name}, your card on file has been charged $${booking.amount} for your tennis lesson on ${booking.date}. Thank you!\n\nDiFazio Tennis`,
      });

      results.push({ bookingId: booking.id, success: true });
    } catch (err: any) {
      console.error(`[cron] Failed to charge booking ${booking.id}:`, err);
      results.push({ bookingId: booking.id, success: false, error: err.message });

      // Notify admin on failure
      await sendEmail({
        to: "difaziotennis@gmail.com",
        subject: `Auto-charge failed for booking ${booking.id}`,
        html: `<p>Auto-charge failed: ${err.message}</p><p>Booking ID: ${booking.id}</p>`,
        text: `Auto-charge failed: ${err.message}\nBooking ID: ${booking.id}`,
      });
    }
  }

  return NextResponse.json({
    processed: results.length,
    results,
  });
}
