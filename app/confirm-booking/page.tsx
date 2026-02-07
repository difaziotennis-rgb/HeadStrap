"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Calendar, Clock, User, Mail } from "lucide-react";
import Link from "next/link";
import { Booking } from "@/lib/types";
import { Suspense } from "react";

// Decode the booking token client-side for display
function decodeBookingToken(token: string): Booking | null {
  try {
    const data = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(data) as Booking;
  } catch {
    return null;
  }
}

function ConfirmBookingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  
  const [status, setStatus] = useState<"confirming" | "success" | "error">("confirming");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ client: boolean; admin: boolean } | null>(null);
  const [emailErrors, setEmailErrors] = useState<{ client: any; admin: any } | null>(null);
  const hasConfirmed = useRef(false);

  // Auto-confirm on page load -- one click from the email
  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No booking token provided");
      return;
    }

    // Decode token to show booking details while confirming
    const decodedBooking = decodeBookingToken(token);
    if (decodedBooking) {
      setBooking(decodedBooking);
    }

    // Prevent double-confirm in React strict mode
    if (hasConfirmed.current) return;
    hasConfirmed.current = true;

    // Immediately confirm the booking
    (async () => {
      try {
        const response = await fetch("/api/confirm-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to confirm booking");
        }

        setBooking(data.booking);
        setEmailStatus(data.emailsSent || null);
        setEmailErrors(data.emailErrors || null);
        setStatus("success");
      } catch (err: any) {
        setError(err.message || "An error occurred");
        setStatus("error");
      }
    })();
  }, [token]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T12:00:00");
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (hour: number) => {
    const hour12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour12}:00 ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-primary-600 text-white px-6 py-8 text-center">
          <h1 className="text-2xl font-serif font-semibold mb-2">
            {status === "success" ? "Lesson Confirmed!" : status === "error" ? "Something went wrong" : "Confirming..."}
          </h1>
          <p className="text-primary-100 text-sm">DiFazio Tennis</p>
        </div>

        <div className="p-6">
          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-6">
              <XCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-6">{error}</p>
              <Link
                href="/book"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                Go to Booking Page
              </Link>
            </div>
          )}

          {/* Success State */}
          {status === "success" && booking && (
            <div className="text-center py-4">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                {emailStatus?.client && emailStatus?.admin
                  ? "Confirmation emails sent to you and the client."
                  : emailStatus?.admin
                  ? "Confirmation sent to you. Client email may be pending."
                  : "Booking confirmed."}
              </p>

              {emailErrors?.client && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left text-sm">
                  <p className="font-semibold text-red-800">Client email issue:</p>
                  <p className="text-red-700 font-mono text-xs mt-1">
                    {typeof emailErrors.client === "string"
                      ? emailErrors.client
                      : JSON.stringify(emailErrors.client)}
                  </p>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">{booking.clientName || "Guest"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">{booking.clientEmail}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">{formatDate(booking.date)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="text-gray-700">{formatTime(booking.hour)}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/book"
                className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
              >
                View Calendar
              </Link>
            </div>
          )}

          {/* Confirming State */}
          {status === "confirming" && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-700 font-medium mb-2">Confirming lesson...</p>
              {booking && (
                <p className="text-gray-500 text-sm">
                  {booking.clientName || "Client"} &middot; {formatDate(booking.date)} &middot; {formatTime(booking.hour)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmBookingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-8 text-center">
          <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <ConfirmBookingContent />
    </Suspense>
  );
}
