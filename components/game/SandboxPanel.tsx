"use client";

import { MAP_INDEX } from "@/lib/game/data/maps";
import { SPECIES_LIST } from "@/lib/game/data/monsters";

type Props = {
  enabled: boolean;
  encounterId: string | null;
  onToggle: () => void;
  onSetEncounter: (speciesId: string | null) => void;
  onHeal: () => void;
  onGrantItems: () => void;
  onTeleport: (mapId: string) => void;
  onAddMonster: (speciesId: string, level: number) => void;
};

export function SandboxPanel({
  enabled,
  encounterId,
  onToggle,
  onSetEncounter,
  onHeal,
  onGrantItems,
  onTeleport,
  onAddMonster,
}: Props) {
  return (
    <div className="retro-console p-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-fuchsia-100">Sandbox Mode</h3>
        <button className="pixel-btn rounded bg-fuchsia-700 px-2 py-1 text-xs font-medium" onClick={onToggle} type="button">
          {enabled ? "Disable" : "Enable"}
        </button>
      </div>
      <p className="mt-1 text-xs text-fuchsia-200/80">
        Dev tools for fast iteration. Enabled by default while building.
      </p>

      {enabled ? (
        <div className="mt-3 space-y-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="pixel-btn rounded border border-slate-700 bg-slate-800 px-2 py-2 text-xs" onClick={onHeal} type="button">
              Heal Team
            </button>
            <button className="pixel-btn rounded border border-slate-700 bg-slate-800 px-2 py-2 text-xs" onClick={onGrantItems} type="button">
              Grant Items
            </button>
          </div>

          <div>
            <p className="mb-1 text-xs text-fuchsia-100">Teleport</p>
            <div className="flex flex-wrap gap-2">
              {Object.values(MAP_INDEX).map((map) => (
                <button
                  className="pixel-btn rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
                  key={map.id}
                  onClick={() => onTeleport(map.id)}
                  type="button"
                >
                  {map.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-fuchsia-100" htmlFor="encounter-select">
              Force next encounter
            </label>
            <select
              className="mt-1 w-full rounded border border-slate-700 bg-slate-900 p-2 text-xs"
              id="encounter-select"
              onChange={(event) => onSetEncounter(event.target.value || null)}
              value={encounterId ?? ""}
            >
              <option value="">Off</option>
              {SPECIES_LIST.slice(0, 20).map((species) => (
                <option key={species.id} value={species.id}>
                  {species.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <p className="mb-1 text-xs text-fuchsia-100">Add monster</p>
            <div className="grid grid-cols-2 gap-2">
              {SPECIES_LIST.slice(0, 10).map((species) => (
                <button
                  className="pixel-btn rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
                  key={`add_${species.id}`}
                  onClick={() => onAddMonster(species.id, 8)}
                  type="button"
                >
                  + {species.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
