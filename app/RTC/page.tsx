import Link from "next/link";
import { rtcCoaches, rtcClinics } from "./rtc-data";

export default function RTCPage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="overflow-hidden rounded-2xl border border-[#e8e5df] bg-white">
          <div className="border-b border-[#f0ede8] bg-gradient-to-br from-[#fdfcf9] via-white to-[#f3f0ea] p-6 sm:p-10">
            <p className="mb-3 inline-flex rounded-full border border-[#e2ddd3] bg-white px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#7a756d]">
              Rhinebeck, New York
            </p>
            <h2 className="max-w-4xl text-3xl font-semibold tracking-tight sm:text-5xl">
              A beautiful, family-friendly country club tennis experience.
            </h2>
            <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#6b665e]">
              Rhinebeck Tennis Club offers elevated tennis programming across five outdoor courts and one indoor court,
              with thoughtful coaching, organized clinics, and a welcoming social atmosphere for players of all ages.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] font-medium">
              <Link href="/RTC/book" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-white hover:bg-[#2c2c2c]">
                Reserve Court Time
              </Link>
              <Link href="/RTC/lessons" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-white">
                Private Lessons
              </Link>
              <Link href="/RTC/clinics" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-white">
                Clinics & Programs
              </Link>
              <Link href="/RTC/member" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-white">
                Member Services
              </Link>
            </div>
          </div>

          <div className="grid gap-3 bg-[#faf9f7] p-5 sm:grid-cols-3 sm:p-6">
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Courts</p>
              <p className="mt-1 text-[20px] font-semibold">6 Total</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">5 outdoor courts and 1 premium indoor court</p>
            </div>
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Coaching Team</p>
              <p className="mt-1 text-[20px] font-semibold">{rtcCoaches.length} Pros</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Private coaching for juniors, adults, and competitors</p>
            </div>
            <div className="rounded-xl border border-[#e8e5df] bg-white p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Club Programs</p>
              <p className="mt-1 text-[20px] font-semibold">{rtcClinics.length} Weekly Clinics</p>
              <p className="mt-1 text-[13px] text-[#6b665e]">Structured sessions with clear level pathways</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="mb-4 rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">The Club Experience</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <h3 className="text-[16px] font-semibold">Elegant Facilities</h3>
              <p className="mt-2 text-[13px] text-[#6b665e]">
                Clean, boutique club setting with intentional programming and seasonal court access.
              </p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <h3 className="text-[16px] font-semibold">Family-Friendly Culture</h3>
              <p className="mt-2 text-[13px] text-[#6b665e]">
                Junior development, adult clinics, and supportive coaching for every stage of play.
              </p>
            </div>
            <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <h3 className="text-[16px] font-semibold">Member-First Benefits</h3>
              <p className="mt-2 text-[13px] text-[#6b665e]">
                Preferred pricing, priority booking access, and streamlined recurring scheduling.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/RTC/book" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Court Booking</p>
            <h3 className="mt-1 text-[20px] font-semibold">Reserve indoor and outdoor court time</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Includes public/member pricing model for 1 indoor and 5 outdoor courts.
            </p>
          </Link>

          <Link href="/RTC/lessons" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Private Lessons</p>
            <h3 className="mt-1 text-[20px] font-semibold">{rtcCoaches.length} coach profiles available</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Structured lesson pages with rates and coach-focused request actions.
            </p>
          </Link>

          <Link href="/RTC/clinics" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinics</p>
            <h3 className="mt-1 text-[20px] font-semibold">{rtcClinics.length} clinic tracks with signup</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Public/member pricing and clean sign-up interface for easy enrollment.
            </p>
          </Link>

          <Link href="/RTC/member" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Hub</p>
            <h3 className="mt-1 text-[20px] font-semibold">Login and member experience</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Showcases special benefits, dashboard layout, and member-first value.
            </p>
          </Link>
        </div>

        <div className="mt-4 rounded-2xl border border-[#e8e5df] bg-white p-5">
          <p className="text-[13px] text-[#6b665e]">
            Rhinebeck Tennis Club online access includes court reservations, lessons, clinics, and member services.
          </p>
        </div>
      </section>
    </main>
  );
}
