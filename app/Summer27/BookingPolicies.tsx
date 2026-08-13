import { CANCEL_POLICY, WEATHER_POLICY } from "./booking-policy";

/** Quiet policy notes for the bottom of booking pages. */
export function BookingPolicies({
  showWeather = true,
  className = "",
}: {
  showWeather?: boolean;
  className?: string;
}) {
  return (
    <div className={`mt-8 space-y-3 border-t border-[#ece8e2] pt-6 ${className}`}>
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#8a8477]">Policies</p>
      <div className="space-y-2 text-[12px] leading-relaxed text-[#6b665e]">
        <p>
          <span className="font-medium text-[#4a4a4a]">Cancellation. </span>
          {CANCEL_POLICY}
        </p>
        {showWeather && (
          <p>
            <span className="font-medium text-[#4a4a4a]">Weather. </span>
            {WEATHER_POLICY}
          </p>
        )}
      </div>
    </div>
  );
}
