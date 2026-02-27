"use client";

import { useEffect, useRef } from "react";
import { BattleScene } from "@/components/game/BattleScene";
import { MobileControls } from "@/components/game/MobileControls";
import { SandboxPanel } from "@/components/game/SandboxPanel";
import { StarterPicker } from "@/components/game/StarterPicker";
import { TeamPanel } from "@/components/game/TeamPanel";
import { WorldCanvas } from "@/components/game/WorldCanvas";
import { useGameStore } from "@/lib/game/state/gameStore";

export function GameShell() {
  const store = useGameStore();
  const { state, map, isHydrated, mapTransitioning, mapNpcs } = store;
  const move = store.move;
  const interact = store.interact;
  const swapPartyIndex = store.swapPartyIndex;
  const heldDirectionRef = useRef<"up" | "down" | "left" | "right" | null>(null);
  const moveLoopRef = useRef<number | null>(null);
  const lastMoveTimeRef = useRef(0);

  useEffect(() => {
    const MOVE_INTERVAL_MS = 84;
    const tickMove = (now: number) => {
      if (!heldDirectionRef.current) {
        moveLoopRef.current = null;
        return;
      }
      if (now - lastMoveTimeRef.current >= MOVE_INTERVAL_MS) {
        move(heldDirectionRef.current);
        lastMoveTimeRef.current = now;
      }
      moveLoopRef.current = requestAnimationFrame(tickMove);
    };

    const startMoveLoop = (dir: "up" | "down" | "left" | "right") => {
      heldDirectionRef.current = dir;
      move(dir);
      if (moveLoopRef.current) cancelAnimationFrame(moveLoopRef.current);
      lastMoveTimeRef.current = performance.now();
      moveLoopRef.current = requestAnimationFrame(tickMove);
    };

    const stopMoveLoop = (dir?: string) => {
      if (!dir || heldDirectionRef.current === dir) {
        heldDirectionRef.current = null;
        if (moveLoopRef.current) {
          cancelAnimationFrame(moveLoopRef.current);
          moveLoopRef.current = null;
        }
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isArrow = event.key.startsWith("Arrow");
      const isMoveKey = isArrow || key === "w" || key === "a" || key === "s" || key === "d";
      if (isMoveKey) event.preventDefault();
      if (state.mode !== "world") return;
      if (event.repeat) return;
      if (event.key === "ArrowUp" || key === "w") startMoveLoop("up");
      if (event.key === "ArrowDown" || key === "s") startMoveLoop("down");
      if (event.key === "ArrowLeft" || key === "a") startMoveLoop("left");
      if (event.key === "ArrowRight" || key === "d") startMoveLoop("right");
      if (event.key.toLowerCase() === "t") swapPartyIndex(1);
      if (event.key.toLowerCase() === "e") interact();
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      const isArrow = event.key.startsWith("Arrow");
      const isMoveKey = isArrow || key === "w" || key === "a" || key === "s" || key === "d";
      if (isMoveKey) event.preventDefault();
      if (event.key === "ArrowUp" || key === "w") stopMoveLoop("up");
      if (event.key === "ArrowDown" || key === "s") stopMoveLoop("down");
      if (event.key === "ArrowLeft" || key === "a") stopMoveLoop("left");
      if (event.key === "ArrowRight" || key === "d") stopMoveLoop("right");
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      stopMoveLoop();
    };
  }, [state.mode, move, swapPartyIndex, interact]);

  if (!isHydrated) {
    return (
      <div className="retro-console p-6">
        <p className="text-sm text-slate-300">Loading saved game...</p>
      </div>
    );
  }

  if (!map) {
    return <p className="text-sm text-slate-300">Loading map...</p>;
  }

  return (
    <div className="mx-auto w-full max-w-[1200px] space-y-4 px-1.5 pb-4 sm:px-2">
      <div className="retro-console p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">DiFazio Monster Lab</h1>
          <div className="flex gap-2">
            <span className="retro-chip text-cyan-200">
              {state.mode === "battle" ? "Battle Mode" : "Overworld"}
            </span>
            <span className="retro-chip text-emerald-200">
              Saves: Auto
            </span>
          </div>
        </div>
        <p className="mt-2 text-sm text-slate-300">
          Retro-inspired sandbox RPG under active development. Isolated to <code>/game</code>.
        </p>
        <p className="mt-1 text-xs text-slate-400">Desktop: arrows/WASD • Interact: E • Mobile: touch D-pad.</p>
        <div className="mt-2 flex flex-wrap gap-2 text-xs">
          <span className="retro-chip text-slate-200">Map cast: {mapNpcs.length} characters</span>
          <span className="retro-chip text-slate-200">
            Trainers unbeaten: {mapNpcs.filter((n) => (n.role === "trainer" || n.role === "rival") && !state.defeatedTrainerIds.includes(n.id)).length}
          </span>
          <span className="retro-chip text-amber-200">Badges: {state.badges.length ? state.badges.join(", ") : "None"}</span>
          <span className="retro-chip text-emerald-200">Gym Stage: {state.gymProgress.lakeside ?? 0}/3</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="pixel-btn rounded px-2 py-1 text-xs text-slate-200" onClick={() => store.chooseAvatar("ace")} type="button">
            Avatar: Ace
          </button>
          <button className="pixel-btn rounded px-2 py-1 text-xs text-slate-200" onClick={() => store.chooseAvatar("blaze")} type="button">
            Avatar: Blaze
          </button>
          <button className="pixel-btn rounded px-2 py-1 text-xs text-slate-200" onClick={() => store.chooseAvatar("wave")} type="button">
            Avatar: Wave
          </button>
          <button className="pixel-btn rounded px-2 py-1 text-xs text-slate-200" onClick={() => store.chooseAvatar("shadow")} type="button">
            Avatar: Shadow
          </button>
        </div>
      </div>

      {!state.starterChosen ? <StarterPicker onChoose={store.chooseStarter} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_370px]">
        <div className="space-y-4">
          {state.mode === "battle" && state.battle ? (
            <BattleScene
              battle={state.battle}
              inventory={state.inventory}
              onMove={store.battleMove}
              onEnemyTurn={store.enemyTurn}
              onRun={store.runFromBattle}
              onUseItem={store.useItem}
              playerMonster={state.party[0]}
            />
          ) : (
            <>
              <div className="relative">
                <WorldCanvas map={map} npcs={mapNpcs} player={state.player} />
                {mapTransitioning ? <div className="animate-map-transition absolute inset-0 rounded-xl bg-slate-950/70" /> : null}
              </div>
              <MobileControls onMove={store.move} onOpenTeam={() => store.swapPartyIndex(1)} />
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  className="pixel-btn min-h-11 rounded bg-indigo-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={store.interact}
                  type="button"
                >
                  Interact (E)
                </button>
                <button
                  className="pixel-btn min-h-11 rounded bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => store.swapPartyIndex(1)}
                  type="button"
                >
                  Team Swap (T)
                </button>
              </div>
            </>
          )}
        </div>

        <div className="space-y-4">
          <TeamPanel onMakeLead={store.swapPartyIndex} party={state.party} storageCount={state.storage.length} />
          <SandboxPanel
            enabled={state.sandbox.enabled}
            encounterId={state.sandbox.guaranteedEncounter}
            onAddMonster={store.addSandboxMonster}
            onGrantItems={store.sandboxGrantItems}
            onHeal={store.sandboxHealAll}
            onSetEncounter={store.setSandboxEncounter}
            onTeleport={store.sandboxTeleport}
            onToggle={store.toggleSandbox}
          />
          <button
            className="pixel-btn w-full rounded-lg border border-rose-400/40 bg-rose-700 px-3 py-2 text-sm font-medium text-white hover:bg-rose-600"
            onClick={store.resetSave}
            type="button"
          >
            Reset Local Save
          </button>
        </div>
      </div>
      {state.activeDialog ? (
        <div className="retro-console p-3">
          <p className="text-sm text-slate-100">{state.activeDialog}</p>
          <button className="pixel-btn mt-2 rounded bg-slate-700 px-3 py-1 text-xs text-white" onClick={store.dismissDialog} type="button">
            Close
          </button>
        </div>
      ) : null}
    </div>
  );
}
