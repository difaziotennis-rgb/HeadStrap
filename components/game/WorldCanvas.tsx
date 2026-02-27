"use client";

import { MapData, PlayerState } from "@/lib/game/state/gameTypes";
import { NpcCharacter } from "@/lib/game/state/gameTypes";

type Props = {
  map: MapData;
  player: PlayerState;
  npcs: NpcCharacter[];
};

export function WorldCanvas({ map, player, npcs }: Props) {
  const viewportW = 20;
  const viewportH = 14;
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
    const walkFrame = player.stepCounter % 2;
    const playerFacing = player.facing;
    return (
      <div
        key={`${x}_${y}`}
        className={`tile-art tile-art--${tile.kind} relative h-5 w-5 overflow-visible sm:h-6 sm:w-6`}
      >
        {tile.kind === "ground" || tile.kind === "grass" || tile.kind === "short_grass" || tile.kind === "tall_grass" ? (
          <>
            {seed % 6 === 0 ? <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-yellow-200/85" /> : null}
            {seed % 10 === 0 ? <span className="absolute right-1 top-2 h-1 w-1 rounded-full bg-pink-200/80" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-0 h-3 w-1 bg-lime-900/40" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-2 h-2 w-1 bg-lime-900/40 [animation-delay:180ms]" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 right-0 h-3 w-1 bg-lime-900/40 [animation-delay:360ms]" /> : null}
            {seed % 23 === 0 ? <span className="animate-firefly absolute right-1 top-1 h-1 w-1 rounded-full bg-yellow-100" /> : null}
          </>
        ) : null}
        {tile.kind === "water" ? (
          <>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.22),transparent_40%)]" />
            <span className="absolute inset-x-1 top-1 h-0.5 rounded-full bg-cyan-100/70 animate-water-shimmer" />
            <span className="absolute inset-x-2 top-3 h-0.5 rounded-full bg-blue-100/50 animate-water-shimmer [animation-delay:300ms]" />
            {seed % 9 === 0 ? <span className="animate-water-shimmer absolute left-2 top-2 h-1 w-1 rounded-full bg-cyan-50/70" /> : null}
          </>
        ) : null}
        {tile.kind === "path" ? (
          <>
            {seed % 4 === 0 ? <span className="absolute left-1 top-2 h-0.5 w-0.5 rounded-full bg-amber-950/40" /> : null}
          </>
        ) : null}
        {tile.kind === "bridge" ? (
          <>
            <span className="absolute inset-x-0 top-1 h-0.5 bg-amber-200/35" />
            <span className="absolute inset-x-0 top-3 h-0.5 bg-amber-950/40" />
          </>
        ) : null}
        {tile.kind === "wall" ? <span className="absolute inset-x-0 top-0 h-1 bg-slate-200/25" /> : null}
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
          <span className={`absolute inset-0 z-20 ${walkFrame === 0 ? "animate-walk-a" : "animate-walk-b"}`}>
            <span className={`absolute left-2 top-0 h-1 w-1 rounded-full bg-amber-100 ${playerFacing === "up" ? "opacity-90" : ""}`} />
            <span className={`absolute left-1 top-1 h-3 w-3 rounded-sm shadow-[0_0_8px_rgba(251,191,36,0.9)] ${avatarColor(player.avatarId)}`} />
            <span className={`absolute left-1 top-4 h-1 w-1 bg-amber-900 ${playerFacing === "left" ? "translate-x-[-1px]" : ""}`} />
            <span className={`absolute left-3 top-4 h-1 w-1 bg-amber-900 ${playerFacing === "right" ? "translate-x-[1px]" : ""}`} />
            <span className="absolute left-1 top-[15px] h-1 w-3 rounded-full bg-slate-950/45" />
          </span>
        ) : null}
        {npc ? (
          <span className="animate-npc-idle absolute inset-0 z-20">
            <span className="absolute left-2 top-0 h-1 w-1 rounded-full bg-slate-50" />
            <span
              className={`absolute left-1 top-1 h-3 w-3 rounded-sm ${
                npc.role === "trainer" || npc.role === "rival" ? "bg-rose-400" : "bg-cyan-300"
              }`}
            />
            <span className="absolute left-1 top-4 h-1 w-1 bg-slate-900" />
            <span className="absolute left-3 top-4 h-1 w-1 bg-slate-900" />
            <span className="absolute left-1 top-[15px] h-1 w-3 rounded-full bg-slate-950/40" />
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
          <div className="parallax-layer parallax-far" style={{ transform: `translateX(-${startX * 1.2}px)` }} />
          <div className="parallax-layer parallax-mid" style={{ transform: `translateX(-${startX * 2.4}px)` }} />
          <div className="parallax-layer parallax-near" style={{ transform: `translateX(-${startX * 4}px)` }} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(120,201,255,0.28)_0%,rgba(189,245,255,0.08)_34%,transparent_40%)]" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-8 top-1 h-8 w-20 rounded-full bg-white/20 blur-sm" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-16 top-4 h-7 w-16 rounded-full bg-white/15 blur-sm [animation-delay:2000ms]" />
          {tiles}
          <div className="pointer-events-none absolute bottom-2 left-3 h-6 w-8 rounded-full bg-emerald-900/20 blur-md" />
          <div className="pointer-events-none absolute bottom-1 right-6 h-8 w-12 rounded-full bg-cyan-800/15 blur-md" />
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
