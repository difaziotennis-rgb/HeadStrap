import Link from "next/link";
import MemberAuth from "../MemberAuth";

export default function RTCMemberPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Member Hub</h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          Public and member experiences share one polished interface, with members receiving priority
          access and preferred pricing.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Benefits</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              <li>Member court pricing for indoor and outdoor bookings</li>
              <li>Early booking window before public release</li>
              <li>Priority waitlist notifications for newly opened slots</li>
              <li>Saved profile and faster recurring lesson setup</li>
            </ul>
          </div>

          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Portal Access</p>
            <div className="mt-3 grid gap-2">
              <p className="text-[13px] text-[#6b665e]">
                Sign in once with your 3-digit member number to stay signed in as you book courts, lessons,
                clinics, and events.
              </p>
              <MemberAuth />
              <Link
                href="/RTC/member/portal"
                className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-center text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
              >
                Access Member Portal
              </Link>
              <p className="text-[11px] text-[#8a8477]">
                Member sign-in is stored on this device for a faster booking experience.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#d9e8d1] bg-[#f4faf1] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#2d5016]">Member Dashboard Preview</p>
          <div className="mt-3 grid gap-2 text-[13px] sm:grid-cols-3">
            <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
              <p className="text-[#7a756d]">Rate Tier</p>
              <p className="font-semibold">RTC Member</p>
            </div>
            <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
              <p className="text-[#7a756d]">Booking Window</p>
              <p className="font-semibold">Priority Open</p>
            </div>
            <div className="rounded-lg border border-[#dbead3] bg-white px-3 py-2">
              <p className="text-[#7a756d]">Saved Preference</p>
              <p className="font-semibold">Indoor + Clinics</p>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Concierge Support</p>
          <p className="mt-2 text-[13px] text-[#6b665e]">
            Need to modify a booking, event RSVP, or clinic enrollment? Email us and we will update your reservations.
          </p>
          <a
            href="mailto:difaziotennis@gmail.com?subject=RTC%20Member%20Portal%20Support"
            className="mt-3 inline-block rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium hover:bg-[#faf9f7]"
          >
            Contact Member Concierge
          </a>
        </div>
      </div>
    </main>
  );
}
