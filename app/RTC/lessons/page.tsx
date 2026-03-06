import { rtcCoaches } from "../rtc-data";

export default function RTCLessonsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Private Lessons</h2>
        <p className="mt-2 max-w-3xl text-[14px] text-[#6b665e]">
          Coach matching and private lesson booking are presented as a dedicated RTC flow, using your
          current brand style and clear pricing.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {rtcCoaches.map((coach) => (
            <article key={coach.name} className="rounded-xl border border-[#ece8e2] p-4">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">{coach.role}</p>
              <h3 className="mt-1 text-[18px] font-semibold">{coach.name}</h3>
              <p className="mt-1 text-[12px] font-medium text-[#2d5016]">{coach.rate}</p>
              <p className="mt-3 text-[13px] leading-relaxed text-[#6b665e]">{coach.bio}</p>
              <button type="button" className="mt-4 rounded-lg border border-[#d9d5cf] px-3 py-2 text-[12px] font-medium hover:bg-[#faf9f7]">
                Request Lesson
              </button>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">How It Works</p>
          <ol className="mt-3 space-y-2 text-[13px] text-[#4a4a4a]">
            <li>1. Select your coach and submit your preferred days/times.</li>
            <li>2. Receive confirmation and payment options by email.</li>
            <li>3. Add recurring lessons through the member hub if desired.</li>
          </ol>
        </div>
      </div>
    </main>
  );
}
