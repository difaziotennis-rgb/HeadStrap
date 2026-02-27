"use client";

import { MapData, PlayerState } from "@/lib/game/state/gameTypes";
import { NpcCharacter } from "@/lib/game/state/gameTypes";

type Props = {
  map: MapData;
  player: PlayerState;
  npcs: NpcCharacter[];
};

const BASE_TILE_CLASSES: Record<string, string> = {
  ground: "bg-[linear-gradient(180deg,#71b95a_0%,#4a8f3a_100%)]",
  wall: "bg-[linear-gradient(180deg,#9ca3af_0%,#4b5563_100%)]",
  grass: "bg-[linear-gradient(180deg,#88c85b_0%,#4e9438_100%)]",
  water: "bg-[linear-gradient(180deg,#6ec2f4_0%,#2f7fd8_100%)]",
  portal: "bg-[linear-gradient(180deg,#7c8596_0%,#4b5563_100%)]",
  tree: "bg-[linear-gradient(180deg,#6db34f_0%,#3e7e31_100%)]",
  bush: "bg-[linear-gradient(180deg,#7ab44d_0%,#4a812e_100%)]",
  path: "bg-[linear-gradient(180deg,#d0b07b_0%,#a87f4d_100%)]",
  short_grass: "bg-[linear-gradient(180deg,#98d763_0%,#5ea23e_100%)]",
  tall_grass: "bg-[linear-gradient(180deg,#7fbe55_0%,#4f8a34_100%)]",
  bridge: "bg-[linear-gradient(180deg,#c59352_0%,#996432_100%)]",
};

export function WorldCanvas({ map, player, npcs }: Props) {
  const viewportW = 18;
  const viewportH = 13;
  const startX = Math.max(0, Math.min(player.x - Math.floor(viewportW / 2), map.width - viewportW));
  const startY = Math.max(0, Math.min(player.y - Math.floor(viewportH / 2), map.height - viewportH));
  const npcIndex = Object.fromEntries(npcs.map((npc) => [`${npc.x}_${npc.y}`, npc]));

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
    const npc = npcIndex[`${x}_${y}`];
    const seed = Math.abs((x * 92821 + y * 68917 + 17) % 1000);
    const northKind = map.tiles[Math.max(0, y - 1) * map.width + x]?.kind;
    const westKind = map.tiles[y * map.width + Math.max(0, x - 1)]?.kind;
    const eastKind = map.tiles[y * map.width + Math.min(map.width - 1, x + 1)]?.kind;
    return (
      <div
        key={`${x}_${y}`}
        className={`relative h-5 w-5 overflow-visible sm:h-6 sm:w-6 ${BASE_TILE_CLASSES[tile.kind]}`}
      >
        {tile.kind === "ground" || tile.kind === "grass" || tile.kind === "short_grass" || tile.kind === "tall_grass" ? (
          <>
            <span className="absolute inset-x-0 bottom-0 h-1 bg-emerald-950/20" />
            {seed % 6 === 0 ? <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-yellow-200/85" /> : null}
            {seed % 10 === 0 ? <span className="absolute right-1 top-2 h-1 w-1 rounded-full bg-pink-200/80" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-0 h-3 w-1 bg-lime-900/40" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-2 h-2 w-1 bg-lime-900/40 [animation-delay:180ms]" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 right-0 h-3 w-1 bg-lime-900/40 [animation-delay:360ms]" /> : null}
          </>
        ) : null}
        {tile.kind === "water" ? (
          <>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_40%)]" />
            <span className="absolute inset-x-1 top-1 h-0.5 rounded-full bg-cyan-100/70 animate-water-shimmer" />
            <span className="absolute inset-x-2 top-3 h-0.5 rounded-full bg-blue-100/50 animate-water-shimmer [animation-delay:300ms]" />
          </>
        ) : null}
        {tile.kind === "path" ? (
          <>
            <span className="absolute inset-x-0 bottom-0 h-1 bg-amber-900/20" />
            {seed % 4 === 0 ? <span className="absolute left-1 top-2 h-0.5 w-0.5 rounded-full bg-amber-950/40" /> : null}
          </>
        ) : null}
        {tile.kind === "bridge" ? (
          <>
            <span className="absolute inset-x-0 top-1 h-0.5 bg-amber-200/35" />
            <span className="absolute inset-x-0 top-3 h-0.5 bg-amber-950/40" />
          </>
        ) : null}
        {tile.kind === "wall" ? (
          <>
            {northKind !== "wall" ? <span className="absolute inset-x-0 top-0 h-1 bg-slate-300/35" /> : null}
            <span className="absolute inset-x-0 bottom-0 h-1 bg-slate-950/35" />
            {westKind !== "wall" ? <span className="absolute bottom-0 left-0 top-0 w-0.5 bg-slate-300/20" /> : null}
            {eastKind !== "wall" ? <span className="absolute bottom-0 right-0 top-0 w-0.5 bg-slate-950/30" /> : null}
          </>
        ) : null}
        {tile.kind === "bush" ? (
          <>
            <span className="absolute inset-x-0 bottom-0 top-1 rounded-t-full bg-lime-700/90" />
            <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-lime-300/40" />
          </>
        ) : null}
        {tile.kind === "tree" ? (
          <>
            <span className="absolute left-2 top-2 h-3 w-1 rounded bg-amber-900/85" />
            <span className="absolute -left-1 -top-2 h-5 w-7 rounded-full bg-emerald-800/95" />
            <span className="absolute left-0 -top-1 h-3 w-5 rounded-full bg-emerald-600/70" />
            <span className="absolute left-1 top-0 h-1 w-1 rounded-full bg-emerald-300/45" />
          </>
        ) : null}
        {tile.kind === "portal" ? (
          <>
            <span className="absolute inset-x-1 bottom-0 h-4 rounded-t-full bg-slate-950/85" />
            <span className="absolute inset-x-2 top-1 h-1 rounded-full bg-violet-300/60" />
          </>
        ) : null}
        {isPlayer ? (
          <span className="absolute inset-0 z-20">
            <span className="absolute left-2 top-0 h-1 w-1 rounded-full bg-amber-100" />
            <span className={`absolute left-1 top-1 h-3 w-3 rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.9)] ${avatarColor(player.avatarId)}`} />
            <span className="absolute left-1 top-4 h-1 w-1 bg-amber-900" />
            <span className="absolute left-3 top-4 h-1 w-1 bg-amber-900" />
            <span className="absolute -bottom-0 left-1 h-1 w-3 rounded-full bg-slate-950/45" />
          </span>
        ) : null}
        {npc ? (
          <span className="absolute inset-0 z-20">
            <span className="absolute left-2 top-0 h-1 w-1 rounded-full bg-slate-50" />
            <span
              className={`absolute left-1 top-1 h-3 w-3 rounded-sm ${
                npc.role === "trainer" || npc.role === "rival" ? "bg-rose-400" : "bg-cyan-300"
              }`}
            />
            <span className="absolute left-1 top-4 h-1 w-1 bg-slate-900" />
            <span className="absolute left-3 top-4 h-1 w-1 bg-slate-900" />
            <span className="absolute -bottom-0 left-1 h-1 w-3 rounded-full bg-slate-950/40" />
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
          className="retro-screen relative grid w-fit overflow-hidden rounded"
          style={{ gridTemplateColumns: `repeat(${viewportW}, minmax(0, 1fr))` }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(120,201,255,0.28)_0%,rgba(189,245,255,0.08)_34%,transparent_40%)]" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-8 top-1 h-8 w-20 rounded-full bg-white/20 blur-sm" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-16 top-4 h-7 w-16 rounded-full bg-white/15 blur-sm [animation-delay:2000ms]" />
          {tiles}
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_64%,rgba(5,8,20,0.18)_100%)]" />
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-400">
        <span className="retro-chip">Tall grass = encounters</span>
        <span className="retro-chip">Tunnel tiles = portals</span>
        <span className="retro-chip">Red NPC = trainer battle</span>
        <span className="retro-chip">Arrows / WASD</span>
      </div>
    </div>
  );
}

function avatarColor(avatarId: string) {
  if (avatarId === "blaze") return "bg-orange-300";
  if (avatarId === "shadow") return "bg-violet-300";
  if (avatarId === "wave") return "bg-sky-300";
  return "bg-amber-300";
}
