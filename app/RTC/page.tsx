import Image from "next/image";
import Link from "next/link";
import OverviewEnhancements from "./OverviewEnhancements";
import TodaySnapshots from "./TodaySnapshots";
import { rtcSummerEvents } from "./rtc-data";

const memberLinks = [
  {
    title: "Portal",
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
  {
    title: "Membership",
    detail: "Review benefits, pricing, and how it works.",
    href: "/RTC/member",
  },
];

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function RTCPage() {
  const today = new Date();
  const todayDateParam = formatDateInput(today);
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
                href="/RTC/member"
                className="rounded-lg border border-white/50 bg-white/90 px-4 py-2 text-[#1a1a1a] hover:bg-white"
              >
                Explore Membership
              </Link>
              <Link href="/RTC/member/portal" className="rounded-lg border border-white/50 bg-white/90 px-4 py-2 text-[#1a1a1a] hover:bg-white">
                Member Portal
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-5 sm:p-6">
            <TodaySnapshots todayDateParam={todayDateParam} />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <OverviewEnhancements />

        <details id="plan-day" className="mb-4 rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8 scroll-mt-28">
          <summary className="cursor-pointer list-none">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Plan Your Visit</p>
            <h3 className="mt-1 text-[24px] font-semibold tracking-tight">Choose where to start.</h3>
            <p className="mt-1 text-[13px] text-[#6b665e]">Tap to expand quick links for portal access, courts, lessons, clinics, and membership.</p>
          </summary>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {memberLinks.map((item) => (
              <Link key={item.title} href={item.href} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 transition-colors hover:bg-white">
                <p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8477]">{item.title}</p>
                <p className="mt-1 text-[17px] font-semibold">{item.title === "Portal" ? "Open your booking portal" : item.title === "Court Booking" ? "Book a court in seconds" : item.title === "Private Lessons" ? "Train with expert coaches" : item.title === "Clinics" ? "Join group programs" : "Review benefits and pricing"}</p>
                <p className="mt-1 text-[13px] text-[#6b665e]">{item.detail}</p>
              </Link>
            ))}
          </div>
        </details>

        <div id="this-month" className="scroll-mt-28">
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
        </div>
      </section>
    </main>
  );
}
