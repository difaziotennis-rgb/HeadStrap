import { rtcClinics } from "../rtc-data";

export default function RTCClinicsPage() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-[#e8e5df] bg-white p-6 sm:p-8">
        <h2 className="text-2xl font-semibold tracking-tight">Clinics</h2>
        <p className="mt-2 text-[14px] text-[#6b665e]">
          Easy clinic enrollment for public players and members with transparent member pricing.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {rtcClinics.map((clinic) => (
            <article key={clinic.name} className="rounded-xl border border-[#ece8e2] bg-[#faf9f7] p-4">
              <h3 className="text-[16px] font-semibold">{clinic.name}</h3>
              <p className="mt-1 text-[12px] text-[#7a756d]">{clinic.schedule}</p>
              <p className="mt-1 text-[12px] text-[#7a756d]">Level: {clinic.level}</p>
              <p className="mt-3 text-[13px]">
                <span className="font-medium text-[#2d5016]">{clinic.memberPrice} member</span>
                <span className="text-[#8a8477]"> · </span>
                <span>{clinic.publicPrice} public</span>
              </p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-xl border border-[#ece8e2] p-4">
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#8a8477]">Clinic Signup (Mock)</p>
          <div className="mt-3 grid gap-2 md:grid-cols-4">
            <input placeholder="Full name" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <input placeholder="Email" className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]" />
            <select className="rounded-lg border border-[#e8e5df] px-3 py-2 text-[13px]">
              {rtcClinics.map((clinic) => (
                <option key={clinic.name}>{clinic.name}</option>
              ))}
            </select>
            <button type="button" className="rounded-lg bg-[#1a1a1a] px-4 py-2 text-[12px] font-medium text-white hover:bg-[#2c2c2c]">
              Join Clinic
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
