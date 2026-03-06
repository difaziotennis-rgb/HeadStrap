import Link from "next/link";
import { rtcCoaches, rtcClinics } from "./rtc-data";

export default function RTCPage() {
  return (
    <main>
      <section className="mx-auto w-full max-w-6xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10">
        <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
          <p className="mb-3 inline-flex rounded-full bg-[#f0ede8] px-3 py-1 text-[11px] uppercase tracking-[0.12em] text-[#7a756d]">
            Boutique Club in Rhinebeck, NY
          </p>
          <h2 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">
            Five outdoor courts, one indoor court, and a premium tennis experience.
          </h2>
          <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-[#6b665e]">
            This mock is now split into dedicated sections so you can iterate each RTC workflow independently
            without affecting your existing booking experience.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-2 text-[12px] font-medium">
            <Link href="/RTC/book" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-white hover:bg-[#2c2c2c]">
              Book Courts
            </Link>
            <Link href="/RTC/lessons" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-[#faf9f7]">
              View Coaches
            </Link>
            <Link href="/RTC/clinics" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-[#faf9f7]">
              Explore Clinics
            </Link>
            <Link href="/RTC/member" className="rounded-lg border border-[#d9d5cf] px-4 py-2 hover:bg-[#faf9f7]">
              Member Login
            </Link>
            <Link href="/book" className="ml-auto text-[12px] font-medium text-[#7a756d] underline-offset-4 hover:text-[#1a1a1a] hover:underline">
              Back to current booking site
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-10 sm:px-6 sm:pb-14">
        <div className="grid gap-4 md:grid-cols-2">
          <Link href="/RTC/book" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Court Booking</p>
            <h3 className="mt-1 text-[20px] font-semibold">Rates, availability, and booking flow</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Includes public/member pricing model for 1 indoor and 5 outdoor courts.
            </p>
          </Link>

          <Link href="/RTC/lessons" className="rounded-2xl border border-[#e8e5df] bg-white p-6 transition-colors hover:bg-[#faf9f7]">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Private Lessons</p>
            <h3 className="mt-1 text-[20px] font-semibold">{rtcCoaches.length} coach profiles ready to book</h3>
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
            <h3 className="mt-1 text-[20px] font-semibold">Login + member experience preview</h3>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Showcases special benefits, dashboard layout, and member-first value.
            </p>
          </Link>
        </div>
      </section>
    </main>
  );
}
