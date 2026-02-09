"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { XCircle, Loader2, Calendar, Clock, User, SendHorizontal } from "lucide-react";
import Link from "next/link";
import { Booking } from "@/lib/types";
import { Suspense } from "react";

function decodeBookingToken(token: string): Booking | null {
  try {
    const data = atob(token.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(data) as Booking;
  } catch {
    return null;
  }
}

function DeclineBookingContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"declining" | "success" | "error">("declining");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState("");
  const [alternativesCount, setAlternativesCount] = useState(0);
  const hasDeclined = useRef(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("No booking token provided");
      return;
    }

    const decodedBooking = decodeBookingToken(token);
    if (decodedBooking) {
      setBooking(decodedBooking);
    }

    if (hasDeclined.current) return;
    hasDeclined.current = true;

    (async () => {
      try {
        const response = await fetch("/api/decline-booking", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to decline booking");
        }

        setBooking(data.booking);
        setAlternativesCount(data.alternativesOffered || 0);
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
    const wholeHour = Math.floor(hour);
    const mins = Math.round((hour - wholeHour) * 60);
    const hour12 = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
    const ampm = hour >= 12 ? "PM" : "AM";
    return `${hour12}:${String(mins).padStart(2, "0")} ${ampm}`;
  };

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="bg-[#1a1a1a] text-white px-6 py-8 text-center">
          <h1 className="text-2xl font-light tracking-tight mb-2">
            {status === "success"
              ? "Client Notified"
              : status === "error"
              ? "Something went wrong"
              : "Sending alternatives..."}
          </h1>
          <p className="text-[#a39e95] text-[11px] tracking-[0.15em] uppercase">
            DiFazio Tennis
          </p>
        </div>

        <div className="p-6">
          {/* Error State */}
          {status === "error" && (
            <div className="text-center py-6">
              <XCircle className="h-14 w-14 text-red-400 mx-auto mb-4" />
              <p className="text-[#7a756d] text-[13px] mb-6">{error}</p>
              <Link
                href="/book"
                className="inline-block px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium hover:bg-[#333] transition-colors"
              >
                Go to Calendar
              </Link>
            </div>
          )}

          {/* Success State */}
          {status === "success" && booking && (
            <div className="text-center py-4">
              <SendHorizontal className="h-12 w-12 text-[#8a8477] mx-auto mb-4" />
              <p className="text-[#4a4a4a] text-[14px] mb-1">
                {booking.clientName || "The client"} has been notified that the
                court is unavailable.
              </p>
              <p className="text-[#7a756d] text-[12px] mb-5">
                {alternativesCount > 0
                  ? `${alternativesCount} alternative time${alternativesCount !== 1 ? "s" : ""} were included in the email.`
                  : "No alternative times were available to suggest."}
              </p>

              <div className="bg-[#faf9f7] border border-[#e8e5df] rounded-xl p-4 mb-6 text-left">
                <p className="text-[10px] tracking-[0.1em] uppercase text-[#8a8477] font-medium mb-3">
                  Declined Request
                </p>
                <div className="space-y-2 text-[13px]">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-[#a39e95]" />
                    <span className="text-[#1a1a1a]">
                      {booking.clientName || "Guest"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#a39e95]" />
                    <span className="text-[#1a1a1a]">
                      {formatDate(booking.date)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#a39e95]" />
                    <span className="text-[#1a1a1a]">
                      {formatTime(booking.hour)}
                    </span>
                  </div>
                </div>
              </div>

              <Link
                href="/book"
                className="inline-block px-6 py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium hover:bg-[#333] transition-colors"
              >
                View Calendar
              </Link>
            </div>
          )}

          {/* Declining State */}
          {status === "declining" && (
            <div className="text-center py-8">
              <Loader2 className="h-12 w-12 text-[#8a8477] mx-auto mb-4 animate-spin" />
              <p className="text-[#1a1a1a] text-[14px] font-medium mb-2">
                Notifying client...
              </p>
              {booking && (
                <p className="text-[#7a756d] text-[12px]">
                  {booking.clientName || "Client"} &middot;{" "}
                  {formatDate(booking.date)} &middot;{" "}
                  {formatTime(booking.hour)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DeclineBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] max-w-lg w-full p-8 text-center">
            <Loader2 className="h-12 w-12 text-[#8a8477] mx-auto mb-4 animate-spin" />
            <p className="text-[#7a756d] text-[13px]">Loading...</p>
          </div>
        </div>
      }
    >
      <DeclineBookingContent />
    </Suspense>
  );
}
