import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Booking } from "@/lib/types";
import { sendEmail } from "@/lib/send-email";
import { clientConfirmationEmail, adminConfirmationEmail } from "@/lib/email-templates";
import { formatTime } from "@/lib/utils";
import { getBookingServerClient } from "@/lib/supabase/booking-server";

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

    // ── Persist booking & mark time slot as booked in Supabase ──
    const supabase = getBookingServerClient();
    const isMember = !!booking.memberCode;

    // 1. Save the booking with status "confirmed"
    const confirmedBooking = { ...booking, status: "confirmed" as const };
    const { error: bookingErr } = await supabase
      .from("bookings")
      .upsert({
        id: confirmedBooking.id,
        time_slot_id: confirmedBooking.timeSlotId,
        date: confirmedBooking.date,
        hour: confirmedBooking.hour,
        client_name: confirmedBooking.clientName,
        client_email: confirmedBooking.clientEmail,
        client_phone: confirmedBooking.clientPhone,
        status: confirmedBooking.status,
        created_at: confirmedBooking.createdAt,
        payment_status: confirmedBooking.paymentStatus || null,
        amount: confirmedBooking.amount,
        member_code: confirmedBooking.memberCode || null,
        member_id: confirmedBooking.memberId || null,
      }, { onConflict: "id" });

    if (bookingErr) {
      console.error("[confirm-booking] Failed to save booking:", bookingErr);
    }

    // 2. Mark the time slot as booked with client info
    const slotId = confirmedBooking.timeSlotId || `${confirmedBooking.date}-${confirmedBooking.hour}`;
    const { error: slotErr } = await supabase
      .from("time_slots")
      .upsert({
        id: slotId,
        date: confirmedBooking.date,
        hour: confirmedBooking.hour,
        available: true,
        booked: true,
        booked_by: confirmedBooking.clientName || null,
        booked_email: confirmedBooking.clientEmail || null,
        booked_phone: confirmedBooking.clientPhone || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (slotErr) {
      console.error("[confirm-booking] Failed to mark time slot as booked:", slotErr);
    }

    // For members, build a charge URL instead of Stripe checkout
    // For non-members, create Stripe checkout session for the email payment link
    let stripeCheckoutUrl = "";
    let chargeUrl = "";
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (isMember && booking.memberId) {
      // Build a charge URL the admin can click after the lesson
      const chargeToken = Buffer.from(JSON.stringify({
        bookingId: booking.id,
        memberId: booking.memberId,
        amount: booking.amount,
      })).toString("base64url");
      chargeUrl = `${baseUrl}/charge-member?token=${chargeToken}`;
    } else if (stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-12-15.clover" });
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [{
            price_data: {
              currency: "usd",
              product_data: {
                name: "Tennis Lesson",
                description: `Private lesson on ${booking.date} at ${formatTime(booking.hour)}`,
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
    const adminEmailContent = adminConfirmationEmail(booking, chargeUrl);

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
