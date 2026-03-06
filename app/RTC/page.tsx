import Image from "next/image";
import Link from "next/link";
import { rtcClinics, rtcCoaches, rtcSummerEvents } from "./rtc-data";

const memberCentral = [
  {
    title: "My Court Reservations",
    detail: "View, manage, and modify upcoming court bookings.",
    href: "/RTC/member/portal",
  },
  {
    title: "My Event Reservations",
    detail: "Keep track of social events and seasonal programming.",
    href: "/RTC/events",
  },
  {
    title: "Private Lessons",
    detail: "Book with your preferred coach and favorite session window.",
    href: "/RTC/lessons",
  },
  {
    title: "Clinics Calendar",
    detail: "Join weekly clinics with member rates and easy checkout.",
    href: "/RTC/clinics",
  },
];

const experiencePillars = [
  {
    title: "Racquets",
    detail: "Book courts, reserve clinics, and build your weekly tennis rhythm.",
    href: "/RTC/book",
  },
  {
    title: "Events",
    detail: "Signature member-guest weekends and polished social programming.",
    href: "/RTC/events",
  },
  {
    title: "Youth & Family",
    detail: "Family-friendly sessions, junior pathways, and supportive instruction.",
    href: "/RTC/clinics",
  },
];

const testimonials = [
  {
    quote:
      "The club has a premium feel while still being warm and welcoming for families. Booking and communication are always smooth.",
    name: "RTC Parent Member",
  },
  {
    quote:
      "Excellent coaching and a beautiful setting. It feels like a private country-club tennis experience without losing community energy.",
    name: "Adult Program Member",
  },
];

export default function RTCPage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white shadow-[0_14px_36px_rgba(26,26,26,0.07)]">
          <div className="relative border-b border-[#f0ede8] p-6 sm:p-10">
            <Image
              src="/images/hudson-valley.png"
              alt="Hudson Valley landscape near Rhinebeck, New York"
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/45 via-black/25 to-black/15" />
            <div className="relative">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/85">Rhinebeck, New York</p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                The Rhinebeck Tennis Club.
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/90">
                A boutique tennis club experience with high-level coaching, beautifully maintained courts,
                family-forward programming, and a warm community culture.
              </p>
            </div>

            <div className="relative mt-7 flex flex-wrap items-center gap-2 text-[12px] font-medium">
              <Link
                href="/RTC/book"
                className="rounded-lg bg-[#1a1a1a]/95 px-4 py-2 text-white shadow-[0_7px_20px_rgba(26,26,26,0.35)] hover:bg-[#2c2c2c]"
              >
                Book Court
              </Link>
              <Link href="/RTC/events" className="rounded-lg border border-white/50 bg-white/90 px-4 py-2 text-[#1a1a1a] hover:bg-white">
                Explore Events
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-5 sm:grid-cols-3 sm:p-6">
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Courts</p>
              <p className="mt-1 text-[22px] font-semibold">6 Total</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">5 outdoor courts and 1 premium indoor court.</p>
            </div>
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Coaching Team</p>
              <p className="mt-1 text-[22px] font-semibold">{rtcCoaches.length} Pros</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Private coaching for juniors, adults, and competitors.</p>
            </div>
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Club Programs</p>
              <p className="mt-1 text-[22px] font-semibold">{rtcClinics.length} Weekly Clinics</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Structured sessions with clear level pathways.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div id="member-central" className="mb-4 grid gap-4 lg:grid-cols-[1.25fr_1fr] scroll-mt-28">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Central</p>
            <h3 className="mt-1 text-[24px] font-semibold tracking-tight">Everything members use most, in one place.</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memberCentral.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
                  <p className="text-[15px] font-semibold">{item.title}</p>
                  <p className="mt-1 text-[13px] text-[#6b665e]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Live Club Snapshot</p>
            <div className="mt-3 space-y-3 text-[13px] text-[#4a4a4a]">
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">Court program active daily</p>
                <p className="mt-1 text-[#6b665e]">Indoor + outdoor play windows with member priority access.</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">{rtcSummerEvents.length} featured summer events</p>
                <p className="mt-1 text-[#6b665e]">Social and competitive events designed for members and families.</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">{rtcCoaches.length} pro coaches on staff</p>
                <p className="mt-1 text-[#6b665e]">Private and group coaching across all experience levels.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="plan-day" className="mb-4 rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8 scroll-mt-28">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Plan My Club Day</p>
          <h3 className="mt-1 text-[24px] font-semibold tracking-tight">Start with your ideal tennis experience.</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/RTC/book" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Court Time</p>
              <p className="mt-1 text-[17px] font-semibold">Book a court in seconds</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Choose date, view the grid, and reserve instantly.</p>
            </Link>
            <Link href="/RTC/lessons" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Private Lessons</p>
              <p className="mt-1 text-[17px] font-semibold">Train with expert coaches</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Pick your coach, time, and focus in one flow.</p>
            </Link>
            <Link href="/RTC/clinics" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics</p>
              <p className="mt-1 text-[17px] font-semibold">Join group programs</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Member/public rates with simple weekly booking.</p>
            </Link>
          </div>
        </div>

        <div id="club-highlights" className="mb-4 rounded-2xl border border-[#e8e5df] bg-white p-6 scroll-mt-28">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Club Experience</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {experiencePillars.map((pillar) => (
              <Link
                key={pillar.title}
                href={pillar.href}
                className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white"
              >
                <h4 className="text-[17px] font-semibold">{pillar.title}</h4>
                <p className="mt-1 text-[13px] text-[#6b665e]">{pillar.detail}</p>
              </Link>
            ))}
          </div>
        </div>

        <div id="this-month" className="grid gap-4 lg:grid-cols-[1.2fr_1fr] scroll-mt-28">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Upcoming Events at RTC</p>
              <Link href="/RTC/events" className="text-[12px] font-medium text-[#6b665e] hover:text-[#1a1a1a]">
                View Full Calendar
              </Link>
            </div>
            <div className="mt-3 grid gap-3">
              {rtcSummerEvents.slice(0, 3).map((event) => (
                <Link
                  key={event.id}
                  href={`/RTC/events/${event.id}`}
                  className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white"
                >
                  <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{event.category}</p>
                  <h4 className="mt-1 text-[17px] font-semibold">{event.title}</h4>
                  <p className="mt-1 text-[13px] text-[#6b665e]">
                    {event.dateLabel} · {event.timeLabel}
                  </p>
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <Link href="/RTC/member/portal" className="block rounded-2xl border border-[#e8e5df] bg-white p-6 hover:bg-[#faf9f7]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Experience</p>
              <h3 className="mt-1 text-[20px] font-semibold">Priority booking, preferred rates, concierge support</h3>
              <p className="mt-2 text-[13px] text-[#6b665e]">
                Access upcoming bookings, event RSVPs, and one-click support from the portal.
              </p>
            </Link>

            <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Social Proof</p>
              <div className="mt-3 space-y-3">
                {testimonials.map((item) => (
                  <div key={item.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
                    <p className="text-[13px] leading-relaxed text-[#4a4a4a]">"{item.quote}"</p>
                    <p className="mt-2 text-[11px] uppercase tracking-[0.1em] text-[#8a8477]">{item.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <p className="text-[13px] text-[#6b665e]">
            Rhinebeck Tennis Club online access includes court reservations, coaching, clinics, events, and a member-first portal.
          </p>
        </div>
      </section>
    </main>
  );
}
