import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";
import { sendEmail } from "@/lib/send-email";
import { adminRequestEmail } from "@/lib/email-templates";

// Simple encoding for the booking token (in production, use proper JWT)
function encodeBookingToken(booking: Booking): string {
  const data = JSON.stringify(booking);
  return Buffer.from(data).toString("base64url");
}

export async function POST(request: Request) {
  try {
    const { booking } = await request.json();

    if (!booking || !booking.clientEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Generate confirmation token
    const token = encodeBookingToken(booking);
    
    // Get base URL for the confirmation link
    // Use explicit base URL first, fall back to localhost for dev
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    
    const confirmUrl = `${baseUrl}/confirm-booking?token=${token}`;

    const notificationEmail = "difaziotennis@gmail.com";

    // Generate email from template
    const email = adminRequestEmail(booking, confirmUrl);

    // Send email via Gmail SMTP
    const result = await sendEmail({
      to: notificationEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
    });

    if (!result.success) {
      console.error("Failed to send booking request email:", result.error);
    }

    return NextResponse.json({ 
      success: true, 
      emailSent: result.success,
      emailError: result.error || null,
      message: result.success 
        ? "Booking request sent to admin" 
        : "Booking request submitted but email failed to send"
    });

  } catch (error: any) {
    console.error("Error processing booking request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process booking request" },
      { status: 500 }
    );
  }
}
