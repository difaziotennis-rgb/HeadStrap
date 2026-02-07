"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, XCircle, Loader2, Calendar, Clock, User, Mail, Phone, DollarSign } from "lucide-react";
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
  
  const [status, setStatus] = useState<"loading" | "confirming" | "success" | "error">("loading");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState<{ client: boolean; admin: boolean } | null>(null);
  const [emailErrors, setEmailErrors] = useState<{ client: any; admin: any } | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No booking token provided");
      return;
    }

    // Decode token to show booking details
    const decodedBooking = decodeBookingToken(token);
    if (decodedBooking) {
      setBooking(decodedBooking);
    }
    setStatus("loading");
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;
    
    setStatus("confirming");
    
    try {
      const response = await fetch("/api/confirm-booking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
  };

  // Format date and time
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
            {status === "success" ? "Lesson Confirmed!" : "Confirm Lesson Booking"}
          </h1>
          <p className="text-primary-100 text-sm">
            DiFazio Tennis
          </p>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-8">
              <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Something went wrong</h2>
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
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-600 mb-4">
                {emailStatus?.client && emailStatus?.admin
                  ? "Confirmation emails have been sent to you and the client."
                  : emailStatus?.admin
                  ? "Confirmation sent to you. Client email may be pending."
                  : "Booking confirmed."}
              </p>

              {emailErrors?.client && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-left text-sm">
                  <p className="font-semibold text-red-800">Client email failed:</p>
                  <p className="text-red-700 font-mono text-xs mt-1">
                    {typeof emailErrors.client === "string"
                      ? emailErrors.client
                      : JSON.stringify(emailErrors.client)}
                  </p>
                </div>
              )}
              
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold text-green-800 mb-3">Confirmed Details</h3>
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

          {/* Loading/Ready to Confirm State */}
          {(status === "loading" || status === "confirming") && booking && (
            <div className="py-4">
              <div className="bg-primary-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-primary-800 mb-3">Booking Request Details</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-primary-600" />
                    <div>
                      <span className="text-gray-500 text-xs">Client</span>
                      <p className="text-gray-800 font-medium">{booking.clientName || "Guest"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <div>
                      <span className="text-gray-500 text-xs">Email</span>
                      <p className="text-gray-800 font-medium">{booking.clientEmail}</p>
                    </div>
                  </div>
                  {booking.clientPhone && (
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary-600" />
                      <div>
                        <span className="text-gray-500 text-xs">Phone</span>
                        <p className="text-gray-800 font-medium">{booking.clientPhone}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary-600" />
                    <div>
                      <span className="text-gray-500 text-xs">Date</span>
                      <p className="text-gray-800 font-medium">{formatDate(booking.date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary-600" />
                    <div>
                      <span className="text-gray-500 text-xs">Time</span>
                      <p className="text-gray-800 font-medium">{formatTime(booking.hour)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-5 w-5 text-primary-600" />
                    <div>
                      <span className="text-gray-500 text-xs">Amount</span>
                      <p className="text-gray-800 font-medium">${booking.amount}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <p className="text-amber-800 text-sm">
                  <strong>⚠️ By clicking Accept:</strong>
                </p>
                <ul className="text-amber-700 text-sm mt-2 list-disc list-inside">
                  <li>The booking will be confirmed</li>
                  <li>A confirmation email will be sent to {booking.clientEmail}</li>
                  <li>A confirmation email will be sent to you</li>
                </ul>
              </div>

              <button
                onClick={handleConfirm}
                disabled={status === "confirming"}
                className="w-full px-6 py-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === "confirming" ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Accept Lesson
                  </>
                )}
              </button>
            </div>
          )}

          {/* No booking data yet */}
          {status === "loading" && !booking && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-primary-600 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Loading booking details...</p>
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
