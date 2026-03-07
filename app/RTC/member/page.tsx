import Link from "next/link";

const membershipBenefits = [
  "Member court rates: indoor $62/hr and outdoor $44/hr (vs public pricing)",
  "Advanced access windows for indoor court booking before public release",
  "Private Member Dashboard access for booking history, upcoming schedule, and account details",
  "Priority enrollment windows for clinics, camps, and high-demand events",
  "Member-only ladders, socials, and seasonal programming opportunities",
  "Flexible billing options (annual pay-in-full or monthly installments)",
];

const membershipTracks = [
  {
    name: "Seasonal Outdoor (May-Oct)",
    pricing: "Individual $1,150 · Couple $1,750 · Family $2,250",
    details:
      "Ideal for players who want long evenings, weekend rhythm, and a full season of outdoor play and club moments.",
  },
  {
    name: "Full Club (Year-Round)",
    pricing: "Individual $2,850 · Couple $4,150 · Family $5,250",
    details:
      "For households and dedicated players who want seamless access across every season, from winter indoor sessions to summer outdoor play.",
  },
  {
    name: "Young Adult (Under 30)",
    pricing: "$1,450 annual",
    details:
      "A streamlined path for younger players building a regular routine while enjoying the same club standards and member access.",
  },
];

const familyAddOns = [
  {
    name: "Spouse / Partner Add-On",
    pricing: "$1,050 annual",
    details:
      "Available with an active primary membership, this add-on extends full member access at a reduced household rate.",
  },
  {
    name: "Children of Member Add-On",
    pricing: "$550 annual per child",
    details:
      "For children of active members, with reduced youth pricing and access to club play, pathways, and age-appropriate programming windows.",
  },
];

const membershipHowItWorks = [
  "Submit your membership inquiry and preferred start date.",
  "Choose the membership track that matches your seasonality and household size.",
  "Add spouse/partner or child memberships during onboarding if needed.",
  "Receive onboarding confirmation and your 3-digit member number.",
  "Sign into the Member Dashboard to manage courts, lessons, clinics, and event bookings.",
  "Book courts, lessons, clinics, and events with member pricing applied.",
];

const membershipAtmosphere = [
  "A club day that feels calm, social, and well-run from first warmup to final point.",
  "Programming that brings familiar faces together while always leaving room to meet someone new.",
  "Thoughtful scheduling and attentive support so your tennis life feels easy, not crowded.",
];

export default function RTCMembershipPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_28px_rgba(26,26,26,0.04)] sm:p-8">
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#8a8477]">Membership</p>
        <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
          Membership at Rhinebeck Tennis Club
        </h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          A Hudson Valley club experience shaped by great play, familiar faces, and effortless days.
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
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">The Club Experience</p>
            <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              {membershipAtmosphere.map((step, idx) => (
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
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <p className="md:col-span-2 text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">
              Family Add-On Options
            </p>
            {familyAddOns.map((option) => (
              <div key={option.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
                <p className="text-[15px] font-semibold">{option.name}</p>
                <p className="mt-1 text-[13px] font-medium text-[#2d5016]">{option.pricing}</p>
                <p className="mt-1 text-[12px] text-[#6b665e]">{option.details}</p>
              </div>
            ))}
          </div>
        </section>

        <details className="mt-4 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">How Membership Works</summary>
          <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
            {membershipHowItWorks.map((step, idx) => (
              <li key={step} className="rounded-lg border border-[#e8e5df] bg-white px-3 py-2">
                <span className="font-medium">{idx + 1}.</span> {step}
              </li>
            ))}
          </ol>
        </details>

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
            Open Member Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
