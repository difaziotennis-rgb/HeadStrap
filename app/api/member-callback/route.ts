import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getBookingServerClient } from "@/lib/supabase/booking-server";
import { sendEmail } from "@/lib/send-email";

function generateMemberCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // No I, O, 0, 1 to avoid confusion
  let code = "DT-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function memberWelcomeEmail(name: string, memberCode: string) {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { margin: 0; padding: 0; background-color: #f7f7f5; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a1a1a; }
  .wrapper { width: 100%; background-color: #f7f7f5; padding: 40px 16px; }
  .email { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .header { padding: 32px 32px 24px; border-bottom: 1px solid #f0ede8; }
  .brand { font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #8a8477; margin-bottom: 8px; }
  .body { padding: 28px 32px; }
  .footer { padding: 20px 32px; border-top: 1px solid #f0ede8; text-align: center; }
  .footer-text { font-size: 11px; color: #b0a99f; line-height: 1.6; }
  .footer-text a { color: #8a8477; text-decoration: none; }
  h1 { font-size: 22px; font-weight: 600; color: #1a1a1a; margin: 0; }
  p { font-size: 14px; line-height: 1.6; color: #4a4a4a; margin: 0 0 16px; }
  .code-box { text-align: center; padding: 24px; margin: 20px 0; background: #f7f7f5; border-radius: 10px; border: 1px solid #e8e5df; }
  .code { font-size: 32px; font-weight: 700; letter-spacing: 0.1em; color: #1a1a1a; font-family: "SF Mono", Monaco, "Cascadia Code", monospace; }
  .code-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8a8477; margin-bottom: 8px; }
</style>
</head>
<body>
<div class="wrapper">
  <div class="email">
    <div class="header">
      <div class="brand">DiFazio Tennis</div>
      <h1>Welcome, ${name}!</h1>
    </div>
    <div class="body">
      <p>You're now a DiFazio Tennis member. Your card has been saved securely with Stripe — you'll never need to handle payment manually again.</p>

      <div class="code-box">
        <div class="code-label">Your Member Code</div>
        <div class="code">${memberCode}</div>
      </div>

      <p>When booking a lesson, just enter this code and your card on file will be charged automatically upon completion of your lesson. No more fumbling with payments!</p>

      <p style="font-size:13px; color:#8a8477;">Keep this code handy — you'll use it every time you book. If you ever need to update your card, just visit our membership page.</p>
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

  const text = `Welcome, ${name}!

You're now a DiFazio Tennis member. Your card has been saved securely.

Your Member Code: ${memberCode}

When booking a lesson, just enter this code and your card on file will be charged automatically upon completion of your lesson.

DiFazio Tennis - Rhinebeck, NY
difaziotennis@gmail.com | 631-901-5220`;

  return {
    subject: `Welcome to DiFazio Tennis — Your Member Code: ${memberCode}`,
    html,
    text,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.redirect(
        new URL("/become-a-member?error=missing_session", request.url)
      );
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return NextResponse.redirect(
        new URL("/become-a-member?error=config", request.url)
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    // Retrieve the session to get the customer
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session.customer) {
      return NextResponse.redirect(
        new URL("/become-a-member?error=no_customer", request.url)
      );
    }

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer.id;

    const name = session.metadata?.customerName || "";
    const email = session.metadata?.customerEmail || session.customer_email || "";
    const phone = session.metadata?.customerPhone || "";

    const supabase = getBookingServerClient();

    // Check if this customer already exists
    const { data: existing } = await supabase
      .from("members")
      .select("member_code")
      .eq("stripe_customer_id", customerId)
      .single();

    if (existing) {
      // Already a member, redirect with their existing code
      return NextResponse.redirect(
        new URL(
          `/become-a-member?success=true&code=${existing.member_code}&name=${encodeURIComponent(name)}`,
          request.url
        )
      );
    }

    // Generate a unique member code
    let memberCode = generateMemberCode();
    let attempts = 0;
    while (attempts < 10) {
      const { data: dup } = await supabase
        .from("members")
        .select("id")
        .eq("member_code", memberCode)
        .single();
      if (!dup) break;
      memberCode = generateMemberCode();
      attempts++;
    }

    // Save to Supabase
    const { error: insertError } = await supabase.from("members").insert({
      member_code: memberCode,
      stripe_customer_id: customerId,
      name,
      email,
      phone: phone || null,
      active: true,
    });

    if (insertError) {
      console.error("Failed to save member:", insertError);
      return NextResponse.redirect(
        new URL("/become-a-member?error=save_failed", request.url)
      );
    }

    // Send welcome email with their code
    const welcomeEmail = memberWelcomeEmail(name, memberCode);
    await sendEmail({
      to: email,
      subject: welcomeEmail.subject,
      html: welcomeEmail.html,
      text: welcomeEmail.text,
    });

    // Also notify admin
    await sendEmail({
      to: "difaziotennis@gmail.com",
      subject: `New Member: ${name} (${memberCode})`,
      html: `<p><strong>${name}</strong> (${email}) just signed up as a member.</p><p>Member code: <strong>${memberCode}</strong></p>`,
      text: `New Member: ${name} (${email}) — Code: ${memberCode}`,
    });

    return NextResponse.redirect(
      new URL(
        `/become-a-member?success=true&code=${memberCode}&name=${encodeURIComponent(name)}`,
        request.url
      )
    );
  } catch (error: any) {
    console.error("Member callback error:", error);
    return NextResponse.redirect(
      new URL("/become-a-member?error=unknown", request.url)
    );
  }
}
