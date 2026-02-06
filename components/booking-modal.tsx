"use client";

import { useState } from "react";
import { X, CheckCircle, Mail, Loader2 } from "lucide-react";
import { TimeSlot, Booking } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { format } from "date-fns";

interface BookingModalProps {
  slot: TimeSlot;
  isOpen: boolean;
  onClose: () => void;
  onBookingComplete: () => void;
}

export function BookingModal({ slot, isOpen, onClose, onBookingComplete }: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Email is required for booking confirmation
    if (!formData.email.trim()) {
      setError("Please provide your email address for booking confirmation.");
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create booking request
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const clientName = formData.name.trim() || "Guest";
      const clientEmail = formData.email.trim();
      const clientPhone = formData.phone.trim() || "";
      
      const booking: Booking = {
        id: bookingId,
        timeSlotId: slot.id,
        date: slot.date,
        hour: slot.hour,
        clientName,
        clientEmail,
        clientPhone,
        status: "pending",
        createdAt: new Date().toISOString(),
        paymentStatus: "pending",
        amount: 160,
      };

      // Send booking request to admin
      const response = await fetch("/api/booking-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ booking }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit booking request");
      }

      // Show success state
      setRequestSubmitted(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit booking request. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "" });
    setRequestSubmitted(false);
    setError("");
    onClose();
    if (requestSubmitted) {
      onBookingComplete();
    }
  };

  const date = new Date(slot.date + "T12:00:00");

  // Success state - request submitted
  if (requestSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          {/* Header */}
          <div className="bg-green-600 text-white px-6 py-6 text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-3" />
            <h2 className="text-2xl font-serif font-semibold">Request Submitted!</h2>
          </div>

          {/* Content */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <p className="text-gray-700 mb-4">
                Your lesson request has been sent to Derek DiFazio for review.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-blue-800">Check your email</p>
                    <p className="text-sm text-blue-700">
                      You'll receive a confirmation at <strong>{formData.email}</strong> once your lesson is accepted.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-800 mb-2">Requested Lesson Details</h3>
              <div className="space-y-1 text-sm text-gray-600">
                <p><span className="font-medium">Date:</span> {format(date, "EEEE, MMMM d, yyyy")}</p>
                <p><span className="font-medium">Time:</span> {formatTime(slot.hour)}</p>
                <p><span className="font-medium">Duration:</span> 1 hour</p>
                <p><span className="font-medium">Price:</span> $160</p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-serif text-primary-800">Request a Lesson</h2>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            aria-label="Close booking modal"
            type="button"
          >
            <X className="h-5 w-5 text-primary-700" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          {/* Booking Details */}
          <div className="bg-primary-50 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-earth-600">Date:</span>
                <span className="font-semibold text-primary-800">
                  {format(date, "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-600">Time:</span>
                <span className="font-semibold text-primary-800">
                  {formatTime(slot.hour)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-earth-600">Duration:</span>
                <span className="font-semibold text-primary-800">1 hour</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-primary-200">
                <span className="text-earth-600">Price:</span>
                <span className="font-bold text-lg text-primary-800">$160</span>
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-amber-800">
              <strong>How it works:</strong> Submit your request and you'll receive an email confirmation once Derek accepts your lesson.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-primary-800 mb-2">
                Full Name <span className="text-earth-400 text-xs">(optional)</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="John Doe"
                autoComplete="name"
                aria-required="false"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-800 mb-2">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="john@example.com"
                autoComplete="email"
                aria-required="true"
                required
              />
              <p className="text-xs text-earth-500 mt-1">Required - you'll receive confirmation here</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-primary-800 mb-2">
                Phone Number <span className="text-earth-400 text-xs">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="(845) 555-1234"
                autoComplete="tel"
                aria-required="false"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
                aria-label="Cancel booking"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={isSubmitting}
                aria-label={isSubmitting ? "Submitting request" : "Request lesson"}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  "Request Lesson"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
