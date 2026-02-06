import { NextResponse } from "next/server";
import { Booking } from "@/lib/types";

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

    const adminEmail = "difaziotennis@gmail.com";
    const RESEND_API_KEY = process.env.RESEND_API_KEY;

    // Send confirmation email to CLIENT
    const clientSubject = `✅ Lesson Confirmed: ${formattedDate} at ${formattedTime}`;
    const clientHtml = `
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
            .success-banner { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
            .contact { background-color: #e7f3ff; padding: 15px; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>🎾 Lesson Confirmed!</h2>
            </div>
            <div class="content">
              <div class="success-banner">
                <h3 style="margin: 0;">✅ Your tennis lesson has been confirmed!</h3>
              </div>
              
              <p>Hi ${booking.clientName || "there"},</p>
              <p>Great news! Your lesson request has been accepted. Here are your booking details:</p>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Date:</span>
                  <span class="value"><strong>${formattedDate}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Time:</span>
                  <span class="value"><strong>${formattedTime}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Duration:</span>
                  <span class="value">1 hour</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">$${booking.amount}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Location:</span>
                  <span class="value">Rhinebeck Tennis Club, Rhinebeck NY</span>
                </div>
              </div>

              <div class="contact">
                <strong>📞 Questions?</strong><br>
                Contact Derek DiFazio:<br>
                Email: <a href="mailto:difaziotennis@gmail.com">difaziotennis@gmail.com</a><br>
                Phone: <a href="tel:6319015220">631-901-5220</a>
              </div>

              <div class="footer">
                <p>Booking ID: ${booking.id}</p>
                <p>See you on the court! 🎾</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const clientText = `
Lesson Confirmed!

Hi ${booking.clientName || "there"},

Great news! Your tennis lesson has been confirmed.

BOOKING DETAILS:
Date: ${formattedDate}
Time: ${formattedTime}
Duration: 1 hour
Amount: $${booking.amount}
Location: Rhinebeck Tennis Club, Rhinebeck NY

Questions? Contact Derek DiFazio:
Email: difaziotennis@gmail.com
Phone: 631-901-5220

Booking ID: ${booking.id}

See you on the court! 🎾
    `.trim();

    // Send confirmation email to ADMIN
    const adminSubject = `✅ Lesson Confirmed: ${booking.clientName || "Client"} - ${formattedDate} at ${formattedTime}`;
    const adminHtml = `
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
            .success-banner { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 5px; text-align: center; margin-bottom: 20px; }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #777; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>✅ Lesson Confirmed</h2>
            </div>
            <div class="content">
              <div class="success-banner">
                <h3 style="margin: 0;">You accepted this lesson!</h3>
                <p style="margin: 5px 0 0 0;">A confirmation has been sent to the client.</p>
              </div>
              
              <div class="booking-details">
                <div class="detail-row">
                  <span class="label">Client:</span>
                  <span class="value"><strong>${booking.clientName || "Not provided"}</strong></span>
                </div>
                <div class="detail-row">
                  <span class="label">Email:</span>
                  <span class="value"><a href="mailto:${booking.clientEmail}">${booking.clientEmail}</a></span>
                </div>
                <div class="detail-row">
                  <span class="label">Phone:</span>
                  <span class="value">${booking.clientPhone ? `<a href="tel:${booking.clientPhone}">${booking.clientPhone}</a>` : "Not provided"}</span>
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

              <div class="footer">
                <p>Booking ID: ${booking.id}</p>
                <p>Confirmed on: ${new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    const adminText = `
Lesson Confirmed!

You accepted this lesson. A confirmation has been sent to the client.

Client: ${booking.clientName || "Not provided"}
Email: ${booking.clientEmail}
Phone: ${booking.clientPhone || "Not provided"}
Date: ${formattedDate}
Time: ${formattedTime}
Amount: $${booking.amount}

Booking ID: ${booking.id}
Confirmed on: ${new Date().toLocaleString()}
    `.trim();

    let clientEmailSent = false;
    let adminEmailSent = false;

    if (RESEND_API_KEY) {
      // Send to client
      try {
        const clientResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DiFazio Tennis <notifications@difaziotennis.com>",
            to: booking.clientEmail,
            subject: clientSubject,
            html: clientHtml,
            text: clientText,
          }),
        });
        clientEmailSent = clientResponse.ok;
        if (!clientResponse.ok) {
          console.error("Failed to send client email:", await clientResponse.json());
        }
      } catch (e) {
        console.error("Error sending client email:", e);
      }

      // Send to admin
      try {
        const adminResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "DiFazio Tennis <notifications@difaziotennis.com>",
            to: adminEmail,
            subject: adminSubject,
            html: adminHtml,
            text: adminText,
          }),
        });
        adminEmailSent = adminResponse.ok;
        if (!adminResponse.ok) {
          console.error("Failed to send admin email:", await adminResponse.json());
        }
      } catch (e) {
        console.error("Error sending admin email:", e);
      }
    }

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("📧 Confirmation emails:");
      console.log("  - Client:", booking.clientEmail, clientEmailSent ? "✅" : "⏳");
      console.log("  - Admin:", adminEmail, adminEmailSent ? "✅" : "⏳");
    }

    return NextResponse.json({ 
      success: true, 
      booking,
      emailsSent: {
        client: clientEmailSent,
        admin: adminEmailSent
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
