"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  ChevronRight,
  Clock,
  GlassWater,
  MapPin,
  Sparkles,
  Trophy,
  Users,
  X,
} from "lucide-react";

const MEMBER_PRICE = 75;
const GUEST_PRICE = 95;

type SignupForm = {
  name: string;
  email: string;
  phone: string;
  memberNumber: string;
  partnerName: string;
  partnerEmail: string;
  notes: string;
};

const emptyForm: SignupForm = {
  name: "",
  email: "",
  phone: "",
  memberNumber: "",
  partnerName: "",
  partnerEmail: "",
  notes: "",
};

/** Single featured event — French Open–style mixed doubles mixer at RTC */
export default function EventsPage() {
  const [signupOpen, setSignupOpen] = useState(false);
  const [form, setForm] = useState<SignupForm>(emptyForm);
  const [formError, setFormError] = useState("");

  const openSignup = useCallback(() => {
    setForm(emptyForm);
    setFormError("");
    setSignupOpen(true);
  }, []);

  const closeSignup = useCallback(() => {
    setSignupOpen(false);
    setFormError("");
  }, []);

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const partner = form.partnerName.trim();
    if (!partner) {
      setFormError("Please enter your partner’s name — mixed doubles sign-ups require a partner.");
      return;
    }
    if (!form.name.trim() || !form.email.trim()) {
      setFormError("Please add your name and email.");
      return;
    }
    setFormError("");
    const body = [
      "French Open Clay Court Mixer — MEMBER SIGN-UP",
      "",
      `Registering member: ${form.name.trim()}`,
      `Email: ${form.email.trim()}`,
      `Phone: ${form.phone.trim() || "—"}`,
      `RTC member #: ${form.memberNumber.trim() || "—"}`,
      "",
      `Partner (required): ${partner}`,
      `Partner email: ${form.partnerEmail.trim() || "—"}`,
      "",
      `Notes: ${form.notes.trim() || "—"}`,
      "",
      `Pricing note: $${MEMBER_PRICE}/person members · $${GUEST_PRICE}/person guests (confirm at checkout).`,
    ].join("\n");
    const subject = `RTC French Open Mixer sign-up: ${form.name.trim()} & ${partner}`;
    window.location.href = `mailto:difaziotennis@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSignupOpen(false);
    setForm(emptyForm);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5]">
      <header className="border-b border-[#e8e5df]/80 bg-[#faf9f7]/95 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/book"
              className="text-[10px] tracking-[0.25em] uppercase text-[#b0a99f] hover:text-[#8a8477] transition-colors"
            >
              DiFazio Tennis
            </Link>
            <div className="flex items-center gap-4">
              <Link
                href="/book"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Book
              </Link>
              <Link
                href="/bio"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Bio
              </Link>
              <Link
                href="/ladder"
                className="text-[#8a8477] hover:text-[#1a1a1a] text-[12px] font-medium transition-colors"
              >
                Ladder
              </Link>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#c4a574]/30">
        <div
          className="absolute inset-0 bg-cover bg-[center_40%] sm:bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(30, 58, 95, 0.72) 0%, rgba(139, 55, 38, 0.45) 42%, rgba(26, 22, 20, 0.78) 100%), url(https://images.unsplash.com/photo-1750858287150-26d1e7f8b54f?auto=format&fit=crop&w=2000&q=80)",
          }}
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: `repeating-linear-gradient(
              90deg,
              transparent,
              transparent 2px,
              rgba(255,255,255,0.03) 2px,
              rgba(255,255,255,0.03) 4px
            )`,
          }}
          aria-hidden
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-14 sm:py-20 text-white">
          <p className="text-[10px] sm:text-[11px] tracking-[0.35em] uppercase text-white/75 mb-4">
            Rhinebeck Tennis Club · Members & guests
          </p>
          <h1 className="text-[32px] sm:text-[44px] lg:text-[52px] font-light tracking-tight leading-[1.05] max-w-3xl">
            French Open
            <span className="block font-medium mt-1 text-[#f4e4bc]">Clay Court Mixer</span>
          </h1>
          <p className="mt-6 text-[15px] sm:text-[16px] text-white/90 max-w-2xl leading-relaxed font-light">
            Mixed doubles, skill stations, and a round-robin points chase on clay—starting{" "}
            <strong className="font-medium text-white">3:00 PM</strong> on Roland Garros men&apos;s final
            Sunday. Inclusive social energy, RTC-level hosting.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12px] backdrop-blur-sm border border-white/20">
              <Calendar className="h-4 w-4 text-[#f4e4bc]" aria-hidden />
              Sun · June 7, 2026 · 3:00 PM
            </span>
            <span className="text-[12px] text-white/85">
              ${MEMBER_PRICE} members · ${GUEST_PRICE} guests · per person
            </span>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openSignup}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-[13px] font-semibold text-[#1e3a5f] shadow-lg hover:bg-[#f5f3ef] transition-colors"
            >
              Member sign-up
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] backdrop-blur-sm border border-white/15 self-center">
              <MapPin className="h-4 w-4 text-[#f4e4bc]" aria-hidden />
              RTC — clay & indoor
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-12 text-center max-w-xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-light text-[#1a1a1a] tracking-tight">
            Upscale, inclusive, clay-court energy
          </h2>
          <p className="mt-3 text-[14px] text-[#5c574f] leading-relaxed">
            Fair rotations, drill bonuses for the leaderboard, and room for every level—without losing
            the club-night polish.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          <div className="lg:col-span-7 space-y-8">
            <section>
              <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8a8477]">
                <Trophy className="h-4 w-4 text-[#c9a227]" aria-hidden />
                Format & scoring
              </h3>
              <div className="mt-4 space-y-3 text-[14px] text-[#4a4540] leading-relaxed">
                <p>
                  <strong className="text-[#1a1a1a] font-medium">Mixed doubles</strong> in timed rounds:
                  you rotate through opponents efficiently—games and tiebreak margin feed one{" "}
                  <strong className="text-[#1a1a1a] font-medium">points leaderboard</strong>. Optional
                  partner swaps mid-event keep it social.
                </p>
                <p>
                  <strong className="text-[#1a1a1a] font-medium">Skills stations</strong> first—volleys,
                  touch targets, serve spots—for bonus points toward the same total. Then main draw play,
                  super tiebreak finale for the top two, and a courtside social.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-7 shadow-sm">
              <h3 className="text-[17px] font-medium text-[#1a1a1a] tracking-tight">
                Event flow
              </h3>
              <ol className="mt-5 space-y-4">
                {[
                  { t: "3:00 PM — Check-in & draw", d: "Court assignment, shoe brush station." },
                  { t: "Skills rally", d: "Bonus-point stations, ~25 min." },
                  { t: "Round robin", d: "Timed matches; cumulative points." },
                  { t: "Finale & social", d: "Super tiebreak showcase, prizes, bites." },
                ].map((item, i) => (
                  <li key={item.t} className="flex gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#faf8f5] border border-[#e8e5df] text-[11px] font-semibold text-[#7a756d]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#1a1a1a] text-[14px]">{item.t}</p>
                      <p className="mt-0.5 text-[13px] text-[#6b665e]">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="lg:col-span-5 space-y-5">
            <div className="rounded-2xl border border-[#d4bc6a]/50 bg-[#fffdf8] p-6">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#8a7529]">Pricing · per person</p>
              <p className="mt-2 text-[28px] font-light text-[#1a1a1a] tracking-tight">
                ${MEMBER_PRICE}{" "}
                <span className="text-[15px] font-normal text-[#6b665e]">members</span>
              </p>
              <p className="text-[15px] text-[#5c574f] mt-1">
                ${GUEST_PRICE} guests / non-members
              </p>
              <p className="mt-3 text-[12px] text-[#8a8477] leading-relaxed">
                Suggested for a ~3-hour hosted social with drills, match play, refreshments, and prizes at
                a private club—confirm final details when you sign up.
              </p>
            </div>

            <div className="rounded-2xl bg-[#1e3a5f] text-white p-6 sm:p-7 shadow-xl shadow-[#1e3a5f]/20">
              <div className="flex items-center gap-2 text-[#f4e4bc]">
                <Sparkles className="h-4 w-4" aria-hidden />
                <span className="text-[11px] uppercase tracking-[0.2em]">Quick facts</span>
              </div>
              <ul className="mt-4 space-y-3 text-[13px] text-white/90">
                <li className="flex gap-3">
                  <Users className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>Capped field · balanced pairings with host help as needed.</span>
                </li>
                <li className="flex gap-3">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>~3 hours from 3:00 PM · arrive warmed up.</span>
                </li>
                <li className="flex gap-3">
                  <GlassWater className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>Mocktails, bites, and water stations.</span>
                </li>
                <li className="flex gap-3">
                  <Trophy className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>
                    <strong className="font-medium text-white">Prizes</strong> for top cumulative point
                    totals on the leaderboard. Separate{" "}
                    <strong className="font-medium text-white">best outfit</strong> award—have fun with
                    Roland-inspired style.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a8477]">
                What to wear & bring
              </h4>
              <p className="mt-3 text-[13px] text-[#5c574f] leading-relaxed">
                Athletic wear and court sneakers (Har-Tru–friendly tread). Whites optional.{" "}
                <strong className="text-[#1a1a1a] font-medium">Best outfit</strong> wins an award—have fun
                with clay-court chic. Bring water if you like.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4bc6a]/40 bg-[#fffdf8] p-6">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a7529]">
                Location
              </h4>
              <p className="mt-3 text-[13px] text-[#5c574f] leading-relaxed flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#c9a227]" aria-hidden />
                <span>
                  <strong className="text-[#1a1a1a]">2 Salisbury Court</strong>, Rhinebeck, NY 12572 —
                  outdoor clay; indoor ClayTech backup.
                </span>
              </p>
            </div>

            <button
              type="button"
              onClick={openSignup}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1a1a1a] px-5 py-3.5 text-[13px] font-medium text-white hover:bg-[#2d2d2d] transition-colors shadow-lg shadow-black/10"
            >
              Member sign-up (partner required)
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-center text-[11px] text-[#a39e95]">
              Opens email to confirm · list your partner in the form
            </p>
          </aside>
        </div>

        <div className="mt-12 pt-8 border-t border-[#e8e5df] text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to booking
          </Link>
        </div>
      </main>

      {signupOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="signup-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeSignup();
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-[#e8e5df] bg-white shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeSignup}
              className="absolute right-3 top-3 rounded-lg p-2 text-[#8a8477] hover:bg-[#faf8f5] hover:text-[#1a1a1a]"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
            <form onSubmit={handleSignupSubmit} className="p-6 sm:p-8">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a8477]">Rhinebeck Tennis Club</p>
              <h2 id="signup-title" className="mt-2 text-xl font-medium text-[#1a1a1a] tracking-tight">
                Member sign-up
              </h2>
              <p className="mt-2 text-[13px] text-[#6b665e] leading-relaxed">
                Mixed doubles teams register together: add yourself and your partner (required). You’ll
                send the details by email.
              </p>

              <div className="mt-6 space-y-3">
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                    Your name *
                  </span>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] text-[#1a1a1a] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    autoComplete="name"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                    Your email *
                  </span>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    autoComplete="email"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                    Phone
                  </span>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                    autoComplete="tel"
                  />
                </label>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                    Member # <span className="font-normal normal-case text-[#a39e95]">(optional)</span>
                  </span>
                  <input
                    value={form.memberNumber}
                    onChange={(e) => setForm((f) => ({ ...f, memberNumber: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </label>
                <div className="border-t border-[#f0ede8] pt-4 mt-2">
                  <label className="block">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#1e3a5f]">
                      Partner full name *
                    </span>
                    <input
                      value={form.partnerName}
                      onChange={(e) => setForm((f) => ({ ...f, partnerName: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1e3a5f] focus:ring-1 focus:ring-[#1e3a5f]"
                      placeholder="Required for mixed doubles registration"
                      autoComplete="off"
                    />
                  </label>
                  <label className="block mt-3">
                    <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                      Partner email <span className="font-normal normal-case text-[#a39e95]">(optional)</span>
                    </span>
                    <input
                      type="email"
                      value={form.partnerEmail}
                      onChange={(e) => setForm((f) => ({ ...f, partnerEmail: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                      autoComplete="off"
                    />
                  </label>
                </div>
                <label className="block">
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#8a8477]">
                    Notes
                  </span>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                    rows={2}
                    placeholder="Dietary restrictions, playing level, etc."
                    className="mt-1 w-full resize-none rounded-lg border border-[#e8e5df] px-3 py-2.5 text-[14px] outline-none focus:border-[#1a1a1a] focus:ring-1 focus:ring-[#1a1a1a]"
                  />
                </label>
              </div>

              {formError && (
                <p className="mt-4 text-[13px] text-[#991b1b] bg-[#fef2f2] border border-[#fecaca] rounded-lg px-3 py-2">
                  {formError}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-xl bg-[#1e3a5f] px-4 py-3 text-[13px] font-semibold text-white hover:bg-[#152a45] transition-colors"
              >
                Send sign-up email
              </button>
              <p className="mt-3 text-[11px] text-center text-[#a39e95]">
                Opens your email app to <strong className="font-medium text-[#6b665e]">difaziotennis@gmail.com</strong>
              </p>
            </form>
          </div>
        </div>
      )}

      <footer className="border-t border-[#e8e5df] mt-8 bg-[#faf9f7]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 text-center">
          <p className="text-[11px] text-[#b0a99f] tracking-wide">
            DiFazio Tennis · Rhinebeck, NY
          </p>
        </div>
      </footer>
    </div>
  );
}
