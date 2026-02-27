"use client";

import { PixelSprite } from "@/components/game/PixelSprite";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { MonsterInstance } from "@/lib/game/state/gameTypes";

type Props = {
  party: MonsterInstance[];
  storageCount: number;
  onMakeLead: (index: number) => void;
};

export function TeamPanel({ party, storageCount, onMakeLead }: Props) {
  return (
    <div className="retro-console p-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-100">Team</h3>
      <div className="mt-2 space-y-2">
        {party.map((member, index) => {
          const species = SPECIES_INDEX[member.speciesId];
          const hpPct = Math.round((member.currentHp / Math.max(member.maxHp, 1)) * 100);
          return (
            <div key={member.uid} className="pixel-card rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <PixelSprite seed={`team_${member.speciesId}_${index}`} size={32} tone={index === 0 ? "ally" : "enemy"} />
                  <div>
                    <p className="text-sm font-medium text-slate-100">{species.name}</p>
                    <p className="text-xs text-slate-300">
                      Lv {member.level} • {species.type}
                    </p>
                  </div>
                </div>
                <div>
                  {index > 0 ? (
                    <button
                      className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs font-medium hover:bg-slate-600"
                      onClick={() => onMakeLead(index)}
                      type="button"
                    >
                      Set Lead
                    </button>
                  ) : (
                    <span className="pixel-btn rounded bg-emerald-700 px-2 py-1 text-xs">Lead</span>
                  )}
                </div>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded bg-slate-800">
                <div
                  className={`h-full ${hpPct > 50 ? "bg-emerald-500" : hpPct > 20 ? "bg-amber-400" : "bg-rose-500"}`}
                  style={{ width: `${hpPct}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-300">
                HP {member.currentHp}/{member.maxHp}
              </p>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-slate-400">Storage monsters: {storageCount}</p>
    </div>
  );
}
