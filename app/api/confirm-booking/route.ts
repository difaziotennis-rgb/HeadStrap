import { NextResponse } from "next/server";
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

    // Generate emails from templates
    const clientEmail = clientConfirmationEmail(booking);
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
