"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CreditCard, Wallet, Building2 } from "lucide-react";
import { initializeMockData } from "@/lib/mock-data";

interface PaymentSettings {
  paypalEmail: string;
  venmoHandle: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankRoutingNumber: string;
  bankName: string;
  notes: string;
}

export default function PaymentSettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [formData, setFormData] = useState<PaymentSettings>({
    paypalEmail: "",
    venmoHandle: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankRoutingNumber: "",
    bankName: "",
    notes: "",
  });

  useEffect(() => {
    // Check authentication
    const auth = sessionStorage.getItem("adminAuth");
    if (auth !== "true") {
      router.push("/book");
    } else {
      setIsAuthenticated(true);
      // Load saved payment settings
      loadPaymentSettings();
    }
  }, [router]);

  const loadPaymentSettings = () => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("paymentSettings");
      if (saved) {
        try {
          const settings = JSON.parse(saved);
          setFormData(settings);
        } catch (e) {
          console.error("Error loading payment settings:", e);
        }
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage("");

    try {
      // Save to localStorage (in production, save to database)
      localStorage.setItem("paymentSettings", JSON.stringify(formData));
      
      setSaveMessage("Payment settings saved successfully!");
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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-earth-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-primary-100 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/book")}
              className="p-2 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-primary-700" />
            </button>
            <div>
              <h1 className="text-2xl font-serif text-primary-800">Payment Settings</h1>
              <p className="text-sm text-earth-600">Configure how you receive payments</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PayPal Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Wallet className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-primary-800">PayPal</h2>
                <p className="text-sm text-earth-600">Email address for PayPal payments</p>
              </div>
            </div>
            <div>
              <label htmlFor="paypalEmail" className="block text-sm font-medium text-primary-800 mb-2">
                PayPal Email Address
              </label>
              <input
                type="email"
                id="paypalEmail"
                value={formData.paypalEmail}
                onChange={(e) => handleChange("paypalEmail", e.target.value)}
                placeholder="your-email@example.com"
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <p className="mt-1 text-xs text-earth-500">
                This is where PayPal payments will be sent
              </p>
            </div>
          </div>

          {/* Venmo Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-6 w-6 text-purple-700" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-primary-800">Venmo</h2>
                <p className="text-sm text-earth-600">Your Venmo username or phone number</p>
              </div>
            </div>
            <div>
              <label htmlFor="venmoHandle" className="block text-sm font-medium text-primary-800 mb-2">
                Venmo Handle
              </label>
              <input
                type="text"
                id="venmoHandle"
                value={formData.venmoHandle}
                onChange={(e) => handleChange("venmoHandle", e.target.value)}
                placeholder="@your-venmo-handle or phone number"
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
              <p className="mt-1 text-xs text-earth-500">
                Your Venmo username (with @) or phone number
              </p>
            </div>
          </div>

          {/* Bank Account Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 text-green-700" />
              </div>
              <div>
                <h2 className="text-xl font-serif text-primary-800">Bank Account</h2>
                <p className="text-sm text-earth-600">For direct bank transfers or ACH payments</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-primary-800 mb-2">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={formData.bankName}
                  onChange={(e) => handleChange("bankName", e.target.value)}
                  placeholder="Bank of America"
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="bankAccountName" className="block text-sm font-medium text-primary-800 mb-2">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  id="bankAccountName"
                  value={formData.bankAccountName}
                  onChange={(e) => handleChange("bankAccountName", e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bankAccountNumber" className="block text-sm font-medium text-primary-800 mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    id="bankAccountNumber"
                    value={formData.bankAccountNumber}
                    onChange={(e) => handleChange("bankAccountNumber", e.target.value)}
                    placeholder="123456789"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="bankRoutingNumber" className="block text-sm font-medium text-primary-800 mb-2">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    id="bankRoutingNumber"
                    value={formData.bankRoutingNumber}
                    onChange={(e) => handleChange("bankRoutingNumber", e.target.value)}
                    placeholder="123456789"
                    className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Notes Section */}
          <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-lg border border-primary-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <CreditCard className="h-6 w-6 text-primary-700" />
              <div>
                <h2 className="text-xl font-serif text-primary-800">Additional Notes</h2>
                <p className="text-sm text-earth-600">Any additional payment instructions</p>
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-primary-800 mb-2">
                Payment Instructions
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="e.g., 'Please include booking date in payment memo'"
                rows={4}
                className="w-full px-4 py-2 border border-primary-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              />
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => router.push("/book")}
              className="px-6 py-3 border-2 border-primary-300 text-primary-700 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save className="h-5 w-5" />
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>

          {saveMessage && (
            <div
              className={`p-4 rounded-lg ${
                saveMessage.includes("Error")
                  ? "bg-red-50 border border-red-200 text-red-700"
                  : "bg-green-50 border border-green-200 text-green-700"
              }`}
            >
              {saveMessage}
            </div>
          )}
        </form>

        {/* Security Note */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Security Note:</strong> Payment information is stored locally in your browser. 
            In production, this should be stored securely in a database with encryption.
          </p>
        </div>
      </main>
    </div>
  );
}


