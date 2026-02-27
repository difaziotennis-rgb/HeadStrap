import { createMonsterInstance } from "@/lib/game/engine/worldFactory";
import { GameState } from "@/lib/game/state/gameTypes";

const SAVE_KEY = "difazio_game_save_v1";
const RESET_ON_EACH_REFRESH = true;

export function createInitialState(): GameState {
  return {
    mode: "world",
    player: {
      mapId: "starter_town",
      x: 5,
      y: 21,
      facing: "down",
      stepCounter: 0,
      avatarId: "ace",
    },
    party: [createMonsterInstance("m_1", 5)],
    storage: [],
    inventory: {
      capture_orb: 8,
      super_orb: 2,
      potion: 5,
      mega_potion: 1,
    },
    visitedMaps: ["starter_town"],
    battle: null,
    sandbox: {
      enabled: true,
      guaranteedEncounter: null,
    },
    starterChosen: false,
    lastSavedAt: null,
    defeatedTrainerIds: [],
    activeDialog: null,
  };
}

export function loadGameState(): GameState {
  if (RESET_ON_EACH_REFRESH) {
    return createInitialState();
  }
  if (typeof window === "undefined") return createInitialState();
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw) as GameState;
    if (!parsed?.player || !parsed?.inventory || !Array.isArray(parsed.party)) {
      return createInitialState();
    }
    return parsed;
  } catch {
    return createInitialState();
  }
}

export function saveGameState(state: GameState) {
  if (RESET_ON_EACH_REFRESH) return;
  if (typeof window === "undefined") return;
  const persisted = {
    ...state,
    lastSavedAt: Date.now(),
  };
  window.localStorage.setItem(SAVE_KEY, JSON.stringify(persisted));
}

export function clearGameState() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SAVE_KEY);
}

export function getSaveKey() {
  return SAVE_KEY;
}
