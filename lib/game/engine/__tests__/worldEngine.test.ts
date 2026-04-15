import test from "node:test";
import assert from "node:assert/strict";
import { movePlayer } from "@/lib/game/engine/worldEngine";

function withRandom(values: number[], fn: () => void) {
  const original = Math.random;
  let idx = 0;
  Math.random = () => values[idx++] ?? 0.99;
  try {
    fn();
  } finally {
    Math.random = original;
  }
}

test("player movement respects walls", () => {
  const blocked = movePlayer("starter_town", 0, 0, "left", 0, null);
  assert.equal(blocked.moved, false);
});

test("forced encounter always returns enemy", () => {
  const result = movePlayer("starter_town", 6, 21, "right", 10, "m_4");
  assert.equal(result.moved, true);
  assert.ok(result.triggerEncounter);
  assert.equal(result.triggerEncounter?.speciesId, "m_4");
});

test("grass tile can trigger random encounter", () => {
  withRandom([0.0, 0.0, 0.0], () => {
    const result = movePlayer("starter_town", 4, 4, "right", 120, null);
    assert.equal(result.moved, true);
    assert.equal(result.steppedOnGrass, true);
    assert.ok(result.triggerEncounter);
  });
});
