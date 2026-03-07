import Link from "next/link";

const membershipBenefits = [
  "Member court rates: indoor $62/hr and outdoor $44/hr (vs public pricing)",
  "Private Portal access for booking history, upcoming schedule, and account details",
  "Priority enrollment windows for clinics, camps, and high-demand events",
  "Member-only ladders, socials, and seasonal programming opportunities",
  "Flexible billing options (annual pay-in-full or monthly installments)",
];

const membershipTracks = [
  {
    name: "Seasonal Outdoor (May-Oct)",
    pricing: "Individual $1,150 · Couple $1,750 · Family $2,250",
    details:
      "Best for summer/fall players who want consistent outdoor court access and club programming without a full-year commitment.",
  },
  {
    name: "Full Club (Year-Round)",
    pricing: "Individual $2,850 · Couple $4,150 · Family $5,250",
    details:
      "For members who play across all seasons and want the full indoor/outdoor club experience with premium scheduling flexibility.",
  },
  {
    name: "Young Adult (Under 30)",
    pricing: "$1,450 annual",
    details:
      "A lower-entry tier for younger players in the Hudson Valley market while still including core member pricing and portal access.",
  },
];

const membershipHowItWorks = [
  "Submit your membership inquiry and preferred start date.",
  "Choose the membership track that matches your seasonality and household size.",
  "Receive onboarding confirmation and your 3-digit member number.",
  "Sign into the Portal to manage courts, lessons, clinics, and event bookings.",
  "Book courts, lessons, clinics, and events with member pricing applied.",
];

const regionalRationale = [
  "Rhinebeck median household income is roughly mid-$70k, while Dutchess County is near upper-$90k, so pricing needs both entry and premium paths.",
  "Hudson Valley club benchmarks commonly show seasonal dues in the ~$700-$1,500 range for trial-level access and higher rates for broader year-round use.",
  "A seasonal plus full-year structure matches local play patterns: heavy outdoor demand in warm months and selective indoor demand in colder months.",
];

export default function RTCMembershipPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Membership</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Membership That Fits Rhinebeck and the Hudson Valley
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          Structured with local household economics and nearby club patterns in mind, so members have an accessible way in and a strong full-club option.
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Why This Structure Makes Sense</p>
            <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              {regionalRationale.map((step, idx) => (
                <li key={step} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                  <span className="font-medium">{idx + 1}.</span> {step}
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="mt-4 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Membership Tracks + Pricing</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {membershipTracks.map((tier) => (
              <div key={tier.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
                <p className="text-[16px] font-semibold">{tier.name}</p>
                <p className="mt-1 text-[13px] font-medium text-[#2d5016]">{tier.pricing}</p>
                <p className="mt-1 text-[12px] text-[#6b665e]">{tier.details}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[12px] text-[#8a8477]">
            Rates are reviewed annually against Hudson Valley market conditions and final details are confirmed at onboarding.
          </p>
        </section>

        <section className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">How Membership Works</p>
          <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
            {membershipHowItWorks.map((step, idx) => (
              <li key={step} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                <span className="font-medium">{idx + 1}.</span> {step}
              </li>
            ))}
          </ol>
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
