"use client";

import { DAY_SHORT, WEEKDAY_ORDER, formatHour, type ProDayHours, type ProWindow } from "./summer27-data";

const HOUR_OPTIONS = Array.from({ length: 29 }, (_, i) => 7 + i * 0.5);

const inputClass =
  "w-full rounded-lg border border-[#e8e5df] bg-white px-2 py-1.5 text-[13px] text-[#1a1a1a]";

export default function ProHoursEditor({
  value,
  onChange,
}: {
  value: ProDayHours[];
  onChange: (next: ProDayHours[]) => void;
}) {
  function windowsFor(day: number): ProWindow[] {
    return value.find((row) => row.day === day)?.windows || [];
  }

  function setDay(day: number, windows: ProWindow[]) {
    const rest = value.filter((row) => row.day !== day);
    const cleaned = windows.filter((w) => Number(w.end) > Number(w.start));
    onChange(
      cleaned.length
        ? [...rest, { day, windows: cleaned }].sort((a, b) => a.day - b.day)
        : rest.sort((a, b) => a.day - b.day)
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-[#8a8477]">Hours by day</p>
      {WEEKDAY_ORDER.map((day) => {
        const windows = windowsFor(day);
        const on = windows.length > 0;
        return (
          <div
            key={day}
            className={`rounded-xl border px-3 py-2.5 ${
              on ? "border-[#ece8e2] bg-[#faf9f7]" : "border-[#f0ede8] bg-white"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setDay(day, on ? [] : [{ start: 9, end: 12 }])}
                className={`rounded-lg px-2.5 py-1 text-[12px] font-medium ${
                  on ? "bg-[#1a1a1a] text-white" : "border border-[#e8e5df] bg-white text-[#8a8477]"
                }`}
              >
                {DAY_SHORT[day]}
              </button>
              {on ? (
                <button
                  type="button"
                  onClick={() =>
                    setDay(day, [
                      ...windows,
                      {
                        start: Math.min(windows[windows.length - 1]?.end || 15, 19),
                        end: Math.min((windows[windows.length - 1]?.end || 15) + 2, 21),
                      },
                    ])
                  }
                  className="text-[12px] font-medium text-[#1a1a1a]"
                >
                  + Window
                </button>
              ) : (
                <span className="text-[12px] text-[#c4bfb6]">Off</span>
              )}
            </div>
            {on ? (
              <div className="mt-2 space-y-1.5">
                {windows.map((window, i) => (
                  <div key={`${day}-${i}`} className="flex items-center gap-2">
                    <select
                      className={inputClass}
                      value={window.start}
                      onChange={(e) => {
                        const next = windows.map((w, idx) =>
                          idx === i ? { ...w, start: Number(e.target.value) } : w
                        );
                        setDay(day, next);
                      }}
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    <span className="text-[12px] text-[#8a8477]">to</span>
                    <select
                      className={inputClass}
                      value={window.end}
                      onChange={(e) => {
                        const next = windows.map((w, idx) =>
                          idx === i ? { ...w, end: Number(e.target.value) } : w
                        );
                        setDay(day, next);
                      }}
                    >
                      {HOUR_OPTIONS.map((h) => (
                        <option key={h} value={h} disabled={h <= window.start}>
                          {formatHour(h)}
                        </option>
                      ))}
                    </select>
                    {windows.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => setDay(day, windows.filter((_, idx) => idx !== i))}
                        className="shrink-0 text-[12px] text-[#8a8477] hover:text-[#991b1b]"
                        aria-label="Remove window"
                      >
                        ×
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
