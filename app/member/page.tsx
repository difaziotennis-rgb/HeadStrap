"use client";

import { useState } from "react";
import { Loader2, LogOut, Calendar, CreditCard, Clock, MapPin, DollarSign, ArrowRight } from "lucide-react";
import Link from "next/link";

interface UpcomingLesson {
  id: string;
  date: string;
  hour: number;
  amount: number;
  status: string;
  payment_status: string;
}

interface DashboardData {
  member: {
    name: string;
    email: string;
    phone: string;
    memberCode: string;
    joinedAt: string;
  };
  upcomingLessons: UpcomingLesson[];
  payments: {
    totalPaid: number;
    totalLessons: number;
    card: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null;
  };
}

function formatTime(hour: number): string {
  const wholeHour = Math.floor(hour);
  const minutes = Math.round((hour - wholeHour) * 60);
  const h = wholeHour > 12 ? wholeHour - 12 : wholeHour === 0 ? 12 : wholeHour;
  return `${h}:${minutes.toString().padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatFullDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export default function MemberPage() {
  const [memberCode, setMemberCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [updatingCard, setUpdatingCard] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (memberCode.length < 4) return;

    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/member-dashboard", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberCode: memberCode.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Invalid member code");
        setIsLoading(false);
        return;
      }

      setDashboard(data);
      sessionStorage.setItem("memberCode", memberCode.trim());
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setDashboard(null);
    setMemberCode("");
    sessionStorage.removeItem("memberCode");
  };

  const handleUpdateCard = async () => {
    setUpdatingCard(true);
    try {
      const code = memberCode || sessionStorage.getItem("memberCode");
      const res = await fetch("/api/update-member-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberCode: code }),
      });
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setUpdatingCard(false);
      }
    } catch {
      setUpdatingCard(false);
    }
  };

  // Login screen
  if (!dashboard) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
        <div className="max-w-sm w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-8 pt-10 pb-2 text-center">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-4">
                DiFazio Tennis
              </p>
              <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a] mb-2">
                Member Login
              </h1>
              <p className="text-[13px] text-[#8a8477]">
                Enter your 4-digit member code
              </p>
            </div>

            <form onSubmit={handleLogin} className="px-8 pt-6 pb-8">
              <input
                type="text"
                inputMode="numeric"
                value={memberCode}
                onChange={(e) => setMemberCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="w-full px-4 py-3 bg-[#faf9f7] border border-[#e8e5df] rounded-xl text-center text-[24px] font-mono tracking-[0.3em] text-[#1a1a1a] placeholder:text-[#d4d0ca] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                placeholder="• • • •"
                maxLength={4}
                autoFocus
              />

              {error && (
                <p className="text-[12px] text-[#991b1b] text-center mt-3">{error}</p>
              )}

              <button
                type="submit"
                disabled={memberCode.length < 4 || isLoading}
                className="w-full mt-5 py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Log In"
                )}
              </button>

              <div className="mt-4 text-center">
                <Link
                  href="/become-a-member"
                  className="text-[11px] text-[#b0a99f] hover:text-[#8a8477] transition-colors"
                >
                  Don't have a code? Become a member
                </Link>
              </div>
            </form>

            <div className="py-3 border-t border-[#e8e5df] text-center">
              <p className="text-[10px] text-[#c4bfb8] tracking-wide">Rhinebeck, NY</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Dashboard
  const { member, upcomingLessons, payments } = dashboard;

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <Calendar className="h-3.5 w-3.5" />
                Book
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] font-medium transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-1">
            Welcome back, {member.name.split(" ")[0]}
          </h1>
          <p className="text-[12px] text-[#8a8477]">
            Member {member.memberCode} · {member.email}
          </p>
        </div>

        {/* Upcoming Lessons */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-3">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5" />
                Upcoming Lessons
              </h2>
            </div>

            {upcomingLessons.length > 0 ? (
              <div className="divide-y divide-[#f0ede8]">
                {upcomingLessons.map((lesson) => (
                  <div key={lesson.id} className="px-5 sm:px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[14px] font-medium text-[#1a1a1a]">
                          {formatFullDate(lesson.date)}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-[12px] text-[#8a8477]">
                            <Clock className="h-3 w-3" />
                            {formatTime(lesson.hour)}
                          </span>
                          <span className="flex items-center gap-1 text-[12px] text-[#8a8477]">
                            <MapPin className="h-3 w-3" />
                            Rhinebeck Tennis Club
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[14px] font-medium text-[#1a1a1a]">${lesson.amount}</p>
                        <p className={`text-[10px] uppercase tracking-wider font-medium ${
                          lesson.payment_status === "paid" ? "text-[#2d5016]" : "text-[#8a8477]"
                        }`}>
                          {lesson.payment_status === "paid" ? "Paid" : "Auto-pay"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-5 sm:px-6 pb-6 pt-2">
                <p className="text-[13px] text-[#8a8477] mb-4">No upcoming lessons scheduled.</p>
                <Link
                  href="/book"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#2a2a2a] transition-colors"
                >
                  Book a Lesson
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-3">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium flex items-center gap-2">
                <CreditCard className="h-3.5 w-3.5" />
                Payment
              </h2>
            </div>

            <div className="px-5 sm:px-6 pb-5">
              <div className="space-y-0 divide-y divide-[#f0ede8]">
                {/* Card on file */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[12px] text-[#8a8477]">Card on file</span>
                  {payments.card ? (
                    <span className="text-[13px] font-medium text-[#1a1a1a]">
                      {capitalizeFirst(payments.card.brand)} •••• {payments.card.last4}
                      <span className="text-[11px] text-[#b0a99f] ml-2">
                        {payments.card.expMonth}/{payments.card.expYear}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[13px] text-[#c4bfb8] italic">No card on file</span>
                  )}
                </div>

                {/* Member since */}
                <div className="flex items-center justify-between py-3">
                  <span className="text-[12px] text-[#8a8477]">Member since</span>
                  <span className="text-[13px] font-medium text-[#1a1a1a]">
                    {new Date(member.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                  </span>
                </div>
              </div>

              {/* Update card button */}
              <div className="mt-4 pt-3 border-t border-[#f0ede8]">
                <button
                  onClick={handleUpdateCard}
                  disabled={updatingCard}
                  className="text-[11px] text-[#8a8477] hover:text-[#1a1a1a] transition-colors disabled:opacity-50"
                >
                  {updatingCard ? "Redirecting to Stripe..." : "Update card on file →"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Events */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-5 sm:px-6 pt-5 pb-3">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">
                Events
              </h2>
            </div>
            <div className="px-5 sm:px-6 pb-5">
              <div className="border border-[#e8e5df] rounded-xl p-4">
                <p className="text-[14px] font-medium text-[#1a1a1a]">
                  Memorial Day Mixed Doubles
                </p>
                <p className="text-[12px] text-[#b0a99f] mt-1">
                  Details coming soon
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Clinics placeholder */}
        <div className="mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-5 sm:px-6 py-5">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium mb-3">
                Clinics
              </h2>
              <p className="text-[13px] text-[#b0a99f]">
                Coming soon — your clinic registrations will appear here.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#e8e5df]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 text-center">
          <p className="text-[10px] text-[#c4bfb8] tracking-wide">
            DiFazio Tennis · Rhinebeck, NY
          </p>
        </div>
      </footer>
    </div>
  );
}
