"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, CalendarDays, LogOut, Trophy } from "lucide-react";
import { PAYMENT_CONFIG, getLessonRate } from "@/lib/payment-config";

interface PaymentSettings {
  paypalEmail: string;
  paypalMeUsername: string;
  venmoHandle: string;
  lessonRate: string;
  notificationEmail: string;
  notes: string;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [formData, setFormData] = useState<PaymentSettings>({
    paypalEmail: "",
    paypalMeUsername: "",
    venmoHandle: "",
    lessonRate: String(PAYMENT_CONFIG.lessonRate),
    notificationEmail: "",
    notes: "",
  });

  useEffect(() => {
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/book");
    } else {
      setIsAuthenticated(true);
      loadPaymentSettings();
    }
  }, [router]);

  const loadPaymentSettings = () => {
    // Start with hardcoded config as defaults
    const defaults: PaymentSettings = {
      paypalEmail: PAYMENT_CONFIG.paypalEmail || "",
      paypalMeUsername: PAYMENT_CONFIG.paypalMeUsername || "",
      venmoHandle: PAYMENT_CONFIG.venmoHandle || "",
      lessonRate: String(PAYMENT_CONFIG.lessonRate),
      notificationEmail: PAYMENT_CONFIG.notificationEmail || "",
      notes: "",
    };

    // Override with any localStorage values (if admin has saved custom settings)
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("paymentSettings");
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setFormData({
            ...defaults,
            ...settings,
          });
          return;
        } catch (e) {
          console.error("Error loading payment settings:", e);
        }
      }
    }

    setFormData(defaults);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      localStorage.setItem("paymentSettings", JSON.stringify(formData));
      setSaveMessage("Settings saved.");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Error saving settings. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof PaymentSettings, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogout = () => {
    sessionStorage.removeItem("adminAuth");
    router.push("/book");
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#f7f7f5] flex items-center justify-center">
        <div className="text-[13px] text-[#7a756d]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f7f5]">
      {/* Header */}
      <header className="bg-[#faf9f7] border-b border-[#e8e5df] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f]">DiFazio Tennis</p>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <CalendarDays className="h-3.5 w-3.5" />
                Calendar
              </Link>
              <Link
                href="/ladder"
                className="flex items-center gap-1.5 text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                <Trophy className="h-3.5 w-3.5" />
                Ladder
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

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        {/* Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[#1a1a1a] mb-1">
            Payment Settings
          </h1>
          <p className="text-[12px] text-[#7a756d]">
            These are the payment methods included in client confirmation emails.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Venmo */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Venmo</h2>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="venmoHandle" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                Venmo Handle / Phone Number
              </label>
              <input
                type="text"
                id="venmoHandle"
                value={formData.venmoHandle}
                onChange={(e) => handleChange("venmoHandle", e.target.value)}
                placeholder="@your-venmo or phone number"
                className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
              />
              <p className="text-[11px] text-[#b0a99f]">
                Clients will see a "Pay with Venmo" link in their confirmation email
              </p>
            </div>
          </div>

          {/* PayPal */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">PayPal</h2>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="paypalMeUsername" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                  PayPal.me Username
                </label>
                <input
                  type="text"
                  id="paypalMeUsername"
                  value={formData.paypalMeUsername}
                  onChange={(e) => handleChange("paypalMeUsername", e.target.value)}
                  placeholder="yourname"
                  className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                />
                <p className="text-[11px] text-[#b0a99f]">
                  Creates a paypal.me/{formData.paypalMeUsername || "username"} link with the lesson amount pre-filled
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="paypalEmail" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                  PayPal Email
                </label>
                <input
                  type="email"
                  id="paypalEmail"
                  value={formData.paypalEmail}
                  onChange={(e) => handleChange("paypalEmail", e.target.value)}
                  placeholder="your-email@example.com"
                  className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
                />
                <p className="text-[11px] text-[#b0a99f]">
                  Used as a fallback if PayPal.me username is not set
                </p>
              </div>
            </div>
          </div>

          {/* Stripe */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Stripe (Card Payments)</h2>
            </div>
            <p className="text-[12px] text-[#7a756d]">
              Stripe checkout links are generated automatically when you accept a lesson request. 
              The Stripe API key is configured via the <span className="font-mono text-[11px] bg-[#f0ede8] px-1 py-0.5 rounded">STRIPE_SECRET_KEY</span> environment variable.
            </p>
          </div>

          {/* Lesson Rate */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Lesson Rate</h2>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="lessonRate" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                Rate Per Lesson ($)
              </label>
              <input
                type="text"
                id="lessonRate"
                value={formData.lessonRate}
                onChange={(e) => handleChange("lessonRate", e.target.value)}
                placeholder="160"
                className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
              />
              <p className="text-[11px] text-[#b0a99f]">
                This amount is pre-filled in Venmo, PayPal, and Stripe payment links
              </p>
            </div>
          </div>

          {/* Notification Email */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Notifications</h2>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="notificationEmail" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                Notification Email
              </label>
              <input
                type="email"
                id="notificationEmail"
                value={formData.notificationEmail}
                onChange={(e) => handleChange("notificationEmail", e.target.value)}
                placeholder="difaziotennis@gmail.com"
                className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all"
              />
              <p className="text-[11px] text-[#b0a99f]">
                You'll receive lesson request and confirmation emails here
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6">
            <div className="mb-4">
              <h2 className="text-[10px] tracking-[0.15em] uppercase text-[#7a756d] font-medium">Notes</h2>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="notes" className="block text-[10px] tracking-[0.1em] uppercase text-[#7a756d] font-medium">
                Additional Payment Instructions
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="e.g., 'Please include booking date in payment memo'"
                rows={3}
                className="w-full px-3 py-2 bg-[#faf9f7] border border-[#e8e5df] rounded-lg text-[16px] sm:text-[13px] text-[#1a1a1a] placeholder:text-[#c4bfb8] focus:ring-1 focus:ring-[#1a1a1a] focus:border-[#1a1a1a] outline-none transition-all resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.push("/book")}
              className="px-5 py-2.5 border border-[#e8e5df] text-[#6b665e] rounded-lg text-[12px] font-medium hover:bg-[#f0ede8] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Save className="h-3.5 w-3.5" />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
            {saveMessage && (
              <span className={`text-[12px] ${saveMessage.includes("Error") ? "text-[#991b1b]" : "text-[#5a8a5a]"}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>

        {/* Info Note */}
        <div className="mt-8 p-4 bg-[#faf9f7] border border-[#e8e5df] rounded-xl">
          <p className="text-[11px] text-[#7a756d]">
            <strong className="text-[#1a1a1a]">Note:</strong> Changes here are saved to your browser. 
            To update the payment links that appear in client emails, the values in the server configuration 
            (<span className="font-mono text-[10px] bg-[#f0ede8] px-1 py-0.5 rounded">payment-config.ts</span>) also need to be updated.
          </p>
        </div>
      </main>
    </div>
  );
}
