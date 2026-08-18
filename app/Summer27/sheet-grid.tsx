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

export type TimedBlock = { time: number; durationHours: number };

/** Side-by-side columns for overlapping blocks in one lane. */
export function packOverlaps<T extends TimedBlock>(items: T[]): Array<{ item: T; col: number; cols: number }> {
  const sorted = items
    .map((item, i) => ({
      item,
      i,
      start: Number(item.time) || 0,
      end: (Number(item.time) || 0) + Math.max(COURT_SLOT_HOURS, Number(item.durationHours) || COURT_SLOT_HOURS),
    }))
    .sort((a, b) => a.start - b.start || b.end - a.end || a.i - b.i);

  const colEnd: number[] = [];
  const colOf: number[] = sorted.map(() => 0);

  sorted.forEach((row, idx) => {
    let col = 0;
    while (col < colEnd.length && colEnd[col] > row.start + 1e-9) col += 1;
    if (col === colEnd.length) colEnd.push(row.end);
    else colEnd[col] = row.end;
    colOf[idx] = col;
  });

  const parent = sorted.map((_, i) => i);
  const find = (x: number): number => (parent[x] === x ? x : (parent[x] = find(parent[x])));
  sorted.forEach((a, i) => {
    for (let j = i + 1; j < sorted.length; j++) {
      const b = sorted[j];
      if (b.start >= a.end - 1e-9) break;
      if (a.start < b.end && b.start < a.end) {
        parent[find(i)] = find(j);
      }
    }
  });

  const clusterCols = new Map<number, number>();
  sorted.forEach((_, i) => {
    const root = find(i);
    clusterCols.set(root, Math.max(clusterCols.get(root) || 1, colOf[i] + 1));
  });

  return sorted.map((row, i) => ({
    item: row.item,
    col: colOf[i],
    cols: Math.max(1, clusterCols.get(find(i)) || 1),
  }));
}

export function sheetBlockStyle(time: number, durationHours: number, leftPct: number, widthPct: number) {
  const row = sheetRowIndex(time);
  const span = sheetRowSpan(time, durationHours);
  const gap = 1;
  return {
    top: `calc(${row} * ${SHEET_ROW_SIZE})`,
    height: `calc(${span} * ${SHEET_ROW_SIZE})`,
    left: `calc(${leftPct}% + ${gap}px)`,
    width: `calc(${widthPct}% - ${gap * 2}px)`,
  };
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
          className={`relative box-border border-t ${sheetLineClass(hour)}`}
          style={rowStyle(i)}
        >
          {isOnTheHour(hour) ? (
            <span className="absolute left-1 top-0 -translate-y-1/2 text-[10px] tabular-nums leading-none text-[#6b665e] sm:left-1.5 sm:text-[11px]">
              {formatHour(hour).replace(":00 ", " ")}
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

/** Half-hour row lines — hour labels sit on the hour line they mark. */
export function SheetHourLines() {
  return (
    <>
      {COURT_SHEET_HOURS.map((hour, i) => (
        <div
          key={hour}
          className={`pointer-events-none relative z-0 box-border border-t ${sheetLineClass(hour)}`}
          style={{ ...rowStyle(i), gridColumn: "1 / -1" }}
        />
      ))}
    </>
  );
}
