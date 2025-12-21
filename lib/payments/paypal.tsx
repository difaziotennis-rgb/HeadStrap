"use client";

import { PayPalScriptProvider, PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js";
import { Booking } from "@/lib/types";

interface PayPalPaymentProps {
  booking: Booking;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
}

// PayPal Button Component
function PayPalButton({ booking, onSuccess, onError }: PayPalPaymentProps) {
  const [{ isPending }] = usePayPalScriptReducer();

  const createOrder = (data: any, actions: any) => {
    return actions.order.create({
      purchase_units: [
        {
          amount: {
            value: booking.amount.toString(),
            currency_code: "USD",
          },
          description: `Tennis Lesson - ${booking.date} at ${booking.hour}:00`,
        },
      ],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const order = await actions.order.capture();
      onSuccess(order.id);
    } catch (error: any) {
      onError(error.message || "Payment failed");
    }
  };

  const handleError = (err: any) => {
    onError(err.message || "Payment error occurred");
  };

  if (isPending) {
    return <div className="text-center py-4">Loading PayPal...</div>;
  }

  return (
    <PayPalButtons
      createOrder={createOrder}
      onApprove={onApprove}
      onError={handleError}
      style={{
        layout: "vertical",
        color: "blue",
        shape: "rect",
        label: "paypal",
      }}
    />
  );
}

// Main PayPal Payment Component
// DEPRECATED: This component is no longer used. Use PayPalPersonalPayment instead.
// This file is kept for backward compatibility but should not be imported.
export function PayPalPayment({ booking, onSuccess, onError }: PayPalPaymentProps) {
  // This component should NOT be used anymore
  // If you see this error, the site is using cached/old code
  // This component should NOT be used anymore
  // If you see this error, the site is using cached/old code
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
      <p className="font-semibold mb-2">⚠️ Old PayPal Component Detected</p>
      <p className="mb-2">The site is using cached code. Please:</p>
      <ol className="list-decimal list-inside space-y-1 mb-2">
        <li>Redeploy in Vercel (without cache)</li>
        <li>Clear browser cache completely</li>
        <li>Test in Incognito/Private mode</li>
      </ol>
      <p className="text-xs mt-2">The new PayPal component (PayPalPersonalPayment) should be used instead.</p>
    </div>
  );
}

// Process PayPal payment on server
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

