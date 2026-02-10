"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Calendar } from "@/components/calendar";
import { BookingModal } from "@/components/booking-modal";
import { AdminCalendar } from "@/components/admin-calendar";
import { AdminDashboard } from "@/components/admin-dashboard";
import { AdminRecurring } from "@/components/admin-recurring";
import { TimeSlot } from "@/lib/types";
import { migrateFromLocalStorage, readSlotsForDate } from "@/lib/booking-data";
import { LogOut, Lock, Trophy, LayoutDashboard, CalendarDays, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminTab = "dashboard" | "calendar" | "recurring";

function BookPageContent() {
  const searchParams = useSearchParams();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminTab, setAdminTab] = useState<AdminTab>("dashboard");
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const adminLoginRef = useRef<HTMLDivElement>(null);
  const hasHandledDeepLink = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Migrate any existing localStorage data to Supabase (one-time)
      migrateFromLocalStorage();
      const auth = sessionStorage.getItem("adminAuth");
      if (auth === "true") {
        setIsAdminMode(true);
      }
    }
  }, []);

  // Handle deep link from email (e.g. /book?date=2026-02-11&hour=10)
  useEffect(() => {
    if (hasHandledDeepLink.current) return;
    const dateParam = searchParams.get("date");
    const hourParam = searchParams.get("hour");
    if (dateParam && hourParam) {
      hasHandledDeepLink.current = true;
      const hour = parseFloat(hourParam);
      const date = new Date(dateParam + "T12:00:00");
      setSelectedDate(date);

      // Fetch the slot for this date/hour and open the booking modal
      readSlotsForDate(dateParam).then((slots) => {
        const slotId = `${dateParam}-${hour}`;
        const slot = slots[slotId];
        if (slot && slot.available && !slot.booked) {
          setSelectedSlot(slot);
          setIsModalOpen(true);
        }
      });
    }
  }, [searchParams]);

  const handleDateSelect = (date: Date) => setSelectedDate(date);

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
    setRefreshKey((prev) => prev + 1);
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
              <Link href="/book" className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] hover:text-[#8a8477] transition-colors">
                DiFazio Tennis
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {!isAdminMode && (
                <>
                  <Link
                    href="/bio"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Bio
                  </Link>
                  <Link
                    href="/events"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Events
                  </Link>
                  <Link
                    href="/ladder"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Ladder
                  </Link>
                </>
              )}
              {isAdminMode && (
                <>
                  <Link
                    href="/admin/payment-settings"
                    className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
                  >
                    Settings
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8" role="main">
        {/* Admin Tab Switcher */}
        {isAdminMode && (
          <div className="flex items-center gap-1 mb-5 bg-[#f0ede8] rounded-xl p-1 max-w-md">
            <button
              onClick={() => setAdminTab("dashboard")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all",
                adminTab === "dashboard"
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-[#7a756d] hover:text-[#1a1a1a]"
              )}
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Schedule
            </button>
            <button
              onClick={() => setAdminTab("calendar")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all",
                adminTab === "calendar"
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-[#7a756d] hover:text-[#1a1a1a]"
              )}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              Availability
            </button>
            <button
              onClick={() => setAdminTab("recurring")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-medium transition-all",
                adminTab === "recurring"
                  ? "bg-white text-[#1a1a1a] shadow-sm"
                  : "text-[#7a756d] hover:text-[#1a1a1a]"
              )}
            >
              <Repeat className="h-3.5 w-3.5" />
              Recurring
            </button>
          </div>
        )}

        {/* Content Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-8 mb-8">
          {isAdminMode ? (
            adminTab === "dashboard" ? (
              <AdminDashboard />
            ) : adminTab === "recurring" ? (
              <AdminRecurring />
            ) : (
              <AdminCalendar />
            )
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
          {/* Member Login Link */}
          {!isAdminMode && (
            <div className="mb-4 text-center">
              <Link
                href="/member"
                className="text-[11px] text-[#c4bfb8] hover:text-[#8a8477] transition-colors"
              >
                Member Login
              </Link>
            </div>
          )}

          <div className="text-center">
            <p className="text-[11px] text-[#b0a99f] tracking-wide">
              DiFazio Tennis · Rhinebeck, NY
            </p>
            <p className="text-[11px] text-[#c4bfb8] mt-1.5">
              <a
                href="mailto:difaziotennis@gmail.com"
                className="hover:text-[#8a8477] transition-colors"
              >
                difaziotennis@gmail.com
              </a>
              {" · "}
              <a
                href="tel:6319015220"
                className="hover:text-[#8a8477] transition-colors"
              >
                631-901-5220
              </a>
            </p>
          </div>

          {/* Admin Login Section */}
          {!isAdminMode && (
            <div className="max-w-sm mx-auto mt-8 pt-6 border-t border-[#e8e5df]">
              {!showAdminLogin ? (
                <button
                  onClick={() => {
                    setShowAdminLogin(true);
                    setTimeout(() => {
                      adminLoginRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }, 100);
                  }}
                  className="flex items-center justify-center gap-1.5 text-[11px] text-[#c4bfb8] hover:text-[#8a8477] transition-colors mx-auto"
                  aria-label="Open admin login form"
                >
                  <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Admin</span>
                </button>
              ) : (
                <div ref={adminLoginRef} className="bg-[#faf9f7] rounded-xl border border-[#e8e5df] p-5">
                  <p className="text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-4 text-center">
                    Admin Login
                  </p>
                  <form onSubmit={handleAdminLogin} className="space-y-3">
                    <input
                      type="text"
                      id="admin-username"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      placeholder="Username"
                      className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
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
                      className="w-full px-3 py-2 bg-white border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
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

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <p className="text-[13px] text-[#7a756d]">Loading...</p>
      </div>
    }>
      <BookPageContent />
    </Suspense>
  );
}
