"use client";

import { loadStripe, Stripe, StripeElementsOptions } from "@stripe/stripe-js";
import { Booking } from "@/lib/types";

let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";
    if (!publishableKey) {
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Create Stripe checkout session
export async function createStripeCheckout(booking: Booking) {
  try {
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

    const { sessionId, error } = await response.json();

    if (error) {
      throw new Error(error);
    }

    const stripe = await getStripe();
    if (!stripe) {
      throw new Error("Stripe is not configured");
    }

    // Redirect to Stripe Checkout
    // Type assertion needed - redirectToCheckout exists at runtime
    const { error: redirectError } = await (stripe as any).redirectToCheckout({
      sessionId: sessionId,
    });

    if (redirectError) {
      throw new Error(redirectError.message);
    }
  } catch (error: any) {
    console.error("Error creating Stripe checkout:", error);
    throw error;
  }
}

// Stripe Payment Button Component
export function StripePaymentButton({ booking, onSuccess, onError }: {
  booking: Booking;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const handleClick = async () => {
    try {
      // For Stripe, create the booking BEFORE redirecting to Stripe
      // This ensures the booking exists when Stripe redirects back
      // onSuccess creates the booking (but doesn't redirect for Stripe)
      onSuccess();
      
      // Small delay to ensure booking is saved before redirect
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Now redirect to Stripe checkout
      // Stripe will redirect back to /booking-success?id={bookingId}&payment=success
      await createStripeCheckout(booking);
    } catch (error: any) {
      onError(error.message || "Payment failed");
    }
  };

  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

  // Debug logging
  if (typeof window !== "undefined") {
    console.log("🔍 Stripe Debug:", {
      hasKey: !!publishableKey,
      keyPrefix: publishableKey ? publishableKey.substring(0, 10) + "..." : "none",
      component: "StripePaymentButton",
    });
  }

  if (!publishableKey) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-2">⚠️ Stripe Not Configured</p>
        <p className="mb-2">Please add <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</code> to your Vercel environment variables.</p>
        <p className="text-xs mt-2">Go to: Vercel Dashboard → Settings → Environment Variables</p>
        <p className="text-xs">The key should start with <code className="bg-yellow-100 px-1 rounded">pk_test_</code> or <code className="bg-yellow-100 px-1 rounded">pk_live_</code></p>
      </div>
    );
  }

  return (
    <button
      onClick={handleClick}
      className="w-full px-6 py-3 bg-[#635BFF] text-white rounded-lg font-semibold hover:bg-[#5851EA] transition-colors flex items-center justify-center gap-2"
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 2.81 1.769 4.415 4.699 5.557 2.172.806 3.356 1.426 3.356 2.409 0 .98-.84 1.545-2.354 1.545-1.905 0-4.515-.858-6.09-1.631L2.098 21.5c1.997.902 4.9 1.5 8.067 1.5 2.498 0 4.576-.654 6.09-1.872 1.545-1.275 2.348-3.147 2.348-5.373 0-2.81-1.769-4.415-4.699-5.557z"/>
      </svg>
      Pay with Card
    </button>
  );
}

