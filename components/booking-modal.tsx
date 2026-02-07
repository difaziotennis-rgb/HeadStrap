"use client";

import { useState } from "react";
import { X, CheckCircle, Mail, Loader2 } from "lucide-react";
import { TimeSlot, Booking } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { getLessonRate } from "@/lib/payment-config";
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
        amount: getLessonRate(),
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
        <div className="bg-[#faf9f7] rounded-2xl shadow-2xl max-w-[420px] w-full overflow-hidden">

          {/* Header */}
          <div className="px-8 pt-10 pb-2 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-4">DiFazio Tennis</p>
            <h2 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">Request Received</h2>
          </div>

          {/* Divider */}
          <div className="mx-8 mt-4 mb-0 h-px bg-[#e8e5df]" />

          {/* Details */}
          <div className="px-8 pt-5 pb-1">
            <div className="flex justify-between py-[10px] border-b border-[#f0ede8]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Date</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{format(date, "EEEE, MMMM d")}</span>
            </div>
            <div className="flex justify-between py-[10px] border-b border-[#f0ede8]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Time</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">{formatTime(slot.hour)}</span>
            </div>
            <div className="flex justify-between py-[10px] border-b border-[#f0ede8]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Duration</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">1 hour</span>
            </div>
            <div className="flex justify-between py-[10px]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Lesson fee</span>
              <span className="text-[13px] font-medium text-[#1a1a1a]">${getLessonRate()}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-8 h-px bg-[#e8e5df]" />

          {/* Note */}
          <div className="px-8 py-5">
            <p className="text-[13px] text-[#6b665e] leading-relaxed text-center">
              A confirmation email will be sent to <span className="text-[#1a1a1a] font-medium">{formData.email}</span> once your lesson is accepted.
            </p>
          </div>

          {/* Button */}
          <div className="px-8 pb-8">
            <button
              onClick={handleClose}
              className="w-full py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors"
            >
              Done
            </button>
          </div>

          {/* Footer */}
          <div className="py-4 border-t border-[#e8e5df] text-center">
            <p className="text-[10px] text-[#c4bfb8] tracking-wide">Rhinebeck, NY</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#faf9f7] rounded-2xl shadow-2xl max-w-[400px] w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="sticky top-0 bg-[#faf9f7] z-10 rounded-t-2xl">
          <div className="px-6 pt-6 pb-1.5 flex items-start justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-2">DiFazio Tennis</p>
              <h2 className="text-[20px] font-light tracking-tight text-[#1a1a1a]">Request a Lesson</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-[#e8e5df] rounded-lg transition-colors"
              aria-label="Close booking modal"
              type="button"
            >
              <X className="h-4 w-4 text-[#a39e95]" />
            </button>
          </div>
          <div className="mx-6 h-px bg-[#e8e5df]" />
        </div>

        {/* Lesson Details */}
        <div className="px-6 pt-3">
          <div className="flex justify-between py-[7px] border-b border-[#f0ede8]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Date</span>
            <span className="text-[13px] font-medium text-[#1a1a1a]">{format(date, "EEEE, MMMM d")}</span>
          </div>
          <div className="flex justify-between py-[7px] border-b border-[#f0ede8]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Time</span>
            <span className="text-[13px] font-medium text-[#1a1a1a]">{formatTime(slot.hour)}</span>
          </div>
          <div className="flex justify-between py-[7px] border-b border-[#f0ede8]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Duration</span>
            <span className="text-[13px] font-medium text-[#1a1a1a]">1 hour</span>
          </div>
          <div className="flex justify-between py-[7px]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Lesson fee</span>
            <span className="text-[13px] font-medium text-[#1a1a1a]">${getLessonRate()}</span>
          </div>
        </div>

        <div className="mx-6 h-px bg-[#e8e5df]" />

        {/* How it works */}
        <div className="px-6 py-3">
          <p className="text-[11px] text-[#8a8477] leading-relaxed text-center">
            A confirmation email will be sent once your lesson is accepted.
          </p>
        </div>

        <div className="mx-6 h-px bg-[#e8e5df]" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 pt-4 pb-6">
          <div className="space-y-3">
            <div>
              <label htmlFor="name" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                Full Name <span className="normal-case tracking-normal text-[#c4bfb8]">(optional)</span>
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="John Doe"
                autoComplete="name"
                aria-required="false"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                Email Address <span className="text-[#1a1a1a]">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="john@example.com"
                autoComplete="email"
                aria-required="true"
                required
              />
              <p className="text-[10px] text-[#b0a99f] mt-1">Confirmation will be sent here</p>
            </div>

            <div>
              <label htmlFor="phone" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                Phone Number <span className="normal-case tracking-normal text-[#c4bfb8]">(optional)</span>
              </label>
              <input
                type="tel"
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="(845) 555-1234"
                autoComplete="tel"
                aria-required="false"
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 px-3 py-2.5 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-lg text-[12px]">
              {error}
            </div>
          )}

          <div className="flex gap-2.5 mt-5">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-2.5 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[13px] font-medium hover:bg-[#f0ede8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting}
              aria-label="Cancel booking"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isSubmitting}
              aria-label={isSubmitting ? "Submitting request" : "Request lesson"}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                "Request Lesson"
              )}
            </button>
          </div>
        </form>

        {/* Footer */}
        <div className="py-3 border-t border-[#e8e5df] text-center">
          <p className="text-[10px] text-[#c4bfb8] tracking-wide">Rhinebeck, NY</p>
        </div>
      </div>
    </div>
  );
}
