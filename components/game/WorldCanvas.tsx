"use client";

import { MapData, PlayerState } from "@/lib/game/state/gameTypes";

type Props = {
  map: MapData;
  player: PlayerState;
};

const TILE_CLASSES: Record<string, string> = {
  ground: "bg-[linear-gradient(135deg,#14532d_0%,#14532d_50%,#166534_50%,#166534_100%)]",
  wall: "bg-[linear-gradient(135deg,#334155_0%,#334155_50%,#1e293b_50%,#1e293b_100%)]",
  grass: "bg-[linear-gradient(135deg,#65a30d_0%,#65a30d_50%,#4d7c0f_50%,#4d7c0f_100%)]",
  water: "bg-[linear-gradient(135deg,#2563eb_0%,#2563eb_50%,#1d4ed8_50%,#1d4ed8_100%)]",
  portal: "bg-[linear-gradient(135deg,#8b5cf6_0%,#8b5cf6_50%,#6d28d9_50%,#6d28d9_100%)]",
};

export function WorldCanvas({ map, player }: Props) {
  const tiles = map.tiles.map((tile, index) => {
    const x = index % map.width;
    const y = Math.floor(index / map.width);
    const isPlayer = x === player.x && y === player.y;
    return (
      <div
        key={`${x}_${y}`}
        className={`relative h-5 w-5 border border-slate-950/55 sm:h-6 sm:w-6 ${TILE_CLASSES[tile.kind]}`}
      >
        {isPlayer ? (
          <span className="absolute inset-0.5 rounded-sm border border-amber-100/70 bg-amber-300 shadow-[0_0_16px_rgba(251,191,36,0.95)]" />
        ) : null}
      </div>
    );
  });

  return (
    <div className="retro-console p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{map.name}</p>
        <p className="text-xs text-slate-400">
          X:{player.x} Y:{player.y}
        </p>
      </div>
      <div className="retro-bezel">
        <div
          className="retro-screen tile-grid relative grid w-fit overflow-hidden rounded"
          style={{ gridTemplateColumns: `repeat(${map.width}, minmax(0, 1fr))` }}
        >
          {tiles}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_55%,rgba(2,6,23,0.45)_100%)]" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
        <span className="retro-chip">Grass = encounters</span>
        <span className="retro-chip">Purple = portals</span>
        <span className="retro-chip">Arrows / WASD</span>
      </div>
    </div>
  );
}
