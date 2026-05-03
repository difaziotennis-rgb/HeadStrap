"use client";

import Link from "next/link";
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
} from "lucide-react";

/** Single featured event — French Open–style mixed doubles mixer at RTC */
export default function EventsPage() {
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

      {/* Hero — clay / Paris evening vibe without relying on trademark-heavy graphics */}
      <section className="relative overflow-hidden border-b border-[#c4a574]/30">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "linear-gradient(105deg, rgba(30, 58, 95, 0.88) 0%, rgba(139, 69, 49, 0.78) 45%, rgba(26, 26, 26, 0.85) 100%), url(https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=2000&q=80)",
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
            An afternoon into evening of mixed doubles, rotating partners, skill games, and Parisian
            flair—timed to begin at{" "}
            <strong className="font-medium text-white">3:00 PM</strong>, alongside Roland Garros
            men&apos;s final day. Structured so everyone scores points and nobody sits out too long.
            Competitive enough for tournament players; welcoming enough for your first social hit.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-[12px] backdrop-blur-sm border border-white/20">
              <Calendar className="h-4 w-4 text-[#f4e4bc]" aria-hidden />
              Sunday · June 7, 2026 · 3:00 PM start
            </span>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[12px] backdrop-blur-sm border border-white/15">
              <MapPin className="h-4 w-4 text-[#f4e4bc]" aria-hidden />
              Rhinebeck Tennis Club — clay & indoor
            </span>
          </div>
        </div>
      </section>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-12 text-center max-w-2xl mx-auto">
          <p className="text-[11px] tracking-[0.2em] uppercase text-[#9a8f7d] mb-3">
            Atmosphere
          </p>
          <h2 className="text-xl sm:text-2xl font-light text-[#1a1a1a] tracking-tight">
            Fun and inclusive, with a club-caliber finish
          </h2>
          <p className="mt-4 text-[14px] sm:text-[15px] text-[#5c574f] leading-relaxed">
            Expect linen-adjacent casual, soft clay underfoot, music low in the background between
            points, and a host team keeping rotations fair. We celebrate great shots—not just
            wins—so newer pairs still climb the leaderboard through drill bonuses and sportsmanship
            points.
          </p>
        </div>

        {/* Visual strip — brand tokens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-14">
          <div className="rounded-2xl bg-gradient-to-br from-[#c45c3e] to-[#8b3d2d] p-5 text-white shadow-lg shadow-[#8b3d2d]/20">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/80">Surface</p>
            <p className="mt-2 text-[15px] font-medium leading-snug">Har-Tru clay spotlight</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#152a45] p-5 text-white shadow-lg shadow-[#1e3a5f]/25">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/75">Dress</p>
            <p className="mt-2 text-[15px] font-medium leading-snug">Whites optional · RTC polish</p>
          </div>
          <div className="rounded-2xl bg-[#f4e4bc]/40 border border-[#d4bc6a]/50 p-5 text-[#3d3429] col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#7a6f5f]">Palette</p>
            <p className="mt-2 text-[15px] font-medium leading-snug">Terracotta · navy · champagne</p>
          </div>
          <div className="rounded-2xl bg-white border border-[#e8e5df] p-5 text-[#1a1a1a] shadow-sm col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-[0.15em] text-[#8a8477]">Spirit</p>
            <p className="mt-2 text-[15px] font-medium leading-snug">Round robin · every court counts</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          {/* Format */}
          <div className="lg:col-span-7 space-y-10">
            <section>
              <h3 className="flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#8a8477]">
                <Trophy className="h-4 w-4 text-[#c9a227]" aria-hidden />
                Format & scoring
              </h3>
              <div className="mt-5 space-y-4 text-[14px] text-[#4a4540] leading-relaxed">
                <p>
                  <strong className="text-[#1a1a1a] font-medium">Mixed doubles</strong> throughout—each
                  side is one women&apos;s and one men&apos;s lineup per conventional pairing. Teams move
                  through a <strong className="text-[#1a1a1a] font-medium">round robin</strong> so you
                  face every other pairing over timed rounds (no endless waits between matches).
                </p>
                <p>
                  <strong className="text-[#1a1a1a] font-medium">Points chase:</strong> every game won on
                  court earns team points. Short sets or tiebreak-to-seven rotations keep pace brisk.
                  Optional <strong className="text-[#1a1a1a] font-medium">partner swaps</strong> mid-event
                  keep social energy high while preserving mixed doubles integrity for each game window.
                </p>
                <p>
                  <strong className="text-[#1a1a1a] font-medium">Skills ladder (pre-main draw):</strong>{" "}
                  guided stations—volley consistency, drop-shot touch targets, serve placement—for bonus
                  points added to your team&apos;s tournament total. Laughs encouraged; coaching cues
                  minimal so flow stays moving.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8 shadow-[0_8px_30px_rgba(26,26,26,0.04)]">
              <h3 className="text-[17px] font-medium text-[#1a1a1a] tracking-tight">
                Event flow
              </h3>
              <ol className="mt-6 space-y-5">
                {[
                  {
                    t: "Arrival & court assignment (3:00 PM)",
                    d: "Check-in, printed draw card, optional clay-court shoe brush station.",
                  },
                  {
                    t: "Skills rally — bonus points",
                    d: "25 minutes rotating through drill stations; points banked to your team.",
                  },
                  {
                    t: "Round robin — main draw",
                    d: "Timed rounds on multiple courts; cumulative games + tiebreak margin as tiebreaker.",
                  },
                  {
                    t: "Super tiebreak finale",
                    d: "Top two teams by points meet for a spirited first-to-10 (win by 2) showcase.",
                  },
                  {
                    t: "Courtside social",
                    d: "Light refreshments, leaderboard reveal, photo on the baseline ribbon.",
                  },
                ].map((item, i) => (
                  <li key={item.t} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#faf8f5] border border-[#e8e5df] text-[12px] font-semibold text-[#7a756d]">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-medium text-[#1a1a1a] text-[14px]">{item.t}</p>
                      <p className="mt-1 text-[13px] text-[#6b665e] leading-relaxed">{item.d}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl bg-[#1e3a5f] text-white p-6 sm:p-7 shadow-xl shadow-[#1e3a5f]/20">
              <div className="flex items-center gap-2 text-[#f4e4bc]">
                <Sparkles className="h-4 w-4" aria-hidden />
                <span className="text-[11px] uppercase tracking-[0.2em]">Quick facts</span>
              </div>
              <ul className="mt-5 space-y-4 text-[13px] text-white/90">
                <li className="flex gap-3">
                  <Users className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>
                    Field capped for pace — mixed doubles squads balanced by USTA-style self-rating or
                    host pairing help.
                  </span>
                </li>
                <li className="flex gap-3">
                  <Clock className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>
                    Starts at 3:00 PM (men&apos;s final window)—plan ~3 hours including social; courts
                    flip quickly—please arrive warmed up.
                  </span>
                </li>
                <li className="flex gap-3">
                  <GlassWater className="h-4 w-4 shrink-0 mt-0.5 text-[#f4e4bc]" aria-hidden />
                  <span>
                    Sparkling & still water stations; seasonal mocktails & light bites — elevated but
                    unfussy.
                  </span>
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a8477]">
                What to wear & bring
              </h4>
              <p className="mt-3 text-[13px] text-[#5c574f] leading-relaxed">
                Athletic clothing and court sneakers with acceptable tread for Har-Tru. Tennis whites or
                cream accents fit the Roland-inspired mood but are not required—priority is movement and
                respect for the courts. Bring water; towels provided at front desk.
              </p>
            </div>

            <div className="rounded-2xl border border-[#d4bc6a]/40 bg-[#fffdf8] p-6">
              <h4 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#8a7529]">
                Rhinebeck Tennis Club
              </h4>
              <p className="mt-3 text-[13px] text-[#5c574f] leading-relaxed flex gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-[#c9a227]" aria-hidden />
                <span>
                  <strong className="text-[#1a1a1a]">2 Salisbury Court</strong>, Rhinebeck, NY 12572 —
                  outdoor clay highlighted for this event; indoor ClayTech available if weather shifts.
                </span>
              </p>
            </div>

            <a
              href="mailto:difaziotennis@gmail.com?subject=French%20Open%20Clay%20Court%20Mixer%20%E2%80%94%20registration"
              className="flex items-center justify-center gap-2 w-full rounded-xl bg-[#1a1a1a] px-5 py-3.5 text-[13px] font-medium text-white hover:bg-[#2d2d2d] transition-colors shadow-lg shadow-black/10"
            >
              Request an invitation
              <ChevronRight className="h-4 w-4" aria-hidden />
            </a>
            <p className="text-center text-[11px] text-[#a39e95]">
              Include name · partner preference if any · estimated playing level
            </p>
          </aside>
        </div>

        <div className="mt-14 pt-10 border-t border-[#e8e5df] text-center">
          <Link
            href="/book"
            className="inline-flex items-center gap-1.5 text-[12px] text-[#8a8477] hover:text-[#1a1a1a] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to booking
          </Link>
        </div>
      </main>

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
