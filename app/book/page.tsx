"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Calendar } from "@/components/calendar";
import { BookingModal } from "@/components/booking-modal";
import { AdminCalendar } from "@/components/admin-calendar";
import { TimeSlot } from "@/lib/types";
import { initializeMockData } from "@/lib/mock-data";
import { LogOut, Lock, Trophy } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BookPage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0); // Force calendar refresh without page reload

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
    setSelectedDate(date);
  };

  const handleTimeSlotSelect = (slot: TimeSlot) => {
    if (slot.available && !slot.booked) {
      setSelectedSlot(slot);
      setIsModalOpen(true);
    }
  };

  const handleBookingComplete = () => {
    setIsModalOpen(false);
    setSelectedSlot(null);
    setSelectedDate(null);
    // Force calendar to refresh by updating a refresh key
    // This avoids full page reload for better UX
    setRefreshKey(prev => prev + 1);
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
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Top Navigation Bar */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push('/club/rhinebeck-tennis-club')}
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />
                Ladder
              </button>
              {isAdminMode && (
                <>
                  <Link
                    href="/admin/dashboard"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/payment-settings"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Payments
                  </Link>
                  <button
                    onClick={handleAdminLogout}
                    className="flex items-center gap-1 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] font-medium transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10" role="main">
        {/* Calendar Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-8 mb-8" aria-label="Booking calendar">
          {isAdminMode ? (
            <AdminCalendar />
          ) : (
            <Calendar
              key={refreshKey}
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

      {/* Footer */}
      <footer className="border-t border-[#e8e5df] mt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="text-center">
            <p className="text-[11px] text-[#b0a99f] tracking-wide">
              DiFazio Tennis · Rhinebeck, NY
            </p>
            <p className="text-[11px] text-[#c4bfb8] mt-1.5">
              <a href="mailto:difaziotennis@gmail.com" className="hover:text-[#8a8477] transition-colors">
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a href="tel:6319015220" className="hover:text-[#8a8477] transition-colors">
                631-901-5220
              </a>
            </p>
          </div>

          {/* Admin Login Section */}
          {!isAdminMode && (
            <div className="max-w-sm mx-auto mt-8 pt-6 border-t border-[#e8e5df]">
              {!showAdminLogin ? (
                <button
                  onClick={() => setShowAdminLogin(true)}
                  className="flex items-center justify-center gap-1.5 text-[11px] text-[#c4bfb8] hover:text-[#8a8477] transition-colors mx-auto"
                  aria-label="Open admin login form"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Admin</span>
                </button>
              ) : (
                <div className="bg-[#faf9f7] rounded-xl border border-[#e8e5df] p-5">
                  <p className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-4 text-center">Admin Login</p>
                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <input
                      type="text"
                      id="admin-username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                      required
                      aria-label="Admin username"
                      autoComplete="username"
                    />
                    <input
                      type="password"
                      id="admin-password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                      required
                      aria-label="Admin password"
                      autoComplete="current-password"
                    />
                    {adminError && (
                      <div className="px-3 py-2 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-lg text-[12px]">
                        {adminError}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAdminLogin(false);
                          setAdminError("");
                          setAdminUsername("");
                          setAdminPassword("");
                        }}
                        className="flex-1 py-2 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#2a2a2a] transition-colors"
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
