import { MOVE_INDEX } from "@/lib/game/data/moves";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { MonsterInstance } from "@/lib/game/state/gameTypes";

export function createMonsterInstance(speciesId: string, level: number): MonsterInstance {
  const species = SPECIES_INDEX[speciesId];
  const hp = Math.floor(species.baseHp + level * 3.4);
  const attack = Math.floor(species.baseAttack + level * 1.8);
  const defense = Math.floor(species.baseDefense + level * 1.6);
  const speed = Math.floor(species.baseSpeed + level * 1.7);

  return {
    uid: `${speciesId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    speciesId,
    level,
    exp: 0,
    maxHp: hp,
    currentHp: hp,
    attack,
    defense,
    speed,
    moves: species.moveIds.slice(0, 4).map((moveId) => ({
      moveId,
      currentPp: MOVE_INDEX[moveId].pp,
    })),
  };
}

export function expToLevel(level: number) {
  return level * level * 24;
}
