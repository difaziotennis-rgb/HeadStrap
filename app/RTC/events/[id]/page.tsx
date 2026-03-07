import Link from "next/link";
import { notFound } from "next/navigation";
import { getRTCEventImage, rtcSummerEvents } from "../../rtc-data";

type PageProps = {
  params: { id: string };
};

function eventMood(category: string): string {
  if (category === "Tournament") return "Signature competitive weekend with elevated social programming.";
  if (category === "Gala") return "Elegant evening format with dinner, awards, and seasonal celebration.";
  if (category === "Family") return "Family-first experience with age-based tennis and relaxed club hospitality.";
  return "Curated tennis-social format designed for a polished, welcoming club atmosphere.";
}

export default function RTCEventDetailPage({ params }: PageProps) {
  const { id } = params;
  const event = rtcSummerEvents.find((item) => item.id === id);
  if (!event) notFound();
  const eventImage = getRTCEventImage(event.id);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 shadow-[0_10px_30px_rgba(26,26,26,0.04)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.16em] text-[#8a8477]">{event.category}</p>
          <span className="rounded-full border border-[#d9d5cf] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[#7a756d]">
            {event.audience}
          </span>
        </div>
        <h2 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{event.title}</h2>
        <p className="mt-3 max-w-3xl text-[14px] leading-relaxed text-[#6b665e]">{event.description}</p>
        <div className="mt-4 overflow-hidden rounded-xl border border-[#ece8e2]">
          <img
            src={eventImage}
            alt={`${event.title} atmosphere`}
            className="h-44 w-full object-cover sm:h-56"
          />
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Date</p>
            <p className="mt-1 text-[14px] font-medium">{event.dateLabel}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Time</p>
            <p className="mt-1 text-[14px] font-medium">{event.timeLabel}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Member Price</p>
            <p className="mt-1 text-[14px] font-medium text-[#2d5016]">{event.priceMember}</p>
          </div>
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4 shadow-[0_6px_18px_rgba(26,26,26,0.03)]">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Public Price</p>
            <p className="mt-1 text-[14px] font-medium">{event.pricePublic}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <section className="rounded-xl border border-[#ece8e2] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Event Experience</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[#6b665e]">{eventMood(event.category)}</p>
            <ul className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
              {event.highlights.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Reserve or Modify</p>
            <p className="mt-2 text-[13px] text-[#6b665e]">
              Reserve directly on the events page, then use member concierge support any time to modify your RSVP.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
              <Link
                href="/RTC/events"
                className="rounded-lg bg-[#1a1a1a] px-3 py-2 text-center text-[12px] font-medium text-white shadow-[0_6px_16px_rgba(26,26,26,0.2)] hover:bg-[#2c2c2c]"
              >
                Reserve Event
              </Link>
              <a
                href={`mailto:difaziotennis@gmail.com?subject=${encodeURIComponent(`RTC Event Update - ${event.title}`)}`}
                className="rounded-lg border border-[#d9d5cf] px-3 py-2 text-center text-[12px] font-medium hover:bg-white"
              >
                Modify RSVP
              </a>
            </div>
          </section>
        </div>

        <div className="mt-6 border-t border-[#f0ede8] pt-4">
          <Link
            href="/RTC/events"
            className="text-[12px] font-medium text-[#6b665e] underline-offset-4 hover:text-[#1a1a1a] hover:underline"
          >
            Back to all summer events
          </Link>
        </div>
      </div>
    </main>
  );
}
