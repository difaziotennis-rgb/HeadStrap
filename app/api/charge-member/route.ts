import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingServerClient } from "@/lib/supabase/booking-server";
import { sendEmail } from "@/lib/send-email";

export async function POST(request: Request) {
  try {
    const { bookingId, memberId, amount } = await request.json();

    if (!memberId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Payment system not configured" },
        { status: 500 }
      );
    }

    const stripe = new Stripe(stripeSecretKey);
    const supabase = getBookingServerClient();

    // Get member's Stripe customer ID
    const { data: member, error: memberErr } = await supabase
      .from("members")
      .select("*")
      .eq("id", memberId)
      .single();

    if (memberErr || !member) {
      return NextResponse.json(
        { error: "Member not found" },
        { status: 404 }
      );
    }

    // Get the customer's default payment method
    const customer = await stripe.customers.retrieve(member.stripe_customer_id);
    if (customer.deleted) {
      return NextResponse.json(
        { error: "Stripe customer no longer exists" },
        { status: 400 }
      );
    }

    // List payment methods for the customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: member.stripe_customer_id,
      type: "card",
    });

    if (paymentMethods.data.length === 0) {
      return NextResponse.json(
        { error: "No payment method on file. Client needs to update their card." },
        { status: 400 }
      );
    }

    const paymentMethod = paymentMethods.data[0];

    // Create and confirm a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      customer: member.stripe_customer_id,
      payment_method: paymentMethod.id,
      off_session: true,
      confirm: true,
      description: `Tennis lesson — ${member.name}`,
      metadata: {
        bookingId: bookingId || "",
        memberId: member.id,
        memberCode: member.member_code,
      },
    });

    // Update booking payment status if bookingId provided
    if (bookingId) {
      await supabase
        .from("bookings")
        .update({ payment_status: "paid" })
        .eq("id", bookingId);
    }

    // Send receipt email to client
    const receiptHtml = `<!DOCTYPE html>
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
  .detail-row { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid #f5f3f0; }
  .detail-row:last-child { border-bottom:none; }
  .detail-label { font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#8a8477; }
  .detail-value { font-size:14px; font-weight:500; color:#1a1a1a; text-align:right; }
  .tag { display:inline-block; padding:3px 10px; border-radius:99px; font-size:11px; font-weight:500; letter-spacing:0.05em; text-transform:uppercase; background:#e8f5e1; color:#2d5016; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="email">
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
        <div class="detail-row">
          <span class="detail-label">Amount</span>
          <span class="detail-value">$${amount}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Card</span>
          <span class="detail-value">•••• ${paymentMethod.card?.last4 || "****"}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Member</span>
          <span class="detail-value">${member.member_code}</span>
        </div>
      </div>
      <p style="font-size:13px; color:#8a8477;">Thank you for your lesson! See you on the court.</p>
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

    await sendEmail({
      to: member.email,
      subject: `Payment Receipt — $${amount} — DiFazio Tennis`,
      html: receiptHtml,
      text: `Payment Receipt\n\nHi ${member.name},\n\nYour card on file has been charged $${amount} for your tennis lesson.\nCard: •••• ${paymentMethod.card?.last4 || "****"}\n\nThank you!\nDiFazio Tennis`,
    });

    return NextResponse.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      message: `$${amount} charged to ${member.name}'s card on file`,
    });
  } catch (error: any) {
    console.error("Error charging member:", error);

    // Handle card declined errors gracefully
    if (error.type === "StripeCardError") {
      return NextResponse.json(
        { error: `Card declined: ${error.message}` },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: error.message || "Failed to charge member" },
      { status: 500 }
    );
  }
}
