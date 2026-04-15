"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard, CheckCircle, Shield, Loader2, Zap } from "lucide-react";

function BecomeAMemberContent() {
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Check for success/error from Stripe callback
  const success = searchParams.get("success") === "true";
  const memberCode = searchParams.get("code");
  const memberName = searchParams.get("name");
  const cancelled = searchParams.get("cancelled") === "true";
  const callbackError = searchParams.get("error");

  useEffect(() => {
    if (cancelled) {
      setError("Card setup was cancelled. You can try again whenever you're ready.");
    } else if (callbackError) {
      setError("Something went wrong. Please try again or contact us.");
    }
  }, [cancelled, callbackError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim() || !formData.email.trim()) {
      setError("Please provide your name and email.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please provide a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/create-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to start setup");
      }

      // Redirect to Stripe Checkout
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  };

  // Success state
  if (success && memberCode) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
            <div className="px-8 pt-10 pb-2 text-center">
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-4">
                DiFazio Tennis
              </p>
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-[#e8f5e1] flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-[#2d5016]" />
                </div>
              </div>
              <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a]">
                Welcome{memberName ? `, ${decodeURIComponent(memberName)}` : ""}!
              </h1>
            </div>

            <div className="px-8 pt-4 pb-2 text-center">
              <p className="text-[13px] text-[#6b665e] leading-relaxed mb-4">
                Your card has been saved. Here's your member code:
              </p>

              <div className="py-5 px-4 bg-[#f7f7f5] rounded-xl border border-[#e8e5df] mb-4">
                <p className="text-[10px] tracking-[0.15em] uppercase text-[#a39e95] mb-2">
                  Member Code
                </p>
                <p className="text-[28px] font-bold tracking-[0.08em] text-[#1a1a1a] font-mono">
                  {memberCode}
                </p>
              </div>

              <p className="text-[12px] text-[#8a8477] leading-relaxed">
                Enter this code when booking a lesson and your card will be charged automatically after your session. We also emailed this to you.
              </p>
            </div>

            <div className="px-8 py-6">
              <a
                href="/book"
                className="block w-full py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors text-center"
              >
                Book a Lesson
              </a>
            </div>

            <div className="py-3 border-t border-[#e8e5df] text-center">
              <p className="text-[10px] text-[#c4bfb8] tracking-wide">Rhinebeck, NY</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-10 pb-2 text-center">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] mb-4">
              DiFazio Tennis
            </p>
            <h1 className="text-[22px] font-light tracking-tight text-[#1a1a1a] mb-2">
              Become a Member
            </h1>
            <p className="text-[13px] text-[#8a8477] leading-relaxed">
              Save your card once, skip payment every time.
            </p>
          </div>

          <div className="mx-8 mt-4 h-px bg-[#e8e5df]" />

          {/* Benefits */}
          <div className="px-8 py-5">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Zap className="h-4 w-4 text-[#2d5016] mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-[#4a4a4a]">
                  Get a personal member code for instant booking
                </p>
              </div>
              <div className="flex items-start gap-3">
                <CreditCard className="h-4 w-4 text-[#2d5016] mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-[#4a4a4a]">
                  Card charged automatically after each lesson
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="h-4 w-4 text-[#2d5016] mt-0.5 flex-shrink-0" />
                <p className="text-[13px] text-[#4a4a4a]">
                  Card info stored securely by Stripe — never on our servers
                </p>
              </div>
            </div>
          </div>

          <div className="mx-8 h-px bg-[#e8e5df]" />

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 pt-5 pb-6">
            <div className="space-y-3">
              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                  Full Name <span className="text-[#1a1a1a]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                  Email Address <span className="text-[#1a1a1a]">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] tracking-[0.12em] uppercase text-[#a39e95] mb-1.5">
                  Phone <span className="normal-case tracking-normal text-[#c4bfb8]">(optional)</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                  placeholder="(845) 555-1234"
                />
              </div>
            </div>

            {error && (
              <div className="mt-3 px-3 py-2.5 bg-[#fef2f2] border border-[#fecaca] text-[#991b1b] rounded-lg text-[12px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-5 py-3 bg-[#1a1a1a] text-white rounded-lg text-[13px] font-medium tracking-wide hover:bg-[#2a2a2a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Setting up...</span>
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  <span>Save Card & Get Member Code</span>
                </>
              )}
            </button>

            <p className="text-[10px] text-[#b0a99f] text-center mt-3">
              You'll be redirected to Stripe to securely save your card. No charge today.
            </p>
          </form>

          {/* Footer */}
          <div className="py-3 border-t border-[#e8e5df] text-center">
            <p className="text-[10px] text-[#c4bfb8] tracking-wide">
              DiFazio Tennis · Rhinebeck, NY
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BecomeAMemberPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#8a8477]" />
        </div>
      }
    >
      <BecomeAMemberContent />
    </Suspense>
  );
}
