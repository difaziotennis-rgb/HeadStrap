import test from "node:test";
import assert from "node:assert/strict";
import { applyPlayerMove, attemptCapture, computeDamage } from "@/lib/game/engine/battleEngine";
import { createMonsterInstance } from "@/lib/game/engine/worldFactory";
import { BattleState } from "@/lib/game/state/gameTypes";

function withRandom(values: number[], fn: () => void) {
  const original = Math.random;
  let idx = 0;
  Math.random = () => values[idx++] ?? 0.2;
  try {
    fn();
  } finally {
    Math.random = original;
  }
}

function makeBattle(): BattleState {
  return {
    enemy: createMonsterInstance("m_7", 5),
    isWild: true,
    enemyName: "Brambug",
    activePartyIndex: 0,
    log: [],
    turn: 0,
    awaitingSwitch: false,
    encounterArea: "starter_town",
  };
}

test("damage is always at least 1", () => {
  const a = createMonsterInstance("m_1", 5);
  const d = createMonsterInstance("m_2", 5);
  withRandom([0.5], () => {
    const damage = computeDamage(a, d, a.moves[0].moveId);
    assert.ok(damage >= 1);
  });
});

test("player move reduces enemy HP", () => {
  const p = createMonsterInstance("m_1", 5);
  const e = createMonsterInstance("m_2", 5);
  const battle = makeBattle();
  withRandom([0.0, 0.0], () => {
    const result = applyPlayerMove(battle, p, e, 0);
    assert.ok(result.enemyMonster.currentHp < e.currentHp);
  });
});

test("capture chance succeeds with low HP and favorable roll", () => {
  const enemy = createMonsterInstance("m_3", 5);
  enemy.currentHp = 1;
  withRandom([0.0], () => {
    const captured = attemptCapture(enemy, 1.5);
    assert.equal(captured, true);
  });
});
