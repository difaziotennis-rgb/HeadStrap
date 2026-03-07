import Link from "next/link";

const membershipBenefits = [
  "Lower court and clinic pricing across member bookings",
  "Access to the private Portal with schedule management",
  "Priority access to club programming and seasonal events",
  "Member-facing support workflow for booking changes",
];

const membershipTiers = [
  {
    name: "Individual Membership",
    monthly: "$295 / month",
    details: "Best for year-round players focused on court time, lessons, and clinics.",
  },
  {
    name: "Couples Membership",
    monthly: "$465 / month",
    details: "Shared household access with member booking rates for both adults.",
  },
  {
    name: "Family Membership",
    monthly: "$575 / month",
    details: "Designed for active families using courts, junior programs, and events.",
  },
];

const membershipHowItWorks = [
  "Submit your membership inquiry and preferred start date.",
  "Receive onboarding confirmation and your 3-digit member number.",
  "Use your member number to sign into the Portal and manage bookings.",
  "Book courts, lessons, clinics, and events with member pricing applied.",
];

export default function RTCMembershipPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Membership</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Membership Benefits, Pricing, and How It Works
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          Join Rhinebeck Tennis Club for member pricing, streamlined booking, and access to the private Portal.
        </p>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Benefits</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              {membershipBenefits.map((benefit) => (
                <li key={benefit} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                  {benefit}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">How Membership Works</p>
            <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              {membershipHowItWorks.map((step, idx) => (
                <li key={step} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                  <span className="font-medium">{idx + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Membership Pricing</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {membershipTiers.map((tier) => (
              <div key={tier.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
                <p className="text-[16px] font-semibold">{tier.name}</p>
                <p className="mt-1 text-[13px] font-medium text-[#2d5016]">{tier.monthly}</p>
                <p className="mt-1 text-[12px] text-[#6b665e]">{tier.details}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#8a8477]">
            Final pricing and start dates are confirmed during onboarding.
          </p>
        </section>

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href="mailto:difaziotennis@gmail.com?subject=RTC%20Membership%20Inquiry"
            className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]"
          >
            Inquire About Membership
          </a>
          <Link
            href="/RTC/member/portal"
            className="rounded-lg border border-[#d9d5cf] bg-[#faf9f7] px-4 py-2 text-[12px] font-medium hover:bg-white"
          >
            Open Portal
          </Link>
        </div>
      </div>
    </main>
  );
}
