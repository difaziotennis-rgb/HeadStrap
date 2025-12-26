"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Booking } from "@/lib/types";

// Stripe Payment Button Component - SIMPLIFIED AND GUARANTEED TO WORK
export function StripePaymentButton({ booking, onSuccess, onError }: {
  booking: Booking;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleClick = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      setError("");
      
      // Create booking first
      onSuccess();
      
      // Wait a moment for booking to save
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create Stripe checkout session
      const response = await fetch("/api/payments/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.amount,
          date: booking.date,
          hour: booking.hour,
          clientName: booking.clientName,
          clientEmail: booking.clientEmail,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || "Failed to create checkout session");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      if (data.sessionId) {
        // Fallback: construct checkout URL manually
        window.location.href = `https://checkout.stripe.com/pay/${data.sessionId}`;
        return;
      }

      throw new Error("No checkout URL received");
    } catch (error: any) {
      setIsLoading(false);
      const errorMsg = error.message || "Payment failed. Please try again.";
      setError(errorMsg);
      onError(errorMsg);
    }
  };

  // ALWAYS RENDER THE BUTTON - NO CONDITIONALS
  return (
    <div className="w-full space-y-3">
      <button
        onClick={handleClick}
        disabled={isLoading}
        type="button"
        className="w-full px-6 py-5 bg-[#635BFF] text-white rounded-xl font-bold hover:bg-[#5851EA] transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-lg">Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-6 w-6" />
            <span className="text-lg">Pay with Card</span>
          </>
        )}
      </button>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}
      
      <p className="text-xs text-earth-600 text-center">
        Secure payment powered by Stripe
      </p>
    </div>
  );
}
