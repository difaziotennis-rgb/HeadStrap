import { ITEM_INDEX } from "@/lib/game/data/items";
import { MOVE_INDEX } from "@/lib/game/data/moves";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { expToLevel } from "@/lib/game/engine/worldFactory";
import { BattleMoveResult, BattleState, MonsterInstance } from "@/lib/game/state/gameTypes";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function typeMultiplier(attacking: string, defending: string) {
  if (attacking === "ember" && defending === "flora") return 1.5;
  if (attacking === "flora" && defending === "aqua") return 1.5;
  if (attacking === "aqua" && defending === "ember") return 1.5;
  if (attacking === "volt" && defending === "aqua") return 1.5;
  if (attacking === "stone" && defending === "gust") return 1.5;
  if (attacking === "void") return 1.2;

  if (attacking === "ember" && defending === "aqua") return 0.7;
  if (attacking === "flora" && defending === "ember") return 0.7;
  if (attacking === "aqua" && defending === "flora") return 0.7;
  return 1;
}

export function applyPlayerMove(
  battle: BattleState,
  playerMonster: MonsterInstance,
  enemyMonster: MonsterInstance,
  moveIndex: number,
): BattleMoveResult {
  const moveRef = playerMonster.moves[moveIndex];
  if (!moveRef || moveRef.currentPp <= 0) {
    return {
      nextState: withLog(battle, `${SPECIES_INDEX[playerMonster.speciesId].name} has no PP for that move.`),
      playerMonster,
      enemyMonster,
      faintedEnemy: false,
      faintedPlayer: false,
    };
  }
  const move = MOVE_INDEX[moveRef.moveId];
  const nextPlayer = structuredClone(playerMonster);
  nextPlayer.moves[moveIndex].currentPp -= 1;

  if (Math.random() * 100 > move.accuracy) {
    const nextState = withLog(battle, `${SPECIES_INDEX[playerMonster.speciesId].name} used ${move.name}, but missed.`);
    return { nextState, playerMonster: nextPlayer, enemyMonster, faintedEnemy: false, faintedPlayer: false };
  }

  const outcome = computeDamageOutcome(nextPlayer, enemyMonster, move.id);
  const damage = outcome.damage;
  const nextEnemy = structuredClone(enemyMonster);
  nextEnemy.currentHp = clamp(nextEnemy.currentHp - damage, 0, nextEnemy.maxHp);

  let nextState = withLog(
    battle,
    `${SPECIES_INDEX[playerMonster.speciesId].name} used ${move.name} for ${damage} damage.`,
  );
  if (outcome.critical) {
    nextState = withLog(nextState, "Critical hit!");
  }
  if (outcome.typeMod >= 1.35) {
    nextState = withLog(nextState, "It's super effective!");
  } else if (outcome.typeMod <= 0.8) {
    nextState = withLog(nextState, "It's not very effective...");
  }
  const faintedEnemy = nextEnemy.currentHp <= 0;
  if (faintedEnemy) {
    nextState = withLog(nextState, `${SPECIES_INDEX[enemyMonster.speciesId].name} fainted.`);
  }

  return { nextState, playerMonster: nextPlayer, enemyMonster: nextEnemy, faintedEnemy, faintedPlayer: false };
}

export function applyEnemyMove(
  battle: BattleState,
  playerMonster: MonsterInstance,
  enemyMonster: MonsterInstance,
  aiPersonality: "aggressive" | "defensive" | "trickster" | "balanced" = "balanced",
): BattleMoveResult {
  const usable = enemyMonster.moves
    .map((moveRef, idx) => ({ moveRef, idx }))
    .filter((entry) => entry.moveRef.currentPp > 0);
  if (!usable.length) {
    return {
      nextState: withLog(battle, `${SPECIES_INDEX[enemyMonster.speciesId].name} stalled.`),
      playerMonster,
      enemyMonster,
      faintedEnemy: false,
      faintedPlayer: false,
    };
  }

  const selected = chooseEnemyMove(usable, aiPersonality, enemyMonster, playerMonster);
  const move = MOVE_INDEX[selected.moveRef.moveId];
  const nextEnemy = structuredClone(enemyMonster);
  const moveIdx = selected.idx;
  if (moveIdx >= 0) {
    nextEnemy.moves[moveIdx].currentPp -= 1;
  }

  if (Math.random() * 100 > move.accuracy) {
    const nextState = withLog(
      battle,
      `${SPECIES_INDEX[enemyMonster.speciesId].name} used ${move.name}, but missed.`,
    );
    return { nextState, playerMonster, enemyMonster: nextEnemy, faintedEnemy: false, faintedPlayer: false };
  }

  const outcome = computeDamageOutcome(nextEnemy, playerMonster, move.id);
  const damage = outcome.damage;
  const nextPlayer = structuredClone(playerMonster);
  nextPlayer.currentHp = clamp(nextPlayer.currentHp - damage, 0, nextPlayer.maxHp);

  let nextState = withLog(
    battle,
    `${SPECIES_INDEX[enemyMonster.speciesId].name} used ${move.name} for ${damage} damage.`,
  );
  if (outcome.critical) {
    nextState = withLog(nextState, "Critical hit!");
  }
  if (outcome.typeMod >= 1.35) {
    nextState = withLog(nextState, "It's super effective!");
  } else if (outcome.typeMod <= 0.8) {
    nextState = withLog(nextState, "It's not very effective...");
  }
  const faintedPlayer = nextPlayer.currentHp <= 0;
  if (faintedPlayer) {
    nextState = withLog(nextState, `${SPECIES_INDEX[playerMonster.speciesId].name} fainted.`);
  }

  return { nextState, playerMonster: nextPlayer, enemyMonster: nextEnemy, faintedEnemy: false, faintedPlayer };
}

function chooseEnemyMove(
  usable: { moveRef: MonsterInstance["moves"][number]; idx: number }[],
  aiPersonality: "aggressive" | "defensive" | "trickster" | "balanced",
  enemyMonster: MonsterInstance,
  playerMonster: MonsterInstance,
) {
  const weighted = usable.map((entry) => {
    const move = MOVE_INDEX[entry.moveRef.moveId];
    let score = 1 + move.power / 30;
    if (move.category === "status") score *= aiPersonality === "trickster" ? 2.2 : 0.6;
    if (aiPersonality === "aggressive" && move.category !== "status") score *= 1.55;
    if (aiPersonality === "defensive" && playerMonster.currentHp < playerMonster.maxHp * 0.35) score *= 1.3;
    if (aiPersonality === "defensive" && enemyMonster.currentHp < enemyMonster.maxHp * 0.45 && move.category === "status") score *= 1.9;
    if (aiPersonality === "trickster" && move.accuracy < 90) score *= 1.4;
    return { ...entry, score };
  });
  const total = weighted.reduce((sum, entry) => sum + Math.max(0.05, entry.score), 0);
  let roll = Math.random() * total;
  for (const entry of weighted) {
    roll -= Math.max(0.05, entry.score);
    if (roll <= 0) return entry;
  }
  return weighted[weighted.length - 1];
}

export function computeDamage(attacker: MonsterInstance, defender: MonsterInstance, moveId: string) {
  return computeDamageOutcome(attacker, defender, moveId).damage;
}

function computeDamageOutcome(attacker: MonsterInstance, defender: MonsterInstance, moveId: string) {
  const move = MOVE_INDEX[moveId];
  if (!move || move.category === "status" || move.power <= 0) {
    return {
      damage: 0,
      typeMod: 1,
      critical: false,
    };
  }
  const atk = move.category === "physical" ? attacker.attack : Math.floor(attacker.attack * 0.95);
  const def = move.category === "physical" ? defender.defense : Math.floor(defender.defense * 0.95);
  const base = Math.floor(((2 * attacker.level) / 5 + 2) * move.power * (atk / Math.max(def, 1)) / 50) + 2;
  const stab = SPECIES_INDEX[attacker.speciesId].type === move.type ? 1.15 : 1;
  const typeMod = typeMultiplier(move.type, SPECIES_INDEX[defender.speciesId].type);
  const critical = Math.random() < 0.09;
  const critMod = critical ? 1.55 : 1;
  const variance = 0.88 + Math.random() * 0.12;
  return {
    damage: Math.max(1, Math.floor(base * stab * typeMod * critMod * variance)),
    typeMod,
    critical,
  };
}

export function attemptCapture(enemy: MonsterInstance, catchBonus = 1) {
  const species = SPECIES_INDEX[enemy.speciesId];
  const hpFactor = (enemy.maxHp - enemy.currentHp) / Math.max(enemy.maxHp, 1);
  const chance = clamp((species.catchRate / 100) * 0.55 + hpFactor * 0.55, 0.03, 0.95) * catchBonus;
  return Math.random() < chance;
}

export function useHealingItem(monster: MonsterInstance, itemId: "potion" | "mega_potion") {
  const item = ITEM_INDEX[itemId];
  const healed = clamp(monster.currentHp + (item.healAmount ?? 0), 0, monster.maxHp);
  return { ...monster, currentHp: healed };
}

export function awardExperience(monster: MonsterInstance, xp: number) {
  const next = structuredClone(monster);
  next.exp += xp;
  let leveledUp = false;
  while (next.exp >= expToLevel(next.level + 1)) {
    leveledUp = true;
    next.level += 1;
    next.maxHp += 4;
    next.attack += 2;
    next.defense += 2;
    next.speed += 2;
    next.currentHp = next.maxHp;
  }
  return { monster: next, leveledUp };
}

function withLog(battle: BattleState, message: string): BattleState {
  return {
    ...battle,
    turn: battle.turn + 1,
    log: [...battle.log.slice(-7), message],
  };
}
