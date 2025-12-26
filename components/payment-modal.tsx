"use client";

import { useState } from "react";
import { X, CreditCard, Wallet, Smartphone } from "lucide-react";
import { Booking } from "@/lib/types";
import { PayPalPersonalPayment } from "@/lib/payments/paypal-personal";
import { StripePaymentButton } from "@/lib/payments/stripe";
import { VenmoPayment } from "@/lib/payments/venmo";

interface PaymentModalProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (isStripe?: boolean) => void;
}

export function PaymentModal({ booking, isOpen, onClose, onPaymentSuccess }: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<"paypal" | "stripe" | "venmo" | null>(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handlePaymentSuccess = async (paymentId?: string) => {
    try {
      // Update booking with payment info
      // In production, this would call your API
      console.log("Payment successful:", paymentId || "manual confirmation");
      onPaymentSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to process payment");
    }
  };

  const handlePaymentError = (errorMessage: string) => {
    setError(errorMessage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-serif text-primary-800">Complete Payment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5 text-primary-700" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Booking Summary */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-earth-600">Lesson:</span>
                <span className="font-semibold text-primary-800">
                  {new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-600">Time:</span>
                <span className="font-semibold text-primary-800">
                  {booking.hour}:00 {booking.hour >= 12 ? "PM" : "AM"}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary-200">
                <span className="text-earth-600">Total:</span>
                <span className="font-bold text-lg text-primary-800">${booking.amount}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          {!selectedMethod ? (
            <div className="space-y-3">
              <h3 className="font-semibold text-primary-800 mb-4">Choose Payment Method</h3>
              
              <button
                onClick={() => setSelectedMethod("venmo")}
                className="w-full p-5 border-2 border-[#3D95CE]/30 rounded-xl hover:border-[#3D95CE] hover:bg-[#3D95CE]/5 transition-all flex items-center gap-4 shadow-sm hover:shadow-md"
              >
                <div className="p-2 bg-[#3D95CE]/10 rounded-lg">
                  <Smartphone className="h-7 w-7 text-[#3D95CE]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-primary-800 text-lg">Venmo</div>
                  <div className="text-sm text-earth-600">Fast & secure mobile payment</div>
                </div>
                <div className="text-primary-400">→</div>
              </button>

              <button
                onClick={() => setSelectedMethod("paypal")}
                className="w-full p-5 border-2 border-[#0070BA]/30 rounded-xl hover:border-[#0070BA] hover:bg-[#0070BA]/5 transition-all flex items-center gap-4 shadow-sm hover:shadow-md"
              >
                <div className="p-2 bg-[#0070BA]/10 rounded-lg">
                  <Wallet className="h-7 w-7 text-[#0070BA]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-primary-800 text-lg">PayPal</div>
                  <div className="text-sm text-earth-600">Pay with PayPal or card</div>
                </div>
                <div className="text-primary-400">→</div>
              </button>

              <button
                onClick={() => setSelectedMethod("stripe")}
                className="w-full p-5 border-2 border-[#635BFF]/30 rounded-xl hover:border-[#635BFF] hover:bg-[#635BFF]/5 transition-all flex items-center gap-4 shadow-sm hover:shadow-md"
              >
                <div className="p-2 bg-[#635BFF]/10 rounded-lg">
                  <CreditCard className="h-7 w-7 text-[#635BFF]" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-bold text-primary-800 text-lg">Credit or Debit Card</div>
                  <div className="text-sm text-earth-600">Visa, Mastercard, Amex, Discover</div>
                </div>
                <div className="text-primary-400">→</div>
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={() => {
                  setSelectedMethod(null);
                  setError("");
                }}
                className="text-sm text-primary-700 hover:text-primary-800 mb-4"
              >
                ← Back to payment methods
              </button>

              {selectedMethod === "venmo" && (
                <div>
                  <h3 className="font-semibold text-primary-800 mb-4">Pay with Venmo</h3>
                  <VenmoPayment
                    booking={booking}
                    onSuccess={() => {
                      onPaymentSuccess();
                      onClose();
                    }}
                  />
                </div>
              )}

              {selectedMethod === "paypal" && (
                <div>
                  <h3 className="font-semibold text-primary-800 mb-4">Pay with PayPal</h3>
                  {/* VERSION 2.0: Using PayPalPersonalPayment - NO API keys required */}
                  <PayPalPersonalPayment
                    booking={booking}
                    onSuccess={handlePaymentSuccess}
                  />
                </div>
              )}

              {selectedMethod === "stripe" && (
                <div className="w-full">
                  <h3 className="font-semibold text-primary-800 mb-4">Pay with Card</h3>
                  <StripePaymentButton
                    booking={booking}
                    onSuccess={() => {
                      onPaymentSuccess();
                    }}
                    onError={handlePaymentError}
                  />
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-sm text-earth-600 hover:text-primary-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


