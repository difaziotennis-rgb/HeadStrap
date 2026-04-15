"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Save, CalendarDays, LogOut, Trophy, Users, Copy, Check, CreditCard, Pencil, Trash2, X as XIcon } from "lucide-react";
import { PAYMENT_CONFIG, getLessonRate } from "@/lib/payment-config";
import { readAllSlots, readAllRecurring, readAllBookings } from "@/lib/booking-data";
import { Member } from "@/lib/types";

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
  const [clients, setClients] = useState<{ name: string; email: string; phone: string }[]>([]);
  const [clientsLoaded, setClientsLoaded] = useState(false);
  const [copiedEmails, setCopiedEmails] = useState(false);
  const [showClientList, setShowClientList] = useState(false);
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  // Members state
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);
  const [showMemberList, setShowMemberList] = useState(false);
  const [expandedMember, setExpandedMember] = useState<number | null>(null);

  // Edit state for clients
  const [editingClient, setEditingClient] = useState<number | null>(null);
  const [editClientData, setEditClientData] = useState({ name: "", email: "", phone: "" });

  // Edit state for members
  const [editingMember, setEditingMember] = useState<number | null>(null);
  const [editMemberData, setEditMemberData] = useState({ name: "", email: "", phone: "" });

  // Hidden clients (removed from list view only, data stays intact)
  const [hiddenClients, setHiddenClients] = useState<Set<string>>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("hiddenClients");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    }
    return new Set();
  });

  // Delete confirmation
  const [confirmDeleteClient, setConfirmDeleteClient] = useState<number | null>(null);
  const [confirmDeleteMember, setConfirmDeleteMember] = useState<number | null>(null);

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

  // Load clients only when the list is opened
  useEffect(() => {
    if (showClientList && !clientsLoaded) {
      loadClients();
    }
  }, [showClientList]);

  // Load members only when the list is opened
  useEffect(() => {
    if (showMemberList && !membersLoaded) {
      loadMembers();
    }
  }, [showMemberList]);

  const loadClients = async () => {
    const clientMap = new Map<string, { email: string; phone: string }>();

    function addClient(name: string, email: string, phone: string) {
      if (!name) return;
      const key = name.toLowerCase().trim();
      const existing = clientMap.get(key);
      if (!existing) {
        clientMap.set(key, { email: email.trim(), phone: phone.trim() });
      } else {
        // Fill in missing info
        if (!existing.email && email.trim()) existing.email = email.trim();
        if (!existing.phone && phone.trim()) existing.phone = phone.trim();
      }
    }

    // From booked time slots
    const slots = await readAllSlots();
    for (const slot of Object.values(slots)) {
      if (slot.booked && slot.bookedBy) {
        addClient(slot.bookedBy, slot.bookedEmail || "", slot.bookedPhone || "");
      }
    }

    // From recurring lessons
    const recurring = await readAllRecurring();
    for (const lesson of recurring) {
      addClient(lesson.clientName, lesson.clientEmail || "", lesson.clientPhone || "");
    }

    // From bookings
    const bookings = await readAllBookings();
    for (const booking of Object.values(bookings)) {
      addClient(booking.clientName, booking.clientEmail || "", booking.clientPhone || "");
    }

    // From ladder players (different Supabase instance, so use existing API)
    try {
      const clubRes = await fetch("/api/clubs/rhinebeck-tennis-club");
      if (clubRes.ok) {
        const club = await clubRes.json();
        const ladderRes = await fetch(`/api/ladder?club_id=${club.id}`);
        if (ladderRes.ok) {
          const players = await ladderRes.json();
          for (const p of players) {
            addClient(p.name || "", p.email || "", p.phone_number || "");
          }
        }
      }
    } catch (e) {
      console.error("[loadClients] Failed to fetch ladder players:", e);
    }

    // Convert to sorted array, filtering out hidden clients
    const list = Array.from(clientMap.entries())
      .filter(([key]) => !hiddenClients.has(key))
      .map(([key, info]) => ({
        name: key.replace(/\b\w/g, (c) => c.toUpperCase()),
        email: info.email,
        phone: info.phone,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    setClients(list);
    setClientsLoaded(true);
  };

  const handleCopyEmails = () => {
    const emails = clients
      .map((c) => c.email)
      .filter((e) => e.length > 0);
    if (emails.length === 0) return;
    navigator.clipboard.writeText(emails.join(", "));
    setCopiedEmails(true);
    setTimeout(() => setCopiedEmails(false), 3000);
  };

  const loadMembers = async () => {
    try {
      const res = await fetch("/api/members");
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch (e) {
      console.error("Failed to load members:", e);
    }
    setMembersLoaded(true);
  };

  // Client edit/delete handlers
  const handleEditClient = (i: number) => {
    setEditingClient(i);
    setEditClientData({ name: clients[i].name, email: clients[i].email, phone: clients[i].phone });
  };

  const handleSaveClient = async (i: number) => {
    const original = clients[i];
    try {
      await fetch("/api/clients", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalName: original.name,
          name: editClientData.name,
          email: editClientData.email,
          phone: editClientData.phone,
        }),
      });
      const updated = [...clients];
      updated[i] = { ...editClientData };
      setClients(updated);
    } catch (e) {
      console.error("Failed to update client:", e);
    }
    setEditingClient(null);
  };

  const handleDeleteClient = (i: number) => {
    const client = clients[i];
    const key = client.name.toLowerCase().trim();
    const updated = new Set(hiddenClients);
    updated.add(key);
    setHiddenClients(updated);
    localStorage.setItem("hiddenClients", JSON.stringify(Array.from(updated)));
    setClients(clients.filter((_, idx) => idx !== i));
    setExpandedClient(null);
    setConfirmDeleteClient(null);
  };

  // Member edit/delete handlers
  const handleEditMember = (i: number) => {
    setEditingMember(i);
    setEditMemberData({ name: members[i].name, email: members[i].email, phone: members[i].phone || "" });
  };

  const handleSaveMember = async (i: number) => {
    const member = members[i];
    try {
      await fetch("/api/members", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: member.id,
          name: editMemberData.name,
          email: editMemberData.email,
          phone: editMemberData.phone,
        }),
      });
      const updated = [...members];
      updated[i] = { ...updated[i], name: editMemberData.name, email: editMemberData.email, phone: editMemberData.phone };
      setMembers(updated);
    } catch (e) {
      console.error("Failed to update member:", e);
    }
    setEditingMember(null);
  };

  const handleDeleteMember = async (i: number) => {
    const member = members[i];
    try {
      await fetch("/api/members", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: member.id }),
      });
      setMembers(members.filter((_, idx) => idx !== i));
      setExpandedMember(null);
    } catch (e) {
      console.error("Failed to delete member:", e);
    }
    setConfirmDeleteMember(null);
  };

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

        {/* Client List Toggle */}
        <div className="mt-10 mb-8">
          <button
            onClick={() => setShowClientList(!showClientList)}
            type="button"
            className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6 hover:bg-[#faf9f7] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-[#6b665e]" />
              <div className="text-left">
                <p className="text-[14px] font-medium text-[#1a1a1a]">Client List</p>
                <p className="text-[11px] text-[#7a756d]">
                  {clientsLoaded ? `${clients.length} client${clients.length !== 1 ? "s" : ""}` : "View all clients"}
                </p>
              </div>
            </div>
            <span className="text-[#a39e95] text-[18px]">{showClientList ? "−" : "+"}</span>
          </button>

          {showClientList && (
            <div className="mt-3">
              {/* Copy All Emails button */}
              {clientsLoaded && clients.some((c) => c.email) && (
                <div className="mb-3">
                  <button
                    onClick={handleCopyEmails}
                    type="button"
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a1a1a] text-white rounded-lg text-[12px] font-medium hover:bg-[#333] transition-colors active:scale-95"
                  >
                    {copiedEmails ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Emails Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy All Emails
                      </>
                    )}
                  </button>
                </div>
              )}

              {clientsLoaded && clients.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] divide-y divide-[#e8e5df]">
                  {clients.map((client, i) => (
                    <div key={i}>
                      <button
                        onClick={() => { setExpandedClient(expandedClient === i ? null : i); setEditingClient(null); setConfirmDeleteClient(null); }}
                        type="button"
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#faf9f7] transition-colors"
                      >
                        <p className="text-[13px] font-medium text-[#1a1a1a]">{client.name}</p>
                        <span className="text-[#a39e95] text-[14px]">{expandedClient === i ? "−" : "+"}</span>
                      </button>
                      {expandedClient === i && (
                        <div className="px-5 pb-4 pt-0">
                          {editingClient === i ? (
                            <div className="space-y-2">
                              <input value={editClientData.name} onChange={(e) => setEditClientData({ ...editClientData, name: e.target.value })} placeholder="Name" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <input value={editClientData.email} onChange={(e) => setEditClientData({ ...editClientData, email: e.target.value })} placeholder="Email" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <input value={editClientData.phone} onChange={(e) => setEditClientData({ ...editClientData, phone: e.target.value })} placeholder="Phone" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => handleSaveClient(i)} type="button" className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-md text-[11px] font-medium hover:bg-[#333] transition-colors">Save</button>
                                <button onClick={() => setEditingClient(null)} type="button" className="px-3 py-1.5 border border-[#e8e5df] text-[#6b665e] rounded-md text-[11px] font-medium hover:bg-[#f0ede8] transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {client.email ? (
                                <div className="flex items-center justify-between">
                                  <p className="text-[12px] text-[#7a756d]">{client.email}</p>
                                  <a href={`mailto:${client.email}`} className="text-[11px] text-[#1a1a1a] bg-[#f0ede8] hover:bg-[#e8e5df] px-3 py-1 rounded-md font-medium transition-colors">Email</a>
                                </div>
                              ) : (
                                <p className="text-[12px] text-[#c4bfb8] italic">No email on file</p>
                              )}
                              {client.phone ? (
                                <div className="flex items-center justify-between">
                                  <p className="text-[12px] text-[#7a756d]">{client.phone}</p>
                                  <a href={`tel:${client.phone}`} className="text-[11px] text-[#1a1a1a] bg-[#f0ede8] hover:bg-[#e8e5df] px-3 py-1 rounded-md font-medium transition-colors">Call</a>
                                </div>
                              ) : (
                                <p className="text-[12px] text-[#c4bfb8] italic">No phone on file</p>
                              )}
                              <div className="flex gap-2 pt-2 border-t border-[#f0ede8]">
                                <button onClick={() => handleEditClient(i)} type="button" className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-[#6b665e] bg-[#f0ede8] hover:bg-[#e8e5df] rounded-md font-medium transition-colors">
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                {confirmDeleteClient === i ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#991b1b]">Delete?</span>
                                    <button onClick={() => handleDeleteClient(i)} type="button" className="px-3 py-1.5 text-[11px] text-white bg-[#991b1b] hover:bg-[#7f1d1d] rounded-md font-medium transition-colors">Yes</button>
                                    <button onClick={() => setConfirmDeleteClient(null)} type="button" className="px-3 py-1.5 text-[11px] text-[#6b665e] bg-[#f0ede8] hover:bg-[#e8e5df] rounded-md font-medium transition-colors">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteClient(i)} type="button" className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-[#991b1b] bg-[#fef2f2] hover:bg-[#fecaca] rounded-md font-medium transition-colors">
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : clientsLoaded ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-8 text-center">
                  <p className="text-[13px] text-[#7a756d]">No clients yet</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Member List Toggle */}
        <div className="mt-5 mb-8">
          <button
            onClick={() => setShowMemberList(!showMemberList)}
            type="button"
            className="w-full flex items-center justify-between bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-5 sm:p-6 hover:bg-[#faf9f7] transition-colors active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-[#6b665e]" />
              <div className="text-left">
                <p className="text-[14px] font-medium text-[#1a1a1a]">Members</p>
                <p className="text-[11px] text-[#7a756d]">
                  {membersLoaded ? `${members.length} member${members.length !== 1 ? "s" : ""}` : "View all members"}
                </p>
              </div>
            </div>
            <span className="text-[#a39e95] text-[18px]">{showMemberList ? "−" : "+"}</span>
          </button>

          {showMemberList && (
            <div className="mt-3">
              {membersLoaded && members.length > 0 ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] divide-y divide-[#e8e5df]">
                  {members.map((member, i) => (
                    <div key={member.id}>
                      <button
                        onClick={() => { setExpandedMember(expandedMember === i ? null : i); setEditingMember(null); setConfirmDeleteMember(null); }}
                        type="button"
                        className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#faf9f7] transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <p className="text-[13px] font-medium text-[#1a1a1a]">{member.name}</p>
                          <span className="text-[10px] font-mono text-[#8a8477] bg-[#f0ede8] px-1.5 py-0.5 rounded">{member.member_code}</span>
                          {!member.active && <span className="text-[10px] text-[#991b1b] bg-[#fef2f2] px-1.5 py-0.5 rounded">Inactive</span>}
                        </div>
                        <span className="text-[#a39e95] text-[14px]">{expandedMember === i ? "−" : "+"}</span>
                      </button>
                      {expandedMember === i && (
                        <div className="px-5 pb-4 pt-0">
                          {editingMember === i ? (
                            <div className="space-y-2">
                              <input value={editMemberData.name} onChange={(e) => setEditMemberData({ ...editMemberData, name: e.target.value })} placeholder="Name" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <input value={editMemberData.email} onChange={(e) => setEditMemberData({ ...editMemberData, email: e.target.value })} placeholder="Email" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <input value={editMemberData.phone} onChange={(e) => setEditMemberData({ ...editMemberData, phone: e.target.value })} placeholder="Phone" className="w-full px-2.5 py-1.5 border border-[#e8e5df] rounded-md text-[12px] text-[#1a1a1a] bg-[#faf9f7] outline-none focus:ring-1 focus:ring-[#1a1a1a]" />
                              <div className="flex gap-2 pt-1">
                                <button onClick={() => handleSaveMember(i)} type="button" className="px-3 py-1.5 bg-[#1a1a1a] text-white rounded-md text-[11px] font-medium hover:bg-[#333] transition-colors">Save</button>
                                <button onClick={() => setEditingMember(null)} type="button" className="px-3 py-1.5 border border-[#e8e5df] text-[#6b665e] rounded-md text-[11px] font-medium hover:bg-[#f0ede8] transition-colors">Cancel</button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] tracking-[0.1em] uppercase text-[#a39e95]">Member Code</p>
                                <p className="text-[12px] font-mono font-medium text-[#1a1a1a]">{member.member_code}</p>
                              </div>
                              {member.email ? (
                                <div className="flex items-center justify-between">
                                  <p className="text-[12px] text-[#7a756d]">{member.email}</p>
                                  <a href={`mailto:${member.email}`} className="text-[11px] text-[#1a1a1a] bg-[#f0ede8] hover:bg-[#e8e5df] px-3 py-1 rounded-md font-medium transition-colors">Email</a>
                                </div>
                              ) : (
                                <p className="text-[12px] text-[#c4bfb8] italic">No email on file</p>
                              )}
                              {member.phone ? (
                                <div className="flex items-center justify-between">
                                  <p className="text-[12px] text-[#7a756d]">{member.phone}</p>
                                  <a href={`tel:${member.phone}`} className="text-[11px] text-[#1a1a1a] bg-[#f0ede8] hover:bg-[#e8e5df] px-3 py-1 rounded-md font-medium transition-colors">Call</a>
                                </div>
                              ) : (
                                <p className="text-[12px] text-[#c4bfb8] italic">No phone on file</p>
                              )}
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] tracking-[0.1em] uppercase text-[#a39e95]">Status</p>
                                <p className={`text-[12px] font-medium ${member.active ? "text-[#2d5016]" : "text-[#991b1b]"}`}>
                                  {member.active ? "Active" : "Inactive"}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] tracking-[0.1em] uppercase text-[#a39e95]">Joined</p>
                                <p className="text-[12px] text-[#7a756d]">
                                  {new Date(member.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                </p>
                              </div>
                              <div className="flex gap-2 pt-2 border-t border-[#f0ede8]">
                                <button onClick={() => handleEditMember(i)} type="button" className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-[#6b665e] bg-[#f0ede8] hover:bg-[#e8e5df] rounded-md font-medium transition-colors">
                                  <Pencil className="h-3 w-3" /> Edit
                                </button>
                                {confirmDeleteMember === i ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[11px] text-[#991b1b]">Delete?</span>
                                    <button onClick={() => handleDeleteMember(i)} type="button" className="px-3 py-1.5 text-[11px] text-white bg-[#991b1b] hover:bg-[#7f1d1d] rounded-md font-medium transition-colors">Yes</button>
                                    <button onClick={() => setConfirmDeleteMember(null)} type="button" className="px-3 py-1.5 text-[11px] text-[#6b665e] bg-[#f0ede8] hover:bg-[#e8e5df] rounded-md font-medium transition-colors">No</button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteMember(i)} type="button" className="flex items-center gap-1 px-3 py-1.5 text-[11px] text-[#991b1b] bg-[#fef2f2] hover:bg-[#fecaca] rounded-md font-medium transition-colors">
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : membersLoaded ? (
                <div className="bg-white rounded-2xl shadow-sm border border-[#e8e5df] p-8 text-center">
                  <p className="text-[13px] text-[#7a756d]">No members yet</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

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
