import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Booking } from "@/lib/types";
import { sendEmail } from "@/lib/send-email";
import { clientConfirmationEmail, adminConfirmationEmail } from "@/lib/email-templates";

// Decode the booking token
function decodeBookingToken(token: string): Booking | null {
  try {
    const data = Buffer.from(token, "base64url").toString("utf-8");
    return JSON.parse(data) as Booking;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json(
        { error: "Missing confirmation token" },
        { status: 400 }
      );
    }

    // Decode the booking from token
    const booking = decodeBookingToken(token);
    
    if (!booking) {
      return NextResponse.json(
        { error: "Invalid or expired confirmation token" },
        { status: 400 }
      );
    }

    const adminEmail = "difaziotennis@gmail.com";
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create Stripe checkout session for the email payment link
    let stripeCheckoutUrl = "";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: "Tennis Lesson",
                description: `Private lesson on ${booking.date} at ${booking.hour}:00`,
              },
              unit_amount: booking.amount * 100,
            },
            quantity: 1,
          }],
          mode: "payment",
          success_url: `${baseUrl}/booking-success?id=${booking.id}&payment=success`,
          cancel_url: `${baseUrl}/book?payment=cancelled`,
          customer_email: booking.clientEmail || undefined,
          metadata: {
            bookingId: booking.id,
            date: booking.date,
            hour: booking.hour.toString(),
            clientName: booking.clientName,
          },
        });
        stripeCheckoutUrl = session.url || "";
      } catch (e) {
        console.error("Failed to create Stripe checkout session for email:", e);
      }
    }

    // Generate emails from templates
    const clientEmail = clientConfirmationEmail(booking, stripeCheckoutUrl);
    const adminEmailContent = adminConfirmationEmail(booking);

    // Send confirmation email to client
    const clientResult = await sendEmail({
      to: booking.clientEmail,
      subject: clientEmail.subject,
      html: clientEmail.html,
      text: clientEmail.text,
    });

    // Send confirmation email to admin
    const adminResult = await sendEmail({
      to: adminEmail,
      subject: adminEmailContent.subject,
      html: adminEmailContent.html,
      text: adminEmailContent.text,
    });

    return NextResponse.json({ 
      success: true, 
      booking,
      emailsSent: {
        client: clientResult.success,
        admin: adminResult.success
      },
      emailErrors: {
        client: clientResult.error || null,
        admin: adminResult.error || null
      },
      message: "Booking confirmed successfully"
    });

  } catch (error: any) {
    console.error("Error confirming booking:", error);
    return NextResponse.json(
      { error: error.message || "Failed to confirm booking" },
      { status: 500 }
    );
  }
}
