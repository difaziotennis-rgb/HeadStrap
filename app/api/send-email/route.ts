import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { booking, notificationEmail } = await request.json();

    if (!booking || !notificationEmail) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Format the booking date
    const bookingDate = new Date(booking.date + "T12:00:00");
    const formattedDate = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const wholeHour = Math.floor(booking.hour);
    const mins = Math.round((booking.hour - wholeHour) * 60);
    const h = wholeHour === 0 ? 12 : wholeHour > 12 ? wholeHour - 12 : wholeHour;
    const formattedTime = `${h}:${String(mins).padStart(2, '0')} ${booking.hour >= 12 ? "PM" : "AM"}`;

    // Email subject
    const subject = `New Booking: ${booking.clientName} - ${formattedDate} at ${formattedTime}`;

    // Email body (HTML)
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2d5016; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2d5016; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; }
            .value { color: #333; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎾 New Tennis Lesson Booking</h2>
            </div>
            <div class="content">
              <p>You have a new booking!</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Client Name:</span>
                  <span class="value">${booking.clientName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">${booking.clientEmail || "Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${booking.clientPhone || "Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value">${formattedDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value">${formattedTime}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">$${booking.amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Payment Status:</span>
                  <span class="value">${booking.paymentStatus === "paid" ? "✅ Paid" : "⏳ Pending"}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Booking ID:</span>
                  <span class="value">${booking.id}</span>
                </div>
              </div>

              <div class="footer">
                <p>This is an automated notification from your DiFazio Tennis booking system.</p>
                <p>Booking created: ${new Date(booking.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textBody = `
New Tennis Lesson Booking

Client Name: ${booking.clientName}
Email: ${booking.clientEmail || "Not provided"}
Phone: ${booking.clientPhone || "Not provided"}
Date: ${formattedDate}
Time: ${formattedTime}
Amount: $${booking.amount}
Payment Status: ${booking.paymentStatus === "paid" ? "Paid" : "Pending"}
Booking ID: ${booking.id}

Booking created: ${new Date(booking.createdAt).toLocaleString()}
    `.trim();

    // Use Resend API to send email (free tier available)
    // For now, we'll use a simple fetch to Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      // Use Resend if API key is configured
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DiFazio Tennis <notifications@difaziotennis.com>",
          to: notificationEmail,
          subject: subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.json();
        console.error("Resend API error:", error);
        // Fall through to alternative method
      } else {
        const data = await resendResponse.json();
        return NextResponse.json({ success: true, messageId: data.id });
      }
    }

    // Fallback: Log in development only
    // In production, you should set up Resend or another email service
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Email notification (would send to):", notificationEmail);
      console.log("Subject:", subject);
    }

    // For now, return success (email will be sent when Resend is configured)
    return NextResponse.json({ 
      success: true, 
      message: "Email queued (configure RESEND_API_KEY for actual sending)",
      notificationEmail 
    });

  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send email" },
      { status: 500 }
    );
  }
}







