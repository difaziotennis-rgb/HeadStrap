import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { paymentId, bookingId } = await request.json();

    // In production, verify the payment with PayPal API
    const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        { error: "PayPal is not configured" },
        { status: 500 }
      );
    }

    // Verify payment with PayPal
    const response = await fetch(
      `https://api.sandbox.paypal.com/v2/checkout/orders/${paymentId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
        },
      }
    );

    const payment = await response.json();

    if (payment.status === "COMPLETED") {
      // Update booking in database with payment info
      // This is where you'd save to Firestore or your database
      
      return NextResponse.json({
        success: true,
        paymentId,
        bookingId,
      });
    }

    return NextResponse.json(
      { error: "Payment not completed" },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}


