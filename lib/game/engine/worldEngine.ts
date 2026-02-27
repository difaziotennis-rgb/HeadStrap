import { ENCOUNTER_TABLES } from "@/lib/game/data/encounters";
import { MAP_INDEX } from "@/lib/game/data/maps";
import { createMonsterInstance } from "@/lib/game/engine/worldFactory";
import { Facing, MonsterInstance } from "@/lib/game/state/gameTypes";

const DIRECTIONS: Record<Facing, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export type WorldMoveResult = {
  moved: boolean;
  x: number;
  y: number;
  mapId: string;
  steppedOnGrass: boolean;
  triggerEncounter: MonsterInstance | null;
  transitionedMap: boolean;
};

export function movePlayer(
  mapId: string,
  x: number,
  y: number,
  facing: Facing,
  stepCounter: number,
  forcedEncounterId: string | null,
): WorldMoveResult {
  const map = MAP_INDEX[mapId];
  if (!map) {
    return { moved: false, x, y, mapId, steppedOnGrass: false, triggerEncounter: null, transitionedMap: false };
  }

  const dir = DIRECTIONS[facing];
  const nx = x + dir.dx;
  const ny = y + dir.dy;
  if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) {
    return { moved: false, x, y, mapId, steppedOnGrass: false, triggerEncounter: null, transitionedMap: false };
  }

  const tile = map.tiles[ny * map.width + nx];
  if (tile.kind === "wall" || tile.kind === "water" || tile.kind === "tree") {
    return { moved: false, x, y, mapId, steppedOnGrass: false, triggerEncounter: null, transitionedMap: false };
  }

  let nextMapId = mapId;
  let tx = nx;
  let ty = ny;
  if (tile.kind === "portal" && tile.toMapId) {
    nextMapId = tile.toMapId;
    tx = tile.toX ?? MAP_INDEX[nextMapId]?.spawnX ?? nx;
    ty = tile.toY ?? MAP_INDEX[nextMapId]?.spawnY ?? ny;
  }

  const steppedOnGrass = tile.kind === "grass" || tile.kind === "tall_grass" || tile.kind === "short_grass";
  const triggerEncounter = rolledEncounter(nextMapId, steppedOnGrass, stepCounter, forcedEncounterId);
  return { moved: true, x: tx, y: ty, mapId: nextMapId, steppedOnGrass, triggerEncounter, transitionedMap: mapId !== nextMapId };
}

function rolledEncounter(
  mapId: string,
  steppedOnGrass: boolean,
  stepCounter: number,
  forcedEncounterId: string | null,
): MonsterInstance | null {
  if (forcedEncounterId) {
    return createMonsterInstance(forcedEncounterId, 5);
  }
  if (!steppedOnGrass) return null;
  const table = ENCOUNTER_TABLES[mapId] ?? [];
  if (!table.length) return null;
  const encounterRate = 0.08 + Math.min(0.05, stepCounter / 240);
  if (Math.random() > encounterRate) return null;

  const totalWeight = table.reduce((sum, e) => sum + e.weight, 0);
  let roll = Math.random() * totalWeight;
  for (const entry of table) {
    roll -= entry.weight;
    if (roll <= 0) {
      const level = randomInt(entry.minLevel, entry.maxLevel);
      return createMonsterInstance(entry.speciesId, level);
    }
  }
  const fallback = table[table.length - 1];
  return createMonsterInstance(fallback.speciesId, randomInt(fallback.minLevel, fallback.maxLevel));
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
