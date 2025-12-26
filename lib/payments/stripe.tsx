"use client";

import { useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { Booking } from "@/lib/types";

// Your Stripe Payment Link
const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/14A5kD2SDeduaET9YD7N600";

interface StripePaymentButtonProps {
  booking: Booking;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export function StripePaymentButton({ booking, onSuccess, onError }: StripePaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handlePayment = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Create the booking first
      onSuccess();
      
      // Small delay to ensure booking is saved
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Redirect to Stripe payment link
      window.location.href = STRIPE_PAYMENT_LINK;
    } catch (error: any) {
      setIsLoading(false);
      onError(error.message || "Failed to process payment");
    }
  };

  return (
    <div 
      className="w-full"
      style={{
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative',
        zIndex: 9999,
        width: '100%'
      }}
    >
      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full px-6 py-4 bg-[#635BFF] hover:bg-[#5851EA] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          display: 'flex',
          visibility: 'visible',
          opacity: isLoading ? 0.5 : 1,
          minHeight: '56px',
          zIndex: 9999,
          position: 'relative',
          width: '100%',
          cursor: 'pointer',
          border: 'none',
          outline: 'none'
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" style={{ display: 'inline-block' }} />
            <span style={{ display: 'inline-block' }}>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" style={{ display: 'inline-block' }} />
            <span style={{ display: 'inline-block', fontSize: '18px', fontWeight: 'bold' }}>Pay with Card</span>
          </>
        )}
      </button>
      <p 
        className="text-xs text-gray-500 text-center mt-2"
        style={{ display: 'block', visibility: 'visible' }}
      >
        Secure payment via Stripe
      </p>
    </div>
  );
}
