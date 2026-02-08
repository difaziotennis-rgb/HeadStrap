"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Calendar, Clock, DollarSign, CreditCard } from "lucide-react";
import { Booking } from "@/lib/types";
import { readBooking, writeBooking, readAllSlots, writeSlot } from "@/lib/booking-data";
import { formatTime } from "@/lib/utils";
import { format } from "date-fns";
import { PaymentModal } from "@/components/payment-modal";

function BookingSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("id");
  const paymentStatus = searchParams.get("payment");
  const [booking, setBooking] = useState<Booking | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!bookingId) return;

    async function loadBooking() {
      // Try Supabase first
      let found = await readBooking(bookingId!);

      // Fall back to sessionStorage (for in-flight bookings)
      if (!found) {
        const stored = sessionStorage.getItem(`booking_${bookingId}`);
        if (stored) {
          try {
            found = JSON.parse(stored) as Booking;
          } catch {
            // Invalid
          }
        }
      }

      if (found) {
        setBooking(found);
        if (paymentStatus === "success" && found.paymentStatus === "pending") {
          found.paymentStatus = "paid";
          found.status = "confirmed";

          // Persist booking
          await writeBooking(found);
          sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(found));

          // Mark the time slot as booked
          const slotId = `${found.date}-${found.hour}`;
          const allSlots = await readAllSlots();
          const existingSlot = allSlots[slotId];
          if (existingSlot) {
            await writeSlot({
              ...existingSlot,
              booked: true,
              bookedBy: found.clientName,
              bookedEmail: found.clientEmail,
              bookedPhone: found.clientPhone,
            });
          } else {
            await writeSlot({
              id: slotId,
              date: found.date,
              hour: found.hour,
              available: true,
              booked: true,
              bookedBy: found.clientName,
              bookedEmail: found.clientEmail,
              bookedPhone: found.clientPhone,
            });
          }

          // Send email notification
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              booking: found,
              notificationEmail: "difaziotennis@gmail.com",
            }),
          }).catch(() => {});
        }
      } else {
        setTimeout(() => {
          alert("Booking not found. Redirecting back to booking page.");
          router.push("/book");
        }, 2000);
      }
    }

    loadBooking();
  }, [bookingId, router, paymentStatus]);

  if (!booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-earth-600 mb-4">Loading booking details...</p>
        </div>
      </div>
    );
  }

  const date = new Date(booking.date + "T12:00:00");

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-primary-100 p-8 sm:p-12 max-w-2xl w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-serif text-primary-800 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-earth-600 text-lg">
            Your lesson has been successfully booked.
          </p>
        </div>

        <div className="bg-primary-50 rounded-lg p-6 mb-6 space-y-4">
          <div className="flex items-start gap-4">
            <Calendar className="h-6 w-6 text-primary-700 mt-1" />
            <div>
              <p className="text-sm text-earth-600">Date</p>
              <p className="font-semibold text-primary-800 text-lg">
                {format(date, "EEEE, MMMM d, yyyy")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <Clock className="h-6 w-6 text-primary-700 mt-1" />
            <div>
              <p className="text-sm text-earth-600">Time</p>
              <p className="font-semibold text-primary-800 text-lg">
                {formatTime(booking.hour)}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <DollarSign className="h-6 w-6 text-primary-700 mt-1" />
            <div>
              <p className="text-sm text-earth-600">Amount</p>
              <p className="font-semibold text-primary-800 text-lg">${booking.amount}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-primary-800 mb-2">What&apos;s Next?</h3>
          {booking.paymentStatus === "paid" ? (
            <p className="text-sm text-earth-700 mb-3">
              ✅ <strong>Payment received!</strong> Your lesson is confirmed and paid.
            </p>
          ) : (
            <>
              {booking.clientEmail ? (
                <p className="text-sm text-earth-700 mb-3">
                  You&apos;ll receive a confirmation email at <strong>{booking.clientEmail}</strong> with lesson details.
                </p>
              ) : (
                <p className="text-sm text-earth-700 mb-3">
                  Your lesson has been confirmed. Please complete payment below.
                </p>
              )}
              <p className="text-sm text-earth-700 mb-4">
                Payment is due before the lesson. You can pay now or contact us for alternative payment methods.
              </p>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                type="button"
                aria-label={`Pay ${booking.amount} for lesson`}
              >
                <CreditCard className="h-5 w-5" />
                Pay Now - ${booking.amount}
              </button>
            </>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push("/book")}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            type="button"
            aria-label="Book another lesson"
          >
            Book Another Lesson
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            type="button"
            aria-label="Return to homepage"
          >
            Return Home
          </button>
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && booking && (
        <PaymentModal
          booking={booking}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onPaymentSuccess={async () => {
            if (booking) {
              const updated = { ...booking, paymentStatus: "paid" as const };
              await writeBooking(updated);
              sessionStorage.setItem(`booking_${booking.id}`, JSON.stringify(updated));
              setBooking(updated);
            }
            setShowPaymentModal(false);
          }}
        />
      )}
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-earth-600 mb-4">Loading...</p>
        </div>
      </div>
    }>
      <BookingSuccessContent />
    </Suspense>
  );
}
