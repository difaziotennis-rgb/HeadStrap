"use client";

import { Facing } from "@/lib/game/state/gameTypes";

type Props = {
  onMove: (facing: Facing) => void;
  onOpenTeam: () => void;
};

export function MobileControls({ onMove, onOpenTeam }: Props) {
  return (
    <div className="retro-console p-3 md:hidden">
      <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-300">Touch controls</p>
      <div className="grid grid-cols-3 gap-2">
        <div />
        <button
          className="pixel-btn rounded-md border border-slate-600 bg-slate-700 p-3 text-sm font-semibold active:scale-95"
          onClick={() => onMove("up")}
          type="button"
        >
          ▲
        </button>
        <div />
        <button
          className="pixel-btn rounded-md border border-slate-600 bg-slate-700 p-3 text-sm font-semibold active:scale-95"
          onClick={() => onMove("left")}
          type="button"
        >
          ◀
        </button>
        <button
          className="pixel-btn rounded-md border border-cyan-500/60 bg-cyan-700 p-3 text-xs font-semibold active:scale-95"
          onClick={() => onOpenTeam()}
          type="button"
        >
          Team
        </button>
        <button
          className="pixel-btn rounded-md border border-slate-600 bg-slate-700 p-3 text-sm font-semibold active:scale-95"
          onClick={() => onMove("right")}
          type="button"
        >
          ▶
        </button>
        <div />
        <button
          className="pixel-btn rounded-md border border-slate-600 bg-slate-700 p-3 text-sm font-semibold active:scale-95"
          onClick={() => onMove("down")}
          type="button"
        >
          ▼
        </button>
        <div />
      </div>
      <p className="mt-3 text-[11px] text-slate-400">Tip: Team button quick-swaps your lead monster.</p>
    </div>
  );
}
