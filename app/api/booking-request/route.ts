import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
                    "http://localhost:3000";
    
    const confirmUrl = `${baseUrl}/confirm-booking?token=${token}`;

    // Format the booking date
    const bookingDate = new Date(booking.date + "T12:00:00");
    const formattedDate = bookingDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const hour12 = booking.hour > 12 ? booking.hour - 12 : booking.hour === 0 ? 12 : booking.hour;
    const ampm = booking.hour >= 12 ? "PM" : "AM";
    const formattedTime = `${hour12}:00 ${ampm}`;

    const notificationEmail = "difaziotennis@gmail.com";
    const subject = `🎾 New Lesson Request: ${booking.clientName || "Client"} - ${formattedDate} at ${formattedTime}`;

    // Email body (HTML) for admin
    const htmlBody = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #2d5016; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-radius: 0 0 8px 8px; }
            .booking-details { background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #2d5016; }
            .detail-row { margin: 10px 0; }
            .label { font-weight: bold; color: #555; display: inline-block; width: 100px; }
            .value { color: #333; }
            .accept-button { 
              display: inline-block; 
              background-color: #2d5016; 
              color: white !important; 
              padding: 15px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: bold;
              font-size: 18px;
              margin: 20px 0;
            }
            .accept-button:hover { background-color: #3d6a1f; }
            .button-container { text-align: center; margin: 30px 0; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
            .warning { background-color: #fff3cd; border: 1px solid #ffc107; padding: 10px; border-radius: 5px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎾 New Lesson Request</h2>
              <p style="margin: 0; opacity: 0.9;">Action Required</p>
            </div>
            <div class="content">
              <p>You have a new lesson booking request! Please review the details below and click <strong>Accept</strong> to confirm.</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Client:</span>
                  <span class="value">${booking.clientName || "Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value">${booking.clientEmail}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${booking.clientPhone || "Not provided"}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value"><strong>${formattedDate}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value"><strong>${formattedTime}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">$${booking.amount}</span>
                </div>
              </div>

              <div class="button-container">
                <a href="${confirmUrl}" class="accept-button">✓ Accept Lesson</a>
              </div>

              <div class="warning">
                <strong>⚠️ Note:</strong> Clicking Accept will:
                <ul style="margin: 5px 0 0 0; padding-left: 20px;">
                  <li>Confirm the booking</li>
                  <li>Send a confirmation email to the client at ${booking.clientEmail}</li>
                  <li>Send a confirmation email to you</li>
                </ul>
              </div>

              <div class="footer">
                <p>This request was submitted on ${new Date(booking.createdAt).toLocaleString()}</p>
                <p>Request ID: ${booking.id}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    // Plain text version
    const textBody = `
New Tennis Lesson Request

Client: ${booking.clientName || "Not provided"}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || "Not provided"}
Date: ${formattedDate}
Time: ${formattedTime}
Amount: $${booking.amount}

To ACCEPT this lesson, click here:
${confirmUrl}

Request submitted: ${new Date(booking.createdAt).toLocaleString()}
Request ID: ${booking.id}
    `.trim();

    // Send email using Resend
    const RESEND_API_KEY = process.env.RESEND_API_KEY;
    
    if (RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "DiFazio Tennis <difaziotennis@gmail.com>",
          to: notificationEmail,
          subject: subject,
          html: htmlBody,
          text: textBody,
        }),
      });

      if (!resendResponse.ok) {
        const error = await resendResponse.json();
        console.error("Resend API error:", error);
      } else {
        const data = await resendResponse.json();
        return NextResponse.json({ 
          success: true, 
          messageId: data.id,
          message: "Booking request sent to admin"
        });
      }
    }

    // Fallback for development
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Booking request email (would send to):", notificationEmail);
      console.log("Subject:", subject);
      console.log("Confirm URL:", confirmUrl);
    }

    return NextResponse.json({ 
      success: true, 
      message: "Booking request submitted (configure RESEND_API_KEY for email)",
      confirmUrl: process.env.NODE_ENV === "development" ? confirmUrl : undefined
    });

  } catch (error: any) {
    console.error("Error processing booking request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process booking request" },
      { status: 500 }
    );
  }
}
