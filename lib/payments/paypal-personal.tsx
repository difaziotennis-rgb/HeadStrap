"use client";

import { ExternalLink, Wallet } from "lucide-react";
import { Booking } from "@/lib/types";
import { PAYMENT_CONFIG } from "@/lib/payment-config";

interface PayPalPersonalPaymentProps {
  booking: Booking;
  onSuccess: () => void;
}

/**
 * PayPal payment for personal/non-business accounts
 * Uses PayPal.me links or email-based payment links
 * 
 * NOTE: This component does NOT require NEXT_PUBLIC_PAYPAL_CLIENT_ID
 * It uses hardcoded PayPal.me username from payment-config.ts
 */
export function PayPalPersonalPayment({ booking, onSuccess }: PayPalPersonalPaymentProps) {
  // VERSION: 2.1 - FORCE CACHE INVALIDATION - This component does NOT require NEXT_PUBLIC_PAYPAL_CLIENT_ID
  // If you see an error about NEXT_PUBLIC_PAYPAL_CLIENT_ID, you're using OLD cached code!
  // This component uses PayPal.me links - NO API KEYS NEEDED!
  
  // Get PayPal configuration
  const paypalMeUsername = PAYMENT_CONFIG.paypalMeUsername?.trim() || "";
  const paypalEmail = PAYMENT_CONFIG.paypalEmail?.trim() || "";
  
  // Only log in development
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Development-only logging
  }
  
  // Verify PayPal is configured
  if (!paypalMeUsername && !paypalEmail) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        <p className="font-semibold mb-2">⚠️ PayPal Configuration Missing</p>
        <p className="mb-2">This component uses PayPal.me links and does NOT require API keys.</p>
        <p className="mb-1">PayPal.me username: <strong>{paypalMeUsername || "Not set"}</strong></p>
        <p>PayPal email: <strong>{paypalEmail || "Not set"}</strong></p>
        <p className="mt-2 text-xs">Please check lib/payment-config.ts</p>
        <p className="mt-2 text-xs font-mono">Component: PayPalPersonalPayment (correct)</p>
      </div>
    );
  }

  const amount = booking.amount.toFixed(2);
  const wh = Math.floor(booking.hour);
  const mn = Math.round((booking.hour - wh) * 60);
  const dh = wh === 0 ? 12 : wh > 12 ? wh - 12 : wh;
  const timeStr = dh + ":" + String(mn).padStart(2, "0") + " " + (booking.hour >= 12 ? "PM" : "AM");
  const note = `Tennis Lesson - ${new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} at ${timeStr}`;
  
  // Create PayPal payment link
  let paypalUrl: string;
  
  if (PAYMENT_CONFIG.paypalMeUsername) {
    // Use PayPal.me link (e.g., paypal.me/derek-difazio/160)
    const cleanUsername = PAYMENT_CONFIG.paypalMeUsername.replace(/^@/, "").replace(/^paypal\.me\//, "");
    paypalUrl = `https://paypal.me/${cleanUsername}/${amount}?locale.x=en_US`;
  } else if (PAYMENT_CONFIG.paypalEmail) {
    // Use email-based payment link
    const encodedNote = encodeURIComponent(note);
    const encodedEmail = encodeURIComponent(PAYMENT_CONFIG.paypalEmail);
    paypalUrl = `https://www.paypal.com/send?amount=${amount}&currencyCode=USD&recipient=${encodedEmail}&note=${encodedNote}`;
  } else {
    // Should not reach here due to check above, but just in case
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
        PayPal configuration error. Please contact support.
      </div>
    );
  }

  const handlePayPalClick = () => {
    window.open(paypalUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 rounded-lg p-4">
        <p className="text-sm text-earth-600 mb-2">
          Click the button below to open PayPal and complete your payment.
        </p>
        <div className="text-sm text-primary-800">
          <strong>Amount:</strong> ${amount}
        </div>
        <div className="text-sm text-primary-800">
          <strong>Note:</strong> {note}
        </div>
        {PAYMENT_CONFIG.paypalMeUsername && (
          <div className="text-xs text-earth-500 mt-2">
            PayPal.me: @{PAYMENT_CONFIG.paypalMeUsername}
          </div>
        )}
        {!PAYMENT_CONFIG.paypalMeUsername && (
          <div className="text-xs text-earth-500 mt-2">
            Send to: {PAYMENT_CONFIG.paypalEmail}
          </div>
        )}
      </div>

      <button
        onClick={handlePayPalClick}
        className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        style={{ backgroundColor: "#0070BA" }}
      >
        <Wallet className="h-6 w-6" />
        <span className="text-lg">Pay with PayPal</span>
        <ExternalLink className="h-5 w-5" />
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">After paying:</p>
        <p>Your booking will be confirmed once payment is received. You'll receive a confirmation email.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">Having trouble?</p>
        {PAYMENT_CONFIG.paypalMeUsername ? (
          <>
            <p>Open PayPal app and go to: <strong>paypal.me/{PAYMENT_CONFIG.paypalMeUsername}</strong></p>
            <p className="mt-1">Send ${amount} with note: "{note}"</p>
          </>
        ) : (
          <>
            <p>Open PayPal and send ${amount} to: <strong>{PAYMENT_CONFIG.paypalEmail}</strong></p>
            <p className="mt-1">Include note: "{note}"</p>
          </>
        )}
      </div>

      <button
        onClick={() => onSuccess()}
        className="w-full border-2 border-primary-300 text-primary-700 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-colors"
      >
        I've completed the PayPal payment
      </button>
    </div>
  );
}

