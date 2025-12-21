"use client";

import { ExternalLink, Smartphone } from "lucide-react";
import { Booking } from "@/lib/types";
import { getVenmoHandle } from "@/lib/payment-config";

interface VenmoPaymentProps {
  booking: Booking;
  onSuccess: () => void;
}

export function VenmoPayment({ booking, onSuccess }: VenmoPaymentProps) {
  // Get Venmo handle from hardcoded config (with localStorage fallback)
  const venmoHandle = getVenmoHandle();

  if (!venmoHandle) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800">
        Venmo handle not configured. Please contact support.
      </div>
    );
  }

  // Clean the handle (remove @ if present, remove spaces, handle phone numbers)
  let cleanHandle = venmoHandle.replace(/^@/, "").replace(/\s+/g, "").replace(/[()-]/g, "");
  
  // If it's a phone number (digits only), format it differently
  const isPhoneNumber = /^\d+$/.test(cleanHandle);
  
  // Create Venmo payment link
  // Format: venmo.com/pay/{username}/{amount}/{note} or venmo.com/{username}?txn=pay&amount={amount}&note={note}
  const amount = booking.amount.toFixed(2);
  const note = `Tennis Lesson - ${new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} at ${booking.hour}:00`;
  
  // Encode the note for URL (replace spaces with dashes for cleaner URL)
  const cleanNote = note.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "");
  
  // Venmo payment link format - try the /pay/ format first
  // If phone number, use query params format
  let venmoUrl: string;
  if (isPhoneNumber) {
    // For phone numbers, use query params
    const encodedNote = encodeURIComponent(note);
    venmoUrl = `https://venmo.com/?txn=pay&recipients=${cleanHandle}&amount=${amount}&note=${encodedNote}`;
  } else {
    // For usernames, use /pay/ format
    venmoUrl = `https://venmo.com/${cleanHandle}?txn=pay&amount=${amount}&note=${encodeURIComponent(note)}`;
  }

  const handleVenmoClick = () => {
    // Try to open Venmo app first (mobile), then fallback to web
    // On mobile, this will open the Venmo app if installed
    // On desktop, this opens Venmo website
    window.open(venmoUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary-50 rounded-lg p-4">
        <p className="text-sm text-earth-600 mb-2">
          Click the button below to open Venmo and complete your payment.
        </p>
        <div className="text-sm text-primary-800">
          <strong>Amount:</strong> ${amount}
        </div>
        <div className="text-sm text-primary-800">
          <strong>Note:</strong> {note}
        </div>
      </div>

      <button
        onClick={handleVenmoClick}
        className="w-full bg-[#3D95CE] hover:bg-[#2d7fb8] text-white font-bold py-5 px-6 rounded-xl transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
        style={{ backgroundColor: "#3D95CE" }}
      >
        <Smartphone className="h-6 w-6" />
        <span className="text-lg">Pay with Venmo</span>
        <ExternalLink className="h-5 w-5" />
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
        <p className="font-semibold mb-1">After paying:</p>
        <p>Your booking will be confirmed once payment is received. You'll receive a confirmation email.</p>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-600">
        <p className="font-semibold mb-1">Having trouble?</p>
        <p>Open Venmo app and search for: <strong>{cleanHandle}</strong></p>
        <p className="mt-1">Send ${amount} with note: "{note}"</p>
      </div>

      <button
        onClick={() => onSuccess()}
        className="w-full border-2 border-primary-300 text-primary-700 font-medium py-3 px-4 rounded-lg hover:bg-primary-50 transition-colors"
      >
        I've completed the Venmo payment
      </button>
    </div>
  );
}


