"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { MapData, MapTile, PlayerState } from "@/lib/game/state/gameTypes";
import { NpcCharacter } from "@/lib/game/state/gameTypes";

type Props = {
  map: MapData;
  player: PlayerState;
  npcs: NpcCharacter[];
};

const TILE_FRAME_INDEX: Record<MapTile["kind"], number> = {
  ground: 0,
  grass: 1,
  short_grass: 2,
  tall_grass: 3,
  path: 4,
  water: 5,
  bridge: 6,
  wall: 7,
  tree: 8,
  bush: 9,
  portal: 10,
};

const TILE_SIZE = 24;

export function WorldCanvas({ map, player, npcs }: Props) {
  const viewportW = 20;
  const viewportH = 14;
  const [tileSize, setTileSize] = useState(TILE_SIZE);
  const [renderPlayer, setRenderPlayer] = useState({ x: player.x, y: player.y });
  const targetPlayerRef = useRef({ x: player.x, y: player.y });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    targetPlayerRef.current = { x: player.x, y: player.y };
    setRenderPlayer({ x: player.x, y: player.y });
  }, [map.id]);

  useEffect(() => {
    targetPlayerRef.current = { x: player.x, y: player.y };
  }, [player.x, player.y]);

  useEffect(() => {
    const syncTileSize = () => {
      if (window.innerWidth <= 430) {
        setTileSize(18);
      } else if (window.innerWidth <= 768) {
        setTileSize(20);
      } else {
        setTileSize(TILE_SIZE);
      }
    };
    syncTileSize();
    window.addEventListener("resize", syncTileSize);
    return () => window.removeEventListener("resize", syncTileSize);
  }, []);

  useEffect(() => {
    const animate = () => {
      setRenderPlayer((prev) => {
        const target = targetPlayerRef.current;
        const nx = prev.x + (target.x - prev.x) * 0.14;
        const ny = prev.y + (target.y - prev.y) * 0.14;
        if (Math.abs(nx - target.x) < 0.002 && Math.abs(ny - target.y) < 0.002) {
          return target;
        }
        return { x: nx, y: ny };
      });
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const cameraX = clamp(renderPlayer.x - viewportW / 2, 0, map.width - viewportW);
  const cameraY = clamp(renderPlayer.y - viewportH / 2, 0, map.height - viewportH);
  const baseX = Math.floor(cameraX);
  const baseY = Math.floor(cameraY);
  const fracX = cameraX - baseX;
  const fracY = cameraY - baseY;

  const npcIndex = Object.fromEntries(npcs.map((npc) => [`${npc.x}_${npc.y}`, npc]));

  const visibleTiles = [];
  for (let vy = 0; vy < viewportH + 1; vy += 1) {
    for (let vx = 0; vx < viewportW + 1; vx += 1) {
      const x = baseX + vx;
      const y = baseY + vy;
      if (x < 0 || y < 0 || x >= map.width || y >= map.height) continue;
      const tile = map.tiles[y * map.width + x];
      visibleTiles.push({ tile, x, y });
    }
  }

  const walkFrame = player.stepCounter % 2;
  const tiles = visibleTiles.map(({ tile, x, y }) => {
    const npc = npcIndex[`${x}_${y}`];
    const seed = Math.abs((x * 92821 + y * 68917 + 17) % 1000);
    const characterScale = tileSize / TILE_SIZE;
    const nearWater =
      getTileKind(map, x + 1, y) === "water" ||
      getTileKind(map, x - 1, y) === "water" ||
      getTileKind(map, x, y + 1) === "water" ||
      getTileKind(map, x, y - 1) === "water";
    return (
      <div
        key={`${x}_${y}`}
        className="relative overflow-visible"
        style={{ width: tileSize, height: tileSize }}
      >
        <span className="sprite-tile absolute inset-0" style={terrainSpriteStyle(tile.kind)} />
        {tile.kind === "ground" || tile.kind === "grass" || tile.kind === "short_grass" || tile.kind === "tall_grass" ? (
          <>
            {seed % 6 === 0 ? <span className="absolute left-1 top-1 h-1 w-1 rounded-full bg-yellow-200/85" /> : null}
            {seed % 10 === 0 ? <span className="absolute right-1 top-2 h-1 w-1 rounded-full bg-pink-200/80" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-0 h-3 w-1 bg-lime-900/40" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 left-2 h-2 w-1 bg-lime-900/40 [animation-delay:180ms]" /> : null}
            {tile.kind === "tall_grass" ? <span className="animate-grass-sway absolute bottom-0 right-0 h-3 w-1 bg-lime-900/40 [animation-delay:360ms]" /> : null}
            {seed % 23 === 0 ? <span className="animate-firefly absolute right-1 top-1 h-1 w-1 rounded-full bg-yellow-100" /> : null}
            {nearWater ? <span className="absolute inset-x-0 bottom-0 h-0.5 bg-cyan-100/35" /> : null}
            {nearWater && seed % 5 === 0 ? <span className="absolute bottom-0 left-0 h-2 w-1 bg-emerald-900/40" /> : null}
            {nearWater && seed % 8 === 0 ? <span className="absolute bottom-0 right-1 h-2 w-1 bg-emerald-900/35" /> : null}
          </>
        ) : null}
        {tile.kind === "water" ? (
          <>
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_40%)]" />
            <span className="absolute inset-x-1 top-1 h-0.5 rounded-full bg-cyan-100/70 animate-water-shimmer" />
            <span className="absolute inset-x-2 top-3 h-0.5 rounded-full bg-blue-100/50 animate-water-shimmer [animation-delay:300ms]" />
            {seed % 9 === 0 ? <span className="animate-water-shimmer absolute left-2 top-2 h-1 w-1 rounded-full bg-cyan-50/70" /> : null}
            {seed % 7 === 0 ? <span className="absolute left-1 top-1 h-1 w-2 rounded-full bg-white/25" /> : null}
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
        {npc ? (
          <span className="animate-npc-idle absolute inset-0 z-20">
            <span className="absolute left-1 top-[15px] h-1 w-3 rounded-full bg-slate-950/40" style={{ transform: `scale(${characterScale})`, transformOrigin: "left top" }} />
            <span className="world-character absolute left-[1px] top-[1px]" style={{ transform: `scale(${characterScale})`, transformOrigin: "left top" }}>
              <span className="world-character-head bg-amber-100" />
              <span
                className={`world-character-body ${
                  npc.role === "trainer" || npc.role === "rival" ? "bg-rose-500" : "bg-cyan-400"
                }`}
              />
              <span className="world-character-leg left-[2px]" />
              <span className="world-character-leg left-[7px]" />
            </span>
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
          className={`retro-screen biome-tone-${biomeToneKey(map.id)} relative grid w-fit overflow-hidden rounded`}
          style={{ width: viewportW * tileSize, height: viewportH * tileSize }}
        >
          <div className="parallax-layer parallax-far" style={{ transform: `translateX(-${cameraX * 1.15}px)` }} />
          <div className="parallax-layer parallax-mid" style={{ transform: `translateX(-${cameraX * 2.2}px)` }} />
          <div className="parallax-layer parallax-near" style={{ transform: `translateX(-${cameraX * 3.8}px)` }} />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(120,201,255,0.28)_0%,rgba(189,245,255,0.08)_34%,transparent_40%)]" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-8 top-1 h-8 w-20 rounded-full bg-white/20 blur-sm" />
          <div className="pointer-events-none animate-cloud-drift absolute -left-16 top-4 h-7 w-16 rounded-full bg-white/15 blur-sm [animation-delay:2000ms]" />
          <div
            className="absolute left-0 top-0 grid"
            style={{
              gridTemplateColumns: `repeat(${viewportW + 1}, ${tileSize}px)`,
              transform: `translate(${-fracX * tileSize}px, ${-fracY * tileSize}px)`,
            }}
          >
            {tiles}
          </div>
          <span
            className={`pointer-events-none absolute z-30 ${walkFrame === 0 ? "animate-walk-a" : "animate-walk-b"}`}
            style={{
              left: (renderPlayer.x - cameraX) * tileSize + 1,
              top: (renderPlayer.y - cameraY) * tileSize + 1,
            }}
          >
            <span className="absolute left-1 top-[15px] h-1 w-3 rounded-full bg-slate-950/45" style={{ transform: `scale(${tileSize / TILE_SIZE})`, transformOrigin: "left top" }} />
            <span className="world-character absolute left-[1px] top-[1px]" style={{ transform: `scale(${tileSize / TILE_SIZE})`, transformOrigin: "left top" }}>
              <span className={`world-character-head ${avatarHeadTone(player.avatarId)}`} />
              <span className={`world-character-body ${avatarBodyTone(player.avatarId)}`} />
              <span className={`world-character-leg left-[2px] ${walkFrame === 0 ? "translate-y-0" : "translate-y-[1px]"}`} />
              <span className={`world-character-leg left-[7px] ${walkFrame === 1 ? "translate-y-0" : "translate-y-[1px]"}`} />
            </span>
          </span>
          <div className="pointer-events-none absolute bottom-2 left-3 h-6 w-8 rounded-full bg-emerald-900/20 blur-md" />
          <div className="pointer-events-none absolute bottom-1 right-6 h-8 w-12 rounded-full bg-cyan-800/15 blur-md" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(255,255,255,0.12),transparent_33%)]" />
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

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function terrainSpriteStyle(kind: MapTile["kind"]): CSSProperties {
  const frame = TILE_FRAME_INDEX[kind] ?? 0;
  const col = frame % 4;
  const row = Math.floor(frame / 4);
  return {
    backgroundImage: "url('/game/sprites/terrain-atlas.png')",
    backgroundPosition: `${framePositionPercent(col, 4)} ${framePositionPercent(row, 3)}`,
  };
}

function framePositionPercent(index: number, count: number) {
  if (count <= 1) return "0%";
  return `${(index / (count - 1)) * 100}%`;
}

function avatarBodyTone(avatarId: string) {
  if (avatarId === "blaze") return "bg-orange-500";
  if (avatarId === "wave") return "bg-sky-500";
  if (avatarId === "shadow") return "bg-violet-600";
  return "bg-amber-500";
}

function avatarHeadTone(avatarId: string) {
  if (avatarId === "blaze") return "bg-orange-200";
  if (avatarId === "wave") return "bg-sky-200";
  if (avatarId === "shadow") return "bg-violet-300";
  return "bg-amber-200";
}

function getTileKind(map: MapData, x: number, y: number) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return "wall";
  return map.tiles[y * map.width + x].kind;
}

function biomeToneKey(mapId: string) {
  if (mapId.includes("forest")) return "forest";
  if (mapId.includes("canyon")) return "canyon";
  if (mapId.includes("lake")) return "lakeside";
  if (mapId.includes("gym") || mapId.includes("lab")) return "interior";
  return "town";
}
