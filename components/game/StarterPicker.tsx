"use client";

import { STARTER_IDS, SPECIES_INDEX } from "@/lib/game/data/monsters";

type Props = {
  onChoose: (speciesId: string) => void;
};

export function StarterPicker({ onChoose }: Props) {
  return (
    <div className="retro-console p-4">
      <h2 className="text-lg font-semibold text-amber-100">Choose your starter</h2>
      <p className="mt-1 text-sm text-amber-200/90">Pick one to begin your sandbox campaign.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        {STARTER_IDS.map((id) => {
          const species = SPECIES_INDEX[id];
          return (
            <button
              className="pixel-btn rounded-lg border border-amber-700 bg-amber-900/30 p-3 text-left transition hover:-translate-y-0.5 hover:bg-amber-900/50"
              key={id}
              onClick={() => onChoose(id)}
              type="button"
            >
              <p className="font-semibold text-amber-100">{species.name}</p>
              <p className="text-xs text-amber-200">Type: {species.type}</p>
              <p className="mt-2 text-xs text-amber-300">Balanced starter at Lv 5</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
