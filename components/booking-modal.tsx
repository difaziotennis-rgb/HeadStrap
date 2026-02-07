"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
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

    if (!formData.email.trim()) {
      setError("Please provide your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const booking: Booking = {
        id: bookingId,
        timeSlotId: slot.id,
        date: slot.date,
        hour: slot.hour,
        clientName: formData.name.trim() || "Guest",
        clientEmail: formData.email.trim(),
        clientPhone: formData.phone.trim() || "",
        status: "pending",
        createdAt: new Date().toISOString(),
        paymentStatus: "pending",
        amount: getLessonRate(),
      };

      const response = await fetch("/api/booking-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit request");

      setRequestSubmitted(true);
      setIsSubmitting(false);
    } catch (err: any) {
      setError(err.message || "Failed to submit request. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: "", email: "", phone: "" });
    setRequestSubmitted(false);
    setError("");
    onClose();
    if (requestSubmitted) onBookingComplete();
  };

  const date = new Date(slot.date + "T12:00:00");

  // ── Success state ──────────────────────────────────────────
  if (requestSubmitted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <div className="bg-[#faf9f7] rounded-2xl shadow-2xl max-w-[360px] w-full">
          <div className="px-6 pt-7 pb-1 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-3">DiFazio Tennis</p>
            <h2 className="text-[20px] font-light tracking-tight text-[#1a1a1a]">Request Received</h2>
          </div>

          <div className="mx-6 mt-3 h-px bg-[#e8e5df]" />

          <div className="px-6 py-3 space-y-0">
            <div className="flex justify-between py-2 border-b border-[#f0ede8]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Date</span>
              <span className="text-[12px] font-medium text-[#1a1a1a]">{format(date, "EEE, MMM d")}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-[#f0ede8]">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Time</span>
              <span className="text-[12px] font-medium text-[#1a1a1a]">{formatTime(slot.hour)}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Fee</span>
              <span className="text-[12px] font-medium text-[#1a1a1a]">${getLessonRate()}</span>
            </div>
          </div>

          <div className="mx-6 h-px bg-[#e8e5df]" />

          <div className="px-6 py-3">
            <p className="text-[12px] text-[#6b665e] leading-relaxed text-center">
              Confirmation will be sent to <span className="text-[#1a1a1a] font-medium">{formData.email}</span>
            </p>
          </div>

          <div className="px-6 pb-6">
            <button
              onClick={handleClose}
              className="w-full py-2.5 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium hover:bg-[#2a2a2a] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Request form ───────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-[#faf9f7] rounded-2xl shadow-2xl max-w-[360px] w-full max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="px-5 pt-5 pb-1 flex items-start justify-between">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-1.5">DiFazio Tennis</p>
            <h2 className="text-[18px] font-light tracking-tight text-[#1a1a1a]">Request a Lesson</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-[#e8e5df] rounded-lg transition-colors"
            aria-label="Close" type="button"
          >
            <X className="h-4 w-4 text-[#a39e95]" />
          </button>
        </div>

        <div className="mx-5 h-px bg-[#e8e5df]" />

        {/* Lesson Details */}
        <div className="px-5 py-2 space-y-0">
          <div className="flex justify-between py-1.5 border-b border-[#f0ede8]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Date</span>
            <span className="text-[12px] font-medium text-[#1a1a1a]">{format(date, "EEE, MMM d")}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-[#f0ede8]">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Time</span>
            <span className="text-[12px] font-medium text-[#1a1a1a]">{formatTime(slot.hour)}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95]">Fee</span>
            <span className="text-[12px] font-medium text-[#1a1a1a]">${getLessonRate()}</span>
          </div>
        </div>

        <div className="mx-5 h-px bg-[#e8e5df]" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-3 pb-5">
          <div className="space-y-2.5">
            <div>
              <label htmlFor="name" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                Name <span className="normal-case tracking-normal text-[#c4bfb8]">(optional)</span>
              </label>
              <input
                type="text" id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="John Doe"
                autoComplete="name"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                Email <span className="text-[#1a1a1a]">*</span>
              </label>
              <input
                type="email" id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="john@example.com"
                autoComplete="email"
                required
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1">
                Phone <span className="normal-case tracking-normal text-[#c4bfb8]">(optional)</span>
              </label>
              <input
                type="tel" id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-1.5 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="(845) 555-1234"
                autoComplete="tel"
              />
            </div>
          </div>

          {error && (
            <div className="mt-2 px-3 py-2 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-lg text-[11px]">
              {error}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            <button
              type="button" onClick={handleClose}
              className="flex-1 py-2 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Submitting…
                </>
              ) : (
                "Request Lesson"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
