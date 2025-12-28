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

  const handlePayment = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // Create the booking first (but don't wait for it to complete)
      onSuccess();
      
      // IMMEDIATELY redirect to Stripe - don't wait
      // The booking will be saved in the background
      window.location.href = STRIPE_PAYMENT_LINK;
    } catch (error: any) {
      setIsLoading(false);
      onError(error.message || "Failed to process payment");
    }
  };

  return (
    <div 
      style={{
        width: '100%',
        display: 'block',
        visibility: 'visible',
        opacity: 1,
        position: 'relative',
        zIndex: 99999,
        margin: '0',
        padding: '0'
      }}
    >
      <button
        type="button"
        onClick={handlePayment}
        disabled={isLoading}
        style={{
          width: '100%',
          padding: '16px 24px',
          backgroundColor: '#635BFF',
          color: '#FFFFFF',
          fontSize: '18px',
          fontWeight: 'bold',
          borderRadius: '8px',
          border: 'none',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          transition: 'all 0.2s',
          opacity: isLoading ? 0.6 : 1,
          minHeight: '56px',
          zIndex: 99999,
          position: 'relative',
          visibility: 'visible'
        }}
        onMouseEnter={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#5851EA';
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading) {
            e.currentTarget.style.backgroundColor = '#635BFF';
          }
        }}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5" />
            <span>Pay with Card</span>
          </>
        )}
      </button>
      <p 
        style={{ 
          fontSize: '12px',
          color: '#6B7280',
          textAlign: 'center',
          marginTop: '8px',
          display: 'block',
          visibility: 'visible'
        }}
      >
        Secure payment via Stripe
      </p>
    </div>
  );
}
