import { COURT_SHEET_HOURS, COURT_SLOT_HOURS, formatHour, hoursOverlap } from "./summer27-data";

export const SHEET_ROW_SIZE = "1.35rem";
export const SHEET_ROW_COUNT = COURT_SHEET_HOURS.length;
export const SHEET_ROWS = `repeat(${SHEET_ROW_COUNT}, ${SHEET_ROW_SIZE})`;
export const SHEET_HEIGHT = `calc(${SHEET_ROW_COUNT} * ${SHEET_ROW_SIZE})`;

export function isOnTheHour(hour: number) {
  return Math.round(hour * 60) % 60 === 0;
}

export function sheetLineClass(hour: number) {
  return isOnTheHour(hour) ? "border-[#e4dfd6]" : "border-[#f3f0ea]";
}

export function sheetRowIndex(hour: number) {
  const exact = COURT_SHEET_HOURS.findIndex((h) => Math.abs(h - hour) < 0.01);
  if (exact >= 0) return exact;
  const next = COURT_SHEET_HOURS.findIndex((h) => h > hour - 1e-9);
  return next < 0 ? COURT_SHEET_HOURS.length - 1 : Math.max(0, next);
}

export function sheetRowSpan(start: number, durationHours: number) {
  const dur = durationHours > 0 ? durationHours : COURT_SLOT_HOURS;
  return Math.max(1, COURT_SHEET_HOURS.filter((h) => hoursOverlap(start, dur, h)).length);
}

const rowStyle = (i: number) => ({ gridRow: i + 1, minHeight: SHEET_ROW_SIZE, height: SHEET_ROW_SIZE });

export function SheetTimeColumn() {
  return (
    <div
      className="sticky left-0 z-10 grid border-r border-[#ece8e2] bg-white"
      style={{ gridTemplateRows: SHEET_ROWS, height: SHEET_HEIGHT, minHeight: SHEET_HEIGHT }}
    >
      {COURT_SHEET_HOURS.map((hour, i) => (
        <div
          key={hour}
          className={`relative box-border border-b px-1 pt-0.5 last:border-b-0 sm:px-1.5 ${sheetLineClass(hour)}`}
          style={rowStyle(i)}
        >
          {isOnTheHour(hour) ? (
            <span className="text-[10px] tabular-nums leading-none text-[#6b665e] sm:text-[11px]">
              {formatHour(hour).replace(":00 ", " ")}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Half-hour row lines — same weight as the public court sheet. */
export function SheetHourLines() {
  return (
    <>
      {COURT_SHEET_HOURS.map((hour, i) => (
        <div
          key={hour}
          className={`pointer-events-none relative z-0 box-border border-b last:border-b-0 ${sheetLineClass(hour)}`}
          style={{ ...rowStyle(i), gridColumn: "1 / -1" }}
        />
      ))}
    </>
  );
}
