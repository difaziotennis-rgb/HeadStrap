"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "@/components/calendar";
import { BookingModal } from "@/components/booking-modal";
import { AdminCalendar } from "@/components/admin-calendar";
import { TimeSlot } from "@/lib/types";
import { initializeMockData } from "@/lib/mock-data";
import { LogOut, Lock } from "lucide-react";

export default function BookPage() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");

  useEffect(() => {
    // Initialize mock data on client side
    if (typeof window !== 'undefined') {
      initializeMockData();
      // Check if already logged in
      const auth = sessionStorage.getItem("adminAuth");
      if (auth === "true") {
        setIsAdminMode(true);
      }
    }
  }, []);

  const handleDateSelect = (date: Date) => {
    console.log("🟢 handleDateSelect called in BookPage with:", date);
    setSelectedDate(date);
    console.log("✅ Selected date state updated");
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    console.log("Time slot selected:", slot);
    if (slot.available && !slot.booked) {
      setSelectedSlot(slot);
      setIsModalOpen(true);
      console.log("Opening booking modal for slot:", slot.id);
    } else {
      console.log("Slot not available or booked:", slot);
    }
  };

  const handleBookingComplete = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setSelectedDate(null);
    // Refresh the page to show updated availability
    window.location.reload();
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError("");

    if (adminUsername === "admin" && adminPassword === "admin") {
      sessionStorage.setItem("adminAuth", "true");
      setIsAdminMode(true);
      setShowAdminLogin(false);
      setAdminUsername("");
      setAdminPassword("");
    } else {
      setAdminError("Invalid credentials");
    }
  };

  const handleAdminLogout = () => {
    sessionStorage.removeItem("adminAuth");
    setIsAdminMode(false);
    setShowAdminLogin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Admin Header (only shown when logged in) */}
      {isAdminMode && (
        <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <Link
                href="/"
                className="text-primary-700 hover:text-primary-800 font-medium text-sm underline"
              >
                Homepage
              </Link>
              <div className="flex items-center gap-4">
                <Link
                  href="/admin/payment-settings"
                  className="text-primary-700 hover:text-primary-800 font-medium text-sm underline"
                >
                  Payment Settings
                </Link>
                <button
                  onClick={handleAdminLogout}
                  className="flex items-center gap-1 text-sm text-primary-700 hover:text-primary-800 font-medium"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Calendar - Client or Admin View */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-4 sm:p-6 lg:p-8 mb-8">
          {isAdminMode ? (
            <AdminCalendar />
          ) : (
            <Calendar
              onDateSelect={handleDateSelect}
              onTimeSlotSelect={handleTimeSlotSelect}
              selectedDate={selectedDate}
            />
          )}
        </div>

        {/* Booking Modal */}
        {isModalOpen && selectedSlot && !isAdminMode && (
          <BookingModal
            slot={selectedSlot}
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onBookingComplete={handleBookingComplete}
          />
        )}
      </main>

      {/* Footer with Admin Login */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-primary-100 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-earth-600 text-sm mb-6">
            <p>Rhinebeck Tennis Club • Rhinebeck, NY</p>
            <p className="mt-2">
              <a href="mailto:difaziotennis@gmail.com" className="text-primary-700 hover:text-primary-800 hover:underline">
                difaziotennis@gmail.com
              </a>
              {" • "}
              <a href="tel:6319015220" className="text-primary-700 hover:text-primary-800 hover:underline">
                631-901-5220
              </a>
            </p>
            <p className="mt-2">© {new Date().getFullYear()} DiFazio Tennis</p>
          </div>

          {/* Admin Login Section */}
          {!isAdminMode && (
            <div className="max-w-md mx-auto mt-8 pt-8 border-t border-primary-200">
              {!showAdminLogin ? (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="flex items-center justify-center gap-2 text-sm text-earth-500 hover:text-primary-700 transition-colors mx-auto"
                >
                  <Lock className="h-4 w-4" />
                  <span>Admin Login</span>
                </button>
              ) : (
                <div className="bg-white rounded-lg border border-primary-200 p-6">
                  <h3 className="text-lg font-serif text-primary-800 mb-4 text-center">
                    Admin Login
                  </h3>
                  <form onSubmit={handleAdminLogin} className="space-y-4">
                    <div>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Username"
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        required
                      />
                    </div>
                    <div>
                      <input
                        type="password"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Password"
                        className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                        required
                      />
                    </div>
                    {adminError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                        {adminError}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminLogin(false);
                          setAdminError("");
                          setAdminUsername("");
                          setAdminPassword("");
                        }}
                        className="flex-1 px-4 py-2 border border-primary-300 text-primary-700 rounded-lg font-medium hover:bg-primary-50 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors text-sm"
                      >
                        Login
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}
