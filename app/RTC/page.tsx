import Image from "next/image";
import Link from "next/link";
import OverviewEnhancements from "./OverviewEnhancements";
import { rtcSummerEvents } from "./rtc-data";

const memberLinks = [
  {
    title: "Member Portal",
    detail: "View and manage your upcoming bookings.",
    href: "/RTC/member/portal",
  },
  {
    title: "Court Booking",
    detail: "Open the full court schedule and reserve a time.",
    href: "/RTC/book",
  },
  {
    title: "Private Lessons",
    detail: "Book a private lesson with your preferred coach.",
    href: "/RTC/lessons",
  },
  {
    title: "Clinics",
    detail: "Join weekly group sessions.",
    href: "/RTC/clinics",
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
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/85">Hudson Valley, New York</p>
              <h2 className="mt-2 max-w-4xl text-3xl font-semibold tracking-tight text-white sm:text-5xl">
                The Rhinebeck Tennis Club.
              </h2>
              <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-white/90">
                A calm, member-first tennis experience with court booking, lessons, clinics, and seasonal events.
              </p>
            </div>

            <div className="relative mt-7 flex flex-wrap items-center gap-2 text-[12px] font-medium">
              <Link
                href="/RTC/book"
                className="rounded-lg border border-white/50 bg-white/90 px-4 py-2 text-[#1a1a1a] hover:bg-white"
              >
                Book Court
              </Link>
              <Link href="/RTC/events" className="rounded-lg border border-white/50 bg-white/90 px-4 py-2 text-[#1a1a1a] hover:bg-white">
                Explore Events
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-5 sm:grid-cols-3 sm:p-6">
            <Link href="/RTC/book" className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)] transition-colors hover:bg-[#faf9f7]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Court Booking</p>
              <p className="mt-1 text-[16px] font-semibold">See daily availability</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Simple court grid with fast booking and payment.</p>
            </Link>
            <Link href="/RTC/lessons" className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)] transition-colors hover:bg-[#faf9f7]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Private Lessons</p>
              <p className="mt-1 text-[16px] font-semibold">Book one-on-one coaching</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Choose your coach and preferred time window.</p>
            </Link>
            <Link href="/RTC/events" className="rounded-xl border border-[#e8e5df] bg-white p-4 shadow-[0_5px_14px_rgba(26,26,26,0.03)] transition-colors hover:bg-[#faf9f7]">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Events</p>
              <p className="mt-1 text-[16px] font-semibold">View the seasonal calendar</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Club events, social evenings, and family days.</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <OverviewEnhancements />

        <div id="member-central" className="mb-4 grid gap-4 lg:grid-cols-[1.25fr_1fr] scroll-mt-28">
          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Start Here</p>
            <h3 className="mt-1 text-[24px] font-semibold tracking-tight">Use the club online</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {memberLinks.map((item) => (
                <Link key={item.title} href={item.href} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
                  <p className="text-[15px] font-semibold">{item.title}</p>
                  <p className="mt-1 text-[13px] text-[#6b665e]">{item.detail}</p>
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Club Notes</p>
            <div className="mt-3 space-y-3 text-[13px] text-[#4a4a4a]">
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">Indoor and outdoor play</p>
                <p className="mt-1 text-[#6b665e]">Court inventory updates in real time as bookings are made.</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">Program calendar</p>
                <p className="mt-1 text-[#6b665e]">Clinics and events are reflected directly in court availability.</p>
              </div>
              <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-3">
                <p className="font-medium">Member-friendly workflow</p>
                <p className="mt-1 text-[#6b665e]">Sign in once and keep booking across courts, lessons, clinics, and events.</p>
              </div>
            </div>
          </div>
        </div>

        <div id="plan-day" className="mb-4 rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8 scroll-mt-28">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Plan Your Visit</p>
          <h3 className="mt-1 text-[24px] font-semibold tracking-tight">Choose where to start.</h3>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <Link href="/RTC/book" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Court Time</p>
              <p className="mt-1 text-[17px] font-semibold">Book a court in seconds</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Choose date, view the grid, and reserve instantly.</p>
            </Link>
            <Link href="/RTC/lessons" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Private Lessons</p>
              <p className="mt-1 text-[17px] font-semibold">Train with expert coaches</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Pick your coach, time, and focus.</p>
            </Link>
            <Link href="/RTC/clinics" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
              <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics</p>
              <p className="mt-1 text-[17px] font-semibold">Join group programs</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Member/public rates with simple weekly booking.</p>
            </Link>
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
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Portal</p>
              <h3 className="mt-1 text-[20px] font-semibold">Your upcoming schedule in one place</h3>
              <p className="mt-2 text-[13px] text-[#6b665e]">
                View upcoming courts, lessons, clinics, and event RSVPs, plus booking modifications when eligible.
              </p>
            </Link>

            <div className="rounded-2xl border border-[#e8e5df] bg-white p-6">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Quick Access</p>
              <div className="mt-3 grid gap-2">
                <Link href="/RTC/book" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px] hover:bg-white">
                  Open Court Booking
                </Link>
                <Link href="/RTC/lessons" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px] hover:bg-white">
                  Book a Private Lesson
                </Link>
                <Link href="/RTC/clinics" className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] px-3 py-2 text-[13px] hover:bg-white">
                  View Clinic Schedule
                </Link>
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
