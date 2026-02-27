"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BattleCreatureSprite } from "@/components/game/BattleCreatureSprite";
import { ITEM_INDEX } from "@/lib/game/data/items";
import { MOVE_INDEX } from "@/lib/game/data/moves";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { BattleState, MonsterInstance } from "@/lib/game/state/gameTypes";

type Props = {
  battle: BattleState;
  playerMonster: MonsterInstance;
  onMove: (idx: number) => void;
  onEnemyTurn: () => void;
  onUseItem: (itemId: "capture_orb" | "super_orb" | "potion" | "mega_potion") => void;
  onRun: () => void;
  inventory: Record<"capture_orb" | "super_orb" | "potion" | "mega_potion", number>;
};

type ActionTab = "moves" | "items";

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.round((current / Math.max(max, 1)) * 100);
  return (
    <div className="mt-1 h-2 overflow-hidden rounded-sm border border-slate-700 bg-slate-900">
      <div
        className={`h-full transition-all duration-500 ${pct > 50 ? "bg-emerald-500" : pct > 20 ? "bg-amber-400" : "bg-rose-500"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function BattleScene({ battle, playerMonster, onMove, onEnemyTurn, onUseItem, onRun, inventory }: Props) {
  const [tab, setTab] = useState<ActionTab>("moves");
  const [isLocked, setIsLocked] = useState(false);
  const [phase, setPhase] = useState<"idle" | "player" | "enemy">("idle");
  const [fx, setFx] = useState<"none" | "enemy_hit" | "player_hit" | "heal" | "orb" | "enemy_faint" | "player_faint">(
    "none",
  );
  const [typedNarration, setTypedNarration] = useState("");
  const lastTurnRef = useRef<number>(battle.turn);

  const enemy = battle.enemy;
  const playerSpecies = SPECIES_INDEX[playerMonster.speciesId];
  const enemySpecies = SPECIES_INDEX[enemy.speciesId];
  const latestLog = battle.log[battle.log.length - 1] ?? "Battle begins.";

  useEffect(() => {
    if (battle.turn !== lastTurnRef.current) {
      lastTurnRef.current = battle.turn;
    }
  }, [battle.turn]);

  useEffect(() => {
    setTypedNarration("");
    let i = 0;
    const interval = setInterval(() => {
      i += 1;
      setTypedNarration(latestLog.slice(0, i));
      if (i >= latestLog.length) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [latestLog]);

  useEffect(() => {
    if (latestLog.includes("broke free") || latestLog.includes("captured")) {
      setFx("orb");
      return;
    }
    if (latestLog.includes("recovered HP")) {
      setFx("heal");
      return;
    }
    if (latestLog.includes(`${enemySpecies.name} fainted`)) {
      setFx("enemy_faint");
      return;
    }
    if (latestLog.includes(`${playerSpecies.name} fainted`)) {
      setFx("player_faint");
      return;
    }
    if (latestLog.startsWith(playerSpecies.name) && latestLog.includes("used")) {
      setFx("enemy_hit");
      return;
    }
    if (latestLog.startsWith(enemySpecies.name) && latestLog.includes("used")) {
      setFx("player_hit");
      return;
    }
    setFx("none");
  }, [latestLog, enemySpecies.name, playerSpecies.name]);

  const recentLogs = useMemo(() => battle.log.slice(-3).reverse(), [battle.log]);

  useEffect(() => {
    if (!battle.pendingEnemyTurn) return;
    setIsLocked(true);
    setPhase("enemy");
    const timeout = setTimeout(() => {
      onEnemyTurn();
      setIsLocked(false);
      setPhase("idle");
    }, 1500);
    return () => clearTimeout(timeout);
  }, [battle.pendingEnemyTurn, onEnemyTurn]);

  async function handleMove(idx: number) {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(780);
    onMove(idx);
    await wait(420);
    setPhase("idle");
    setIsLocked(false);
  }

  async function handleItem(itemId: "capture_orb" | "super_orb" | "potion" | "mega_potion") {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(860);
    onUseItem(itemId);
    await wait(720);
    setPhase("idle");
    setIsLocked(false);
  }

  async function handleRun() {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(760);
    onRun();
    await wait(520);
    setPhase("idle");
    setIsLocked(false);
  }

  return (
    <div className="retro-console p-3">
      <div className="pixel-card rounded-xl p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Battle Flow</p>
          <p className="text-xs font-medium text-slate-200">
            {battle.pendingEnemyTurn ? "Opponent is responding..." : "Choose your next action"}
          </p>
        </div>
        <div className="h-2 overflow-hidden rounded bg-slate-800">
          <div
            className={`h-full transition-all duration-300 ${battle.pendingEnemyTurn ? "bg-rose-500" : "bg-cyan-400"}`}
            style={{ width: battle.pendingEnemyTurn ? "100%" : "55%" }}
          />
        </div>
      </div>

      <div className="battle-scene-bg battle-stage mt-3 rounded-xl border-2 border-slate-700 p-4">
        <div className="battle-nature-ring mb-4">
          <span className="battle-rope battle-rope-top" />
          <span className="battle-rope battle-rope-mid" />
          <span className="battle-rope battle-rope-bottom" />
          <span className="battle-post battle-post-left" />
          <span className="battle-post battle-post-right" />
        </div>
        <div className="relative z-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/35 p-3 backdrop-blur-[1px]">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">{battle.isWild ? "Wild" : "Trainer"}</p>
                <p className="font-semibold text-slate-100">{enemySpecies.name}</p>
                {!battle.isWild ? <p className="text-[11px] text-slate-300">{battle.enemyName}</p> : null}
              </div>
              <p className="text-xs text-slate-300">Lv {enemy.level}</p>
            </div>
            <div className="battle-ground mx-auto grid h-32 w-44 place-items-center">
              <BattleCreatureSprite
                className="shadow-[0_0_20px_rgba(147,197,253,0.35)]"
                speciesId={enemySpecies.id}
                size={116}
                side="enemy"
                state={fx === "enemy_faint" ? "faint" : phase === "player" ? "hit" : phase === "enemy" ? "attacking" : "idle"}
              />
              {phase === "player" || fx === "enemy_hit" ? <span className="battle-slash" /> : null}
            </div>
            <HpBar current={enemy.currentHp} max={enemy.maxHp} />
          </div>

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/35 p-3 backdrop-blur-[1px]">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">Your Lead</p>
                <p className="font-semibold text-slate-100">{playerSpecies.name}</p>
              </div>
              <p className="text-xs text-slate-300">Lv {playerMonster.level}</p>
            </div>
            <div className="battle-ground mx-auto grid h-32 w-44 place-items-center">
              <BattleCreatureSprite
                className="shadow-[0_0_20px_rgba(134,239,172,0.35)]"
                speciesId={playerSpecies.id}
                size={116}
                side="ally"
                state={fx === "player_faint" ? "faint" : phase === "enemy" ? "hit" : phase === "player" ? "attacking" : "idle"}
              />
              {phase === "enemy" || fx === "player_hit" ? <span className="battle-burst" /> : null}
              {fx === "heal" ? <span className="battle-heal-ring" /> : null}
              {fx === "orb" ? <span className="battle-orb" /> : null}
            </div>
            <HpBar current={playerMonster.currentHp} max={playerMonster.maxHp} />
          </div>
        </div>

        <div className="battle-narration mt-4 rounded-lg border border-slate-600/70 bg-slate-950/60 p-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-cyan-200">Battle narration</p>
          <p className="mt-1 min-h-6 text-sm text-slate-100">{typedNarration}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-300">
            {recentLogs.map((line, idx) => (
              <p key={`${line}_${idx}`}>{line}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="pixel-card mt-4 rounded-lg p-3">
        <p className="mb-2 text-sm font-semibold text-slate-100">Choose an action for {playerSpecies.name}</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          <button
            className={`pixel-btn min-h-11 rounded px-3 py-2 text-xs font-semibold ${tab === "moves" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setTab("moves")}
            type="button"
          >
            Fight
          </button>
          <button
            className={`pixel-btn min-h-11 rounded px-3 py-2 text-xs font-semibold ${tab === "items" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setTab("items")}
            type="button"
          >
            Bag
          </button>
          <button
            className="pixel-btn min-h-11 rounded bg-rose-700 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 disabled:opacity-50"
            onClick={handleRun}
            type="button"
            disabled={isLocked || battle.pendingEnemyTurn}
          >
            Run
          </button>
        </div>

        {tab === "moves" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {playerMonster.moves.map((slot, idx) => (
              <button
                key={`${slot.moveId}_${idx}`}
                className="pixel-btn min-h-14 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => void handleMove(idx)}
                type="button"
                disabled={isLocked || battle.pendingEnemyTurn || slot.currentPp <= 0}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">{MOVE_INDEX[slot.moveId].name}</span>
                  <span className="text-[11px] text-slate-400">PP {slot.currentPp}</span>
                </div>
                <p className="mt-1 text-[11px] uppercase tracking-wide text-slate-400">{MOVE_INDEX[slot.moveId].type}</p>
              </button>
            ))}
          </div>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2">
            {(["capture_orb", "super_orb", "potion", "mega_potion"] as const).map((itemId) => (
              <button
                key={itemId}
                className="pixel-btn min-h-14 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => void handleItem(itemId)}
                type="button"
                disabled={isLocked || battle.pendingEnemyTurn || (inventory[itemId] ?? 0) <= 0}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-100">{ITEM_INDEX[itemId].name}</span>
                  <span className="text-[11px] text-slate-400">x{inventory[itemId] ?? 0}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}
