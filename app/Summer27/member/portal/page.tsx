"use client";

import Link from "next/link";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useS27Session } from "../../use-s27-session";
import { getPaymentProfile } from "../../payments";
import { SaveCardForm } from "../../SaveCardForm";
import { patchS27Session, type S27MemberSession } from "../../member-session";
import MemberBookings from "../MemberBookings";
import {
  KEYS,
  findMemberAccount,
  loadList,
  loadRecord,
  memberOnCourt,
  saveList,
  uniqueCourts,
  updateMemberAccount,
  type S27Charge,
  type S27ClinicBooking,
  type S27CourtBooking,
  type S27EventBooking,
  type S27LessonBooking,
  type S27MemberAccount,
  type S27MemberChild,
  type S27PaymentProfile,
  type S27StringingOrder,
} from "../../storage";

type Tab = "bookings" | "settings" | "family" | "card";
type ContactPref = NonNullable<S27MemberAccount["preferredContact"]>;

function uidChild() {
  return `child-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function writeSession(next: S27MemberSession) {
  patchS27Session(next);
}

export default function Summer27PortalPage() {
  return (
    <Suspense fallback={<div className="p-8 text-[13px] text-[#7a756d]">Loading account…</div>}>
      <PortalInner />
    </Suspense>
  );
}

function PortalInner() {
  const session = useS27Session();
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [tab, setTab] = useState<Tab>(() =>
    tabParam === "settings" || tabParam === "family" || tabParam === "card" || tabParam === "bookings"
      ? tabParam
      : "bookings"
  );
  const [courts, setCourts] = useState<S27CourtBooking[]>([]);
  const [clinics, setClinics] = useState<S27ClinicBooking[]>([]);
  const [lessons, setLessons] = useState<S27LessonBooking[]>([]);
  const [events, setEvents] = useState<S27EventBooking[]>([]);
  const [stringing, setStringing] = useState<S27StringingOrder[]>([]);
  const [charges, setCharges] = useState<S27Charge[]>([]);
  const [payment, setPayment] = useState<S27PaymentProfile | null>(null);
  const [brand, setBrand] = useState<S27PaymentProfile["brand"]>("Visa");
  const [last4, setLast4] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const [profile, setProfile] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [directoryVisible, setDirectoryVisible] = useState(false);
  const [preferredContact, setPreferredContact] = useState<ContactPref>("none");
  const [directoryNote, setDirectoryNote] = useState("");
  const [children, setChildren] = useState<S27MemberChild[]>([]);
  const [childDraft, setChildDraft] = useState({ name: "", birthYear: "", notes: "" });

  useEffect(() => {
    if (tabParam === "settings" || tabParam === "family" || tabParam === "card" || tabParam === "bookings") {
      setTab(tabParam);
    }
  }, [tabParam]);

  const reload = useCallback(() => {
    if (!session) return;
    setCourts(
      uniqueCourts(loadRecord<S27CourtBooking>(KEYS.courts)).filter((b) =>
        memberOnCourt(b, session.memberNumber, session.memberEmail)
      )
    );
    setClinics(
      loadList<S27ClinicBooking>(KEYS.clinics).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setLessons(
      loadList<S27LessonBooking>(KEYS.lessons).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setEvents(
      loadList<S27EventBooking>(KEYS.events).filter(
        (b) => b.memberNumber === session.memberNumber || b.attendeeEmail === session.memberEmail
      )
    );
    setStringing(
      loadList<S27StringingOrder>(KEYS.stringing).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    setCharges(
      loadList<S27Charge>(KEYS.charges).filter(
        (b) => b.memberNumber === session.memberNumber || b.clientEmail === session.memberEmail
      )
    );
    const account = findMemberAccount(session.memberNumber);
    if (account) {
      setProfile({
        name: account.name,
        email: account.email,
        phone: account.phone || "",
        password: "",
        confirm: "",
      });
      setChildren(Array.isArray(account.children) ? account.children : []);
      setDirectoryVisible(!!account.directoryVisible);
      setPreferredContact(account.preferredContact || "none");
      setDirectoryNote(account.directoryNote || "");
    } else {
      setProfile({
        name: session.memberName,
        email: session.memberEmail,
        phone: session.memberPhone || "",
        password: "",
        confirm: "",
      });
      setChildren([]);
    }
    const card = getPaymentProfile(session.memberNumber);
    setPayment(card);
    if (card) {
      setBrand(card.brand);
      setLast4(card.last4);
    }
  }, [session]);

  useEffect(() => {
    reload();
  }, [reload]);

  function ping(message: string) {
    setMsg(message);
    window.setTimeout(() => setMsg(null), 2800);
  }

  function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    const name = profile.name.trim();
    const email = profile.email.trim().toLowerCase();
    const phone = profile.phone.trim();
    if (!name || !email) {
      ping("Name and email are required.");
      return;
    }
    if (profile.password && profile.password !== profile.confirm) {
      ping("Passwords don’t match.");
      return;
    }
    if (profile.password && profile.password.length < 4) {
      ping("Password should be at least 4 characters.");
      return;
    }

    const others = loadList<S27MemberAccount>(KEYS.members).filter(
      (m) => m.memberNumber !== session.memberNumber
    );
    if (others.some((m) => m.email.trim().toLowerCase() === email)) {
      ping("That email is already on another account.");
      return;
    }

    const patch: Parameters<typeof updateMemberAccount>[1] = {
      name,
      email,
      phone,
      directoryVisible,
      preferredContact: directoryVisible ? preferredContact : "none",
      directoryNote: directoryVisible ? directoryNote.trim() || undefined : undefined,
    };
    if (profile.password) patch.password = profile.password;
    const updated = updateMemberAccount(session.memberNumber, patch);
    if (!updated) {
      ping("Couldn’t save profile.");
      return;
    }
    writeSession({
      memberNumber: updated.memberNumber,
      memberEmail: updated.email,
      memberName: updated.name,
      memberPhone: updated.phone,
      signedInAt: session.signedInAt,
    });
    setProfile((p) => ({ ...p, password: "", confirm: "" }));
    ping("Account settings saved.");
  }

  function saveChildren(next: S27MemberChild[]) {
    if (!session) return;
    const updated = updateMemberAccount(session.memberNumber, { children: next });
    if (!updated) {
      ping("Couldn’t save family list.");
      return;
    }
    setChildren(next);
    ping("Family list saved.");
  }

  function addChild(e: React.FormEvent) {
    e.preventDefault();
    const name = childDraft.name.trim();
    if (!name) {
      ping("Add your child’s name.");
      return;
    }
    const year = childDraft.birthYear.trim();
    if (year && (!/^\d{4}$/.test(year) || Number(year) < 1995 || Number(year) > new Date().getFullYear())) {
      ping("Use a 4-digit birth year.");
      return;
    }
    const next: S27MemberChild[] = [
      ...children,
      {
        id: uidChild(),
        name,
        birthYear: year || undefined,
        notes: childDraft.notes.trim() || undefined,
      },
    ];
    setChildDraft({ name: "", birthYear: "", notes: "" });
    saveChildren(next);
  }

  function persistCard(next: S27PaymentProfile) {
    if (!session) return;
    const all = loadList<S27PaymentProfile>(KEYS.payment).filter((p) => p.memberNumber !== session.memberNumber);
    saveList(KEYS.payment, [...all, next]);
    setPayment(next);
    setBrand(next.brand);
    setLast4(next.last4);
    ping("Card saved.");
  }

  if (!session) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center">
        <h2 className="text-xl font-medium">My Account</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">Sign in above, or join.</p>
        <Link href="/Summer27/member" className="mt-4 inline-block rounded-lg bg-[#1a1a1a] px-4 py-2 text-[13px] text-white">
          Join
        </Link>
      </main>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "bookings", label: "Bookings" },
    { id: "settings", label: "Settings" },
    { id: "family", label: "Family" },
    { id: "card", label: "Card" },
  ];

  return (
    <main className="mx-auto w-full max-w-4xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">My account</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight">{session.memberName}</h2>
      <p className="mt-1 text-[13px] text-[#6b665e]">
        Member #{session.memberNumber} · {session.memberEmail}
        {children.length > 0
          ? ` · ${children.length} child${children.length === 1 ? "" : "ren"}`
          : ""}
      </p>

      <div className="mt-5 flex flex-wrap gap-1 rounded-xl border border-[#e8e5df] bg-white p-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-3.5 py-2 text-[13px] font-medium ${
              tab === item.id ? "bg-[#1a1a1a] text-white" : "text-[#6b665e] hover:bg-[#faf9f7]"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {msg && (
        <p className="mt-3 rounded-xl border border-[#e8e5df] bg-[#faf9f7] px-3 py-2 text-[13px] text-[#4a4a4a]">
          {msg}
        </p>
      )}

      {tab === "bookings" && (
        <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
          <MemberBookings
            courts={courts}
            clinics={clinics}
            lessons={lessons}
            events={events}
            stringing={stringing}
            charges={charges}
            onChange={reload}
          />
        </section>
      )}

      {tab === "settings" && (
        <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Account settings</p>
          <p className="mt-1 text-[13px] text-[#6b665e]">Update your name, contact info, or password.</p>
          <form onSubmit={saveProfile} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block text-[11px] text-[#8a8477] sm:col-span-2">
              Full name
              <input
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                required
              />
            </label>
            <label className="block text-[11px] text-[#8a8477]">
              Email
              <input
                type="email"
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                required
              />
            </label>
            <label className="block text-[11px] text-[#8a8477]">
              Phone
              <input
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              />
            </label>
            <label className="block text-[11px] text-[#8a8477]">
              New password
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                value={profile.password}
                onChange={(e) => setProfile({ ...profile, password: e.target.value })}
                placeholder="Leave blank to keep"
                autoComplete="new-password"
              />
            </label>
            <label className="block text-[11px] text-[#8a8477]">
              Confirm password
              <input
                type="password"
                className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                value={profile.confirm}
                onChange={(e) => setProfile({ ...profile, confirm: e.target.value })}
                placeholder="Repeat new password"
                autoComplete="new-password"
              />
            </label>

            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Club directory</p>
              <p className="mt-1 text-[12px] text-[#6b665e]">
                Opt in so other members can find you and, if you choose, see how to reach you.
              </p>
              <label className="mt-3 flex items-center gap-2 text-[13px] text-[#4a4a4a]">
                <input
                  type="checkbox"
                  checked={directoryVisible}
                  onChange={(e) => setDirectoryVisible(e.target.checked)}
                />
                Show me in the member directory
              </label>
              {directoryVisible && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block text-[11px] text-[#8a8477]">
                    Preferred contact
                    <select
                      className="mt-1 w-full rounded-xl border border-[#e8e5df] bg-white px-3 py-3 text-[15px]"
                      value={preferredContact}
                      onChange={(e) => setPreferredContact(e.target.value as ContactPref)}
                    >
                      <option value="none">Don’t show contact</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="either">Phone or email</option>
                    </select>
                  </label>
                  <label className="block text-[11px] text-[#8a8477] sm:col-span-2">
                    Short note (optional)
                    <input
                      className="mt-1 w-full rounded-xl border border-[#e8e5df] bg-white px-3 py-3 text-[15px]"
                      value={directoryNote}
                      onChange={(e) => setDirectoryNote(e.target.value)}
                      placeholder="e.g. 3.5 · weekday mornings"
                    />
                  </label>
                </div>
              )}
              <Link href="/Summer27/members" className="mt-3 inline-block text-[12px] text-[#6b665e] underline-offset-2 hover:underline">
                Browse directory
              </Link>
            </div>

            <button
              type="submit"
              className="rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white sm:col-span-2"
            >
              Save settings
            </button>
          </form>
        </section>
      )}

      {tab === "family" && (
        <section className="mt-4 space-y-4">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
            <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Family membership</p>
            <p className="mt-1 text-[13px] text-[#6b665e]">
              Add children on your account for junior clinics and family play. You can pick them when signing up.
            </p>

            {children.length === 0 ? (
              <p className="mt-4 text-[14px] text-[#8a8477]">No children on this account yet.</p>
            ) : (
              <ul className="mt-4 divide-y divide-[#f0ede8] overflow-hidden rounded-xl border border-[#ece8e2]">
                {children.map((child) => (
                  <li key={child.id} className="flex flex-wrap items-start justify-between gap-3 px-3 py-3">
                    <div className="min-w-0">
                      <p className="text-[15px] font-medium text-[#1a1a1a]">{child.name}</p>
                      <p className="mt-0.5 text-[12px] text-[#6b665e]">
                        {child.birthYear ? `Born ${child.birthYear}` : "Birth year not set"}
                        {child.notes ? ` · ${child.notes}` : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => saveChildren(children.filter((c) => c.id !== child.id))}
                      className="text-[12px] font-medium text-[#991b1b]"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <form onSubmit={addChild} className="rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
            <p className="text-[14px] font-medium">Add a child</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-[11px] text-[#8a8477] sm:col-span-2">
                Child’s full name
                <input
                  className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  value={childDraft.name}
                  onChange={(e) => setChildDraft({ ...childDraft, name: e.target.value })}
                  placeholder="First and last name"
                  required
                />
              </label>
              <label className="block text-[11px] text-[#8a8477]">
                Birth year
                <input
                  className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  value={childDraft.birthYear}
                  onChange={(e) => setChildDraft({ ...childDraft, birthYear: e.target.value.replace(/\D/g, "").slice(0, 4) })}
                  placeholder="e.g. 2014"
                  inputMode="numeric"
                />
              </label>
              <label className="block text-[11px] text-[#8a8477]">
                Notes
                <input
                  className="mt-1 w-full rounded-xl border border-[#e8e5df] px-3 py-3 text-[15px]"
                  value={childDraft.notes}
                  onChange={(e) => setChildDraft({ ...childDraft, notes: e.target.value })}
                  placeholder="Level, school, etc."
                />
              </label>
            </div>
            <button type="submit" className="mt-3 w-full rounded-xl bg-[#1a1a1a] py-3 text-[13px] font-medium text-white">
              Add child
            </button>
          </form>
        </section>
      )}

      {tab === "card" && (
        <section className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Saved card</p>
          {payment ? (
            <p className="mt-2 text-[13px] text-[#4a4a4a]">
              {payment.brand} •••• {payment.last4}
              {payment.stripePaymentMethodId ? " · ready for live charges" : " · demo card"}
            </p>
          ) : (
            <p className="mt-2 text-[13px] text-[#8a8477]">
              No card on file yet. Add one to book courts, lessons, clinics, and events.
            </p>
          )}
          <div className="mt-3">
            <SaveCardForm
              email={session.memberEmail}
              name={session.memberName}
              memberNumber={session.memberNumber}
              existingCustomerId={payment?.stripeCustomerId}
              onSaved={(saved) => {
                persistCard({
                  memberNumber: session.memberNumber,
                  brand: saved.brand,
                  last4: saved.last4,
                  expMonth: saved.expMonth,
                  expYear: saved.expYear,
                  billingZip: payment?.billingZip || "",
                  oneClick: true,
                  stripeCustomerId: saved.customerId || undefined,
                  stripePaymentMethodId: saved.paymentMethodId || undefined,
                });
              }}
            />
          </div>
        </section>
      )}
    </main>
  );
}
