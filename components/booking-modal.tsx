"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { TimeSlot, Booking } from "@/lib/types";
import { formatTime } from "@/lib/utils";
import { format } from "date-fns";
import { timeSlots, bookings } from "@/lib/mock-data";

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

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // No validation required - all fields are optional
    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Create booking (all fields optional)
      const bookingId = `booking-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const clientName = formData.name.trim() || "Guest";
      const clientEmail = formData.email.trim() || "";
      const clientPhone = formData.phone.trim() || "";
      
      const booking: Booking = {
        id: bookingId,
        timeSlotId: slot.id,
        date: slot.date,
        hour: slot.hour,
        clientName,
        clientEmail,
        clientPhone,
        status: "confirmed",
        createdAt: new Date().toISOString(),
        paymentStatus: "pending",
        amount: 160,
      };

      // Save booking to Map
      bookings.set(bookingId, booking);
      
      // Also save to sessionStorage for persistence across page navigation
      sessionStorage.setItem(`booking_${bookingId}`, JSON.stringify(booking));
      console.log("✅ Booking created:", bookingId, booking);

      // Update time slot - mark as booked
      const updatedSlot: TimeSlot = {
        ...slot,
        booked: true,
        bookedBy: clientName,
        bookedEmail: clientEmail,
        bookedPhone: clientPhone,
      };
      timeSlots.set(slot.id, updatedSlot);
      
      // Save updated slot to sessionStorage
      sessionStorage.setItem(`slot_${slot.id}`, JSON.stringify(updatedSlot));
      console.log("✅ Time slot updated:", slot.id, updatedSlot);

      // Reset form
      setFormData({ name: "", email: "", phone: "" });
      
      // Redirect to success page
      window.location.href = `/booking-success?id=${bookingId}`;
    } catch (err) {
      console.error("❌ Booking error:", err);
      setError("Failed to create booking. Please try again.");
      setIsSubmitting(false);
    }
  };

  const date = new Date(slot.date + "T12:00:00");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-primary-200 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="text-2xl font-serif text-primary-800">Book Your Lesson</h2>
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
                <span className="text-earth-600">Total:</span>
                <span className="font-bold text-lg text-primary-800">$160</span>
              </div>
            </div>
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
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-primary-800 mb-2">
                Email Address <span className="text-earth-400 text-xs">(optional)</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                placeholder="john@example.com"
              />
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
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
              <p className="font-semibold mb-1">Payment Information</p>
              <p>Payment will be processed after booking confirmation. You'll receive payment instructions via email.</p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Booking..." : "Confirm Booking"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

