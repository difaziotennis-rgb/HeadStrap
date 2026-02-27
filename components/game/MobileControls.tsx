"use client";

import { useEffect, useRef } from "react";
import { Facing } from "@/lib/game/state/gameTypes";

type Props = {
  onMove: (facing: Facing) => void;
  onOpenTeam: () => void;
};

export function MobileControls({ onMove, onOpenTeam }: Props) {
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHold = (facing: Facing) => {
    onMove(facing);
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = setInterval(() => onMove(facing), 45);
  };

  const stopHold = () => {
    if (holdRef.current) {
      clearInterval(holdRef.current);
      holdRef.current = null;
    }
  };

  useEffect(() => stopHold, []);

  const holdHandlers = (facing: Facing) => ({
    onTouchStart: () => startHold(facing),
    onTouchEnd: stopHold,
    onMouseDown: () => startHold(facing),
    onMouseUp: stopHold,
    onMouseLeave: stopHold,
  });

  return (
    <div className="retro-console p-3 md:hidden">
      <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-300">Touch controls</p>
      <p className="mb-3 text-[11px] text-slate-400">Hold arrows to move smoothly.</p>
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          className="pixel-btn min-h-12 rounded-md border border-slate-600 bg-slate-700 p-3 text-base font-bold active:scale-95"
          {...holdHandlers("up")}
          type="button"
        >
          ▲
        </button>
        <div />
        <button
          className="pixel-btn min-h-12 rounded-md border border-slate-600 bg-slate-700 p-3 text-base font-bold active:scale-95"
          {...holdHandlers("left")}
          type="button"
        >
          ◀
        </button>
        <button
          className="pixel-btn min-h-12 rounded-md border border-cyan-500/60 bg-cyan-700 p-3 text-xs font-semibold active:scale-95"
          onClick={() => onOpenTeam()}
          type="button"
        >
          Team Swap
        </button>
        <button
          className="pixel-btn min-h-12 rounded-md border border-slate-600 bg-slate-700 p-3 text-base font-bold active:scale-95"
          {...holdHandlers("right")}
          type="button"
        >
          ▶
        </button>
        <div />
        <button
          className="pixel-btn min-h-12 rounded-md border border-slate-600 bg-slate-700 p-3 text-base font-bold active:scale-95"
          {...holdHandlers("down")}
          type="button"
        >
          ▼
        </button>
        <div />
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Tip: Team Swap promotes your next healthy monster.</p>
    </div>
  );
}
