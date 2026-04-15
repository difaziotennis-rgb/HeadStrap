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

    // Determine if using sandbox or production based on client ID
    // Sandbox client IDs typically start with "Ae" or "AQ", production with "AY" or "AR"
    // Or use environment variable to explicitly set mode
    const isSandbox = process.env.PAYPAL_ENVIRONMENT === "sandbox" || 
                      clientId.startsWith("Ae") || 
                      clientId.startsWith("AQ") ||
                      clientId.includes("sandbox");
    
    const apiUrl = isSandbox 
      ? "https://api.sandbox.paypal.com"
      : "https://api.paypal.com";

    // Verify payment with PayPal
    const response = await fetch(
      `${apiUrl}/v2/checkout/orders/${paymentId}`,
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


