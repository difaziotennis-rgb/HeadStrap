"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Calendar, Clock, DollarSign, CreditCard } from "lucide-react";
import { Booking } from "@/lib/types";
import { bookings } from "@/lib/mock-data";
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
    if (bookingId) {
      // Try to get from Map first
      let found = bookings.get(bookingId);
      
      // If not found in Map, try sessionStorage
      if (!found) {
        const stored = sessionStorage.getItem(`booking_${bookingId}`);
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as Booking;
            found = parsed;
            // Also add it back to the Map
            bookings.set(bookingId, parsed);
          } catch (e) {
            console.error("Error parsing stored booking:", e);
          }
        }
      }
      
      if (found) {
        setBooking(found);
        // If payment was successful via Stripe redirect, update payment status and mark slot as booked
        if (paymentStatus === "success" && found.paymentStatus === "pending") {
          // Payment completed via Stripe - update booking and mark slot as booked
          found.paymentStatus = "paid";
          found.status = "confirmed";
          bookings.set(bookingId, found);
          
          // Update in sessionStorage
          if (typeof window !== "undefined") {
            sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(found));
            
            // Mark time slot as booked
            const slotId = `${found.date}-${found.hour}`;
            const slotStorage = sessionStorage.getItem(`slot_${slotId}`);
            if (slotStorage) {
              try {
                const slot = JSON.parse(slotStorage);
                slot.booked = true;
                slot.bookedBy = found.clientName;
                slot.bookedEmail = found.clientEmail;
                slot.bookedPhone = found.clientPhone;
                sessionStorage.setItem(`slot_${slotId}`, JSON.stringify(slot));
              } catch (e) {
                console.error("Error updating slot:", e);
              }
            }
            
            // Send email notification
            fetch("/api/send-email", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                booking: found,
                notificationEmail: "difaziotennis@gmail.com",
              }),
            }).catch(err => console.error("Email error:", err));
          }
          
          console.log("✅ Stripe payment confirmed for booking:", bookingId);
        }
      } else {
        console.error("Booking not found:", bookingId);
        // Show error after a delay
        setTimeout(() => {
          if (!booking) {
            alert("Booking not found. Redirecting back to booking page.");
            router.push("/book");
          }
        }, 2000);
      }
    }
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
          <h3 className="font-semibold text-primary-800 mb-2">What's Next?</h3>
          {booking.paymentStatus === "paid" ? (
            <p className="text-sm text-earth-700 mb-3">
              ✅ <strong>Payment received!</strong> Your lesson is confirmed and paid.
            </p>
          ) : (
            <>
              {booking.clientEmail ? (
                <p className="text-sm text-earth-700 mb-3">
                  You'll receive a confirmation email at <strong>{booking.clientEmail}</strong> with lesson details.
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
          >
            Book Another Lesson
          </button>
          <button
            onClick={() => router.push("/")}
            className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
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
          onPaymentSuccess={() => {
            // Update booking payment status
            if (booking) {
              booking.paymentStatus = "paid";
              bookings.set(booking.id, booking);
              sessionStorage.setItem(`booking_${booking.id}`, JSON.stringify(booking));
            }
            setShowPaymentModal(false);
            // Refresh page to show updated status
            window.location.reload();
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

