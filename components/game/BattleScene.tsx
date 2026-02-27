"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PixelSprite } from "@/components/game/PixelSprite";
import { ITEM_INDEX } from "@/lib/game/data/items";
import { MOVE_INDEX } from "@/lib/game/data/moves";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { BattleState, MonsterInstance } from "@/lib/game/state/gameTypes";

type Props = {
  battle: BattleState;
  playerMonster: MonsterInstance;
  onMove: (idx: number) => void;
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

export function BattleScene({ battle, playerMonster, onMove, onUseItem, onRun, inventory }: Props) {
  const [tab, setTab] = useState<ActionTab>("moves");
  const [isLocked, setIsLocked] = useState(false);
  const [phase, setPhase] = useState<"idle" | "player" | "enemy">("idle");
  const [timeLeftMs, setTimeLeftMs] = useState(12000);
  const [visibleLogCount, setVisibleLogCount] = useState(2);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTurnRef = useRef<number>(battle.turn);

  const enemy = battle.enemy;
  const playerSpecies = SPECIES_INDEX[playerMonster.speciesId];
  const enemySpecies = SPECIES_INDEX[enemy.speciesId];

  useEffect(() => {
    if (battle.turn !== lastTurnRef.current) {
      setTimeLeftMs(12000);
      lastTurnRef.current = battle.turn;
    }
    setVisibleLogCount(2);
  }, [battle.turn]);

  useEffect(() => {
    if (isLocked) return;
    if (countdownRef.current) clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setTimeLeftMs((prev) => Math.max(0, prev - 100));
    }, 100);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [isLocked, battle.turn]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleLogCount((prev) => Math.min(prev + 1, battle.log.length));
    }, 600);
    return () => clearInterval(interval);
  }, [battle.log.length]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  const timerPct = Math.round((timeLeftMs / 12000) * 100);
  const shownLogs = useMemo(() => battle.log.slice(-visibleLogCount).reverse(), [battle.log, visibleLogCount]);

  async function handleMove(idx: number) {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(500);
    onMove(idx);
    setPhase("enemy");
    await wait(700);
    setPhase("idle");
    setIsLocked(false);
  }

  async function handleItem(itemId: "capture_orb" | "super_orb" | "potion" | "mega_potion") {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(450);
    onUseItem(itemId);
    await wait(500);
    setPhase("idle");
    setIsLocked(false);
  }

  async function handleRun() {
    if (isLocked) return;
    setIsLocked(true);
    setPhase("player");
    await wait(400);
    onRun();
    await wait(300);
    setPhase("idle");
    setIsLocked(false);
  }

  return (
    <div className="retro-console p-3">
      <div className="pixel-card rounded-xl p-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-300">Battle Timeline</p>
          <p className="text-xs font-medium text-slate-200">{Math.ceil(timeLeftMs / 1000)}s to act</p>
        </div>
        <div className="h-2 overflow-hidden rounded bg-slate-800">
          <div
            className={`h-full transition-all duration-200 ${timerPct > 45 ? "bg-cyan-400" : timerPct > 20 ? "bg-amber-400" : "bg-rose-500"}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      </div>

      <div className="battle-scene-bg mt-3 rounded-xl border-2 border-slate-700 p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-slate-700/70 bg-slate-900/55 p-3">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">Wild</p>
                <p className="font-semibold text-slate-100">{enemySpecies.name}</p>
              </div>
              <p className="text-xs text-slate-300">Lv {enemy.level}</p>
            </div>
            <div className="battle-ground mx-auto grid h-24 w-28 place-items-center">
              <PixelSprite
                className={phase === "player" ? "animate-battle-hit shadow-[0_0_20px_rgba(147,197,253,0.35)]" : "animate-float"}
                seed={`enemy_${enemySpecies.id}`}
                size={68}
                tone="enemy"
              />
            </div>
            <HpBar current={enemy.currentHp} max={enemy.maxHp} />
          </div>

          <div className="rounded-lg border border-slate-700/70 bg-slate-900/55 p-3">
            <div className="mb-3 flex items-end justify-between">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-300">Your Lead</p>
                <p className="font-semibold text-slate-100">{playerSpecies.name}</p>
              </div>
              <p className="text-xs text-slate-300">Lv {playerMonster.level}</p>
            </div>
            <div className="battle-ground mx-auto grid h-24 w-28 place-items-center">
              <PixelSprite
                className={phase === "enemy" ? "animate-battle-hit shadow-[0_0_20px_rgba(134,239,172,0.35)]" : "animate-float-slow"}
                seed={`ally_${playerSpecies.id}`}
                size={68}
                tone="ally"
              />
            </div>
            <HpBar current={playerMonster.currentHp} max={playerMonster.maxHp} />
          </div>
        </div>
      </div>

      <div className="pixel-card mt-4 rounded-lg p-3">
        <p className="mb-2 text-sm font-semibold text-slate-100">What will {playerSpecies.name} do?</p>
        <div className="mb-3 flex gap-2">
          <button
            className={`pixel-btn rounded px-3 py-2 text-xs font-medium ${tab === "moves" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setTab("moves")}
            type="button"
          >
            Moves
          </button>
          <button
            className={`pixel-btn rounded px-3 py-2 text-xs font-medium ${tab === "items" ? "bg-violet-600 text-white" : "bg-slate-800 text-slate-300"}`}
            onClick={() => setTab("items")}
            type="button"
          >
            Items
          </button>
          <button
            className="pixel-btn ml-auto rounded bg-rose-700 px-3 py-2 text-xs font-medium text-white hover:bg-rose-600 disabled:opacity-50"
            onClick={handleRun}
            type="button"
            disabled={isLocked}
          >
            Run
          </button>
        </div>

        {tab === "moves" ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {playerMonster.moves.map((slot, idx) => (
              <button
                key={`${slot.moveId}_${idx}`}
                className="pixel-btn rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => void handleMove(idx)}
                type="button"
                disabled={isLocked || slot.currentPp <= 0}
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
                className="pixel-btn rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-left text-sm transition hover:border-violet-400 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => void handleItem(itemId)}
                type="button"
                disabled={isLocked || (inventory[itemId] ?? 0) <= 0}
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

      <div className="pixel-card mt-4 rounded p-3">
        <p className="text-xs uppercase tracking-widest text-slate-400">Battle log</p>
        <ul className="mt-2 space-y-1 text-sm text-slate-200">
          {shownLogs.map((line, idx) => (
            <li key={`${line}_${idx}`}>{line}</li>
          ))}
        </ul>
        {timeLeftMs <= 0 && !isLocked ? (
          <p className="mt-2 text-xs text-amber-300">Timer reached zero. Choose your next action when ready.</p>
        ) : null}
      </div>
    </div>
  );
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(() => resolve(), ms);
  });
}
