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
export function PayPalPayment({ booking, onSuccess, onError }: PayPalPaymentProps) {
  // Redirect to the new PayPal component
  console.warn("Old PayPal component is being used. This should not happen. Using PayPalPersonalPayment instead.");
  
  // Import and use the new component instead
  const { PayPalPersonalPayment } = require("./paypal-personal");
  return <PayPalPersonalPayment booking={booking} onSuccess={() => onSuccess("")} />;

  return (
    <PayPalScriptProvider
      options={{
        clientId,
        currency: "USD",
        intent: "capture",
        // Enable Venmo
        "enable-funding": "venmo",
      }}
    >
      <PayPalButton booking={booking} onSuccess={onSuccess} onError={onError} />
    </PayPalScriptProvider>
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

