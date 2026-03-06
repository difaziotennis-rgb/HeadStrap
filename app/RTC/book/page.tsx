import { rtcSampleSlots } from "../rtc-data";

export default function RTCBookPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Court Booking</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">
          14-day booking window with member priority access. 72-hour cancellation policy.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Public Pricing</p>
            <div className="mt-3 space-y-2 text-[14px]">
              <div className="flex items-center justify-between">
                <span>Indoor Court (1)</span>
                <strong>$74 / hour</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Outdoor Courts (5)</span>
                <strong>$58 / hour</strong>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
            <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Member Pricing</p>
            <div className="mt-3 space-y-2 text-[14px]">
              <div className="flex items-center justify-between">
                <span>Indoor Court (1)</span>
                <strong>$62 / hour</strong>
              </div>
              <div className="flex items-center justify-between">
                <span>Outdoor Courts (5)</span>
                <strong>$44 / hour</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Quick Reserve Request</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
            <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              <option>Indoor Court</option>
              <option>Outdoor Court</option>
            </select>
            <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              <option>This Week</option>
              <option>Next Week</option>
            </select>
            <input
              placeholder="Email"
              className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]"
            />
            <button type="button" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
              Request Court Time
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Sample Open Slots</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {rtcSampleSlots.map((slot) => (
              <div
                key={`${slot.court}-${slot.time}`}
                className="flex items-center justify-between rounded-lg border border-[#f0ede8] px-3 py-2 text-[13px]"
              >
                <div>
                  <p className="font-medium">{slot.court}</p>
                  <p className="text-[#7a756d]">{slot.time}</p>
                </div>
                <button type="button" className="rounded-md border border-[#d9d5cf] px-2.5 py-1 text-[11px] font-medium hover:bg-[#faf9f7]">
                  Select
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
