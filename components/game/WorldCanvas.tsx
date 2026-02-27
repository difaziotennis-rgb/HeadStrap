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
  const viewportW = 12;
  const viewportH = 9;
  const startX = Math.max(0, Math.min(player.x - Math.floor(viewportW / 2), map.width - viewportW));
  const startY = Math.max(0, Math.min(player.y - Math.floor(viewportH / 2), map.height - viewportH));

  const visibleTiles = [];
  for (let vy = 0; vy < viewportH; vy += 1) {
    for (let vx = 0; vx < viewportW; vx += 1) {
      const x = startX + vx;
      const y = startY + vy;
      const tile = map.tiles[y * map.width + x];
      visibleTiles.push({ tile, x, y });
    }
  }

  const tiles = visibleTiles.map(({ tile, x, y }) => {
    const isPlayer = x === player.x && y === player.y;
    const detailVariant = (x * 13 + y * 7) % 3;
    return (
      <div
        key={`${x}_${y}`}
        className={`relative h-7 w-7 border border-slate-950/55 sm:h-8 sm:w-8 ${TILE_CLASSES[tile.kind]}`}
      >
        {tile.kind === "grass" ? (
          <span className={`absolute bottom-0 left-1 h-2 w-1 bg-lime-300/60 ${detailVariant === 0 ? "left-2" : ""}`} />
        ) : null}
        {tile.kind === "water" ? (
          <span className="absolute inset-x-1 top-2 h-0.5 bg-cyan-200/60 animate-water-shimmer" />
        ) : null}
        {tile.kind === "wall" ? (
          <span className="absolute inset-x-1 top-1 h-0.5 bg-slate-200/30" />
        ) : null}
        {isPlayer ? (
          <span className="absolute inset-1">
            <span className="absolute left-1 top-0 h-1 w-1 bg-amber-100" />
            <span className="absolute left-0 top-1 h-2 w-3 rounded-sm bg-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.95)]" />
            <span className="absolute left-0 top-3 h-2 w-1 bg-amber-900" />
            <span className="absolute left-2 top-3 h-2 w-1 bg-amber-900" />
          </span>
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
          style={{ gridTemplateColumns: `repeat(${viewportW}, minmax(0, 1fr))` }}
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
