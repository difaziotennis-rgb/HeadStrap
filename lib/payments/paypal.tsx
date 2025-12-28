/**
 * DEPRECATED: This file is no longer used.
 * 
 * The old PayPal component required NEXT_PUBLIC_PAYPAL_CLIENT_ID.
 * We now use PayPalPersonalPayment (in paypal-personal.tsx) which uses PayPal.me links
 * and does NOT require any API keys.
 * 
 * This file is kept only for the processPayPalPayment function used by the API route.
 * The component itself should NEVER be imported or used.
 */

import { Booking } from "@/lib/types";

// DO NOT IMPORT THIS COMPONENT - Use PayPalPersonalPayment instead!
// This export is disabled to prevent accidental imports
export function PayPalPayment() {
  throw new Error(
    "PayPalPayment component is deprecated. Use PayPalPersonalPayment from '@/lib/payments/paypal-personal' instead. " +
    "If you see this error, the site is using old cached code. Please redeploy in Vercel without cache."
  );
}

// Process PayPal payment on server (used by API route)
export async function processPayPalPayment(paymentId: string, bookingId: string) {
  try {
    const response = await fetch("/api/payments/paypal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        paymentId,
        bookingId,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error processing PayPal payment:", error);
    throw error;
  }
}
