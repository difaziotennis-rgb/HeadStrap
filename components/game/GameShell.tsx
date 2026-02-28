"use client";

import { useEffect, useRef, useState } from "react";
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
  const [cinematicHud, setCinematicHud] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showAvatars, setShowAvatars] = useState(false);
  const [showPanels, setShowPanels] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const objectiveText = nextObjectiveText(state.gymProgress.lakeside ?? 0, state.gymProgress.eclipse ?? 0);
  const chapterText = storyChapterLabel(state.gymProgress.lakeside ?? 0, state.gymProgress.eclipse ?? 0);
  const showRightRail = showPanels || showDevTools;

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
    <div className="mx-auto w-full max-w-[1020px] space-y-3 px-1 pb-3 sm:px-2">
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
        <p className="mt-2 text-sm text-slate-200">
          <span className="font-semibold text-cyan-200">Objective:</span> {objectiveText}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          <span className="font-semibold text-violet-200">Chapter:</span> {chapterText}
        </p>
        {state.lastWorldEvent ? (
          <p className="mt-1 text-xs text-amber-200">
            <span className="font-semibold">World Event:</span> {state.lastWorldEvent}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
            onClick={() => setShowPanels((prev) => !prev)}
            type="button"
          >
            {showPanels ? "Hide Team" : "Show Team"}
          </button>
          <button
            className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
            onClick={() => setShowInfo((prev) => !prev)}
            type="button"
          >
            {showInfo ? "Hide Details" : "Show Details"}
          </button>
          <button
            className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
            onClick={() => setShowAvatars((prev) => !prev)}
            type="button"
          >
            {showAvatars ? "Hide Avatars" : "Choose Avatar"}
          </button>
          <button
            className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
            onClick={() => setShowDevTools((prev) => !prev)}
            type="button"
          >
            {showDevTools ? "Hide Dev Tools" : "Show Dev Tools"}
          </button>
          <button
            className="pixel-btn rounded bg-slate-700 px-2 py-1 text-xs text-slate-200"
            onClick={() => setCinematicHud((prev) => !prev)}
            type="button"
          >
            HUD: {cinematicHud ? "Cinematic" : "Compact"}
          </button>
        </div>
        {showInfo ? (
          <div className="mt-2 flex flex-wrap gap-2 text-xs">
            <span className="retro-chip text-slate-200">Map cast: {mapNpcs.length} characters</span>
            <span className="retro-chip text-slate-200">
              Trainers unbeaten: {mapNpcs.filter((n) => (n.role === "trainer" || n.role === "rival") && !state.defeatedTrainerIds.includes(n.id)).length}
            </span>
            <span className="retro-chip text-amber-200">Badges: {state.badges.length ? state.badges.join(", ") : "None"}</span>
            <span className="retro-chip text-emerald-200">Lakeside Gym: {state.gymProgress.lakeside ?? 0}/3</span>
            <span className="retro-chip text-violet-200">Eclipse Gym: {state.gymProgress.eclipse ?? 0}/3</span>
            <span className="retro-chip text-cyan-200">Lore Relics: {state.loreItems.length}</span>
            <span className="retro-chip text-slate-300">Controls: Arrows/WASD, E interact, T next lead</span>
          </div>
        ) : null}
        {showAvatars ? (
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
        ) : null}
      </div>

      {!state.starterChosen ? <StarterPicker onChoose={store.chooseStarter} /> : null}

      <div className={`grid gap-3 ${showRightRail ? "lg:grid-cols-[1fr_350px]" : "grid-cols-1"}`}>
        <div className={`space-y-3 ${cinematicHud ? "" : "lg:max-w-[310px]"}`}>
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
              <MobileControls onInteract={store.interact} onMove={store.move} onOpenTeam={() => store.swapPartyIndex(1)} />
              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  className="pixel-btn min-h-11 rounded bg-indigo-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={store.interact}
                  type="button"
                >
                  Interact
                </button>
                <button
                  className="pixel-btn min-h-11 rounded bg-cyan-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => store.swapPartyIndex(1)}
                  type="button"
                >
                  Next Lead
                </button>
                <button
                  className="pixel-btn min-h-11 rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white"
                  onClick={() => setShowPanels((prev) => !prev)}
                  type="button"
                >
                  {showPanels ? "Hide Team" : "Show Team"}
                </button>
              </div>
            </>
          )}
        </div>

        {showRightRail ? (
          <div className="space-y-3">
            {showPanels ? <TeamPanel onMakeLead={store.swapPartyIndex} party={state.party} storageCount={state.storage.length} /> : null}
            {showDevTools ? (
              <>
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
              </>
            ) : null}
          </div>
        ) : null}
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

function nextObjectiveText(lakesideStage: number, eclipseStage: number) {
  if (lakesideStage <= 0) return "Reach Lakeside Gym and clear the first tide guardians";
  if (lakesideStage < 3) return "Complete Lakeside Gym and claim the Tidal Badge";
  if (eclipseStage <= 0) return "Travel east to Eclipse City through Emberstep and Obsidian Gate";
  if (eclipseStage < 3) return "Conquer Eclipse Gym's twilight and midnight trials";
  return "Enter Void Catacombs and push the dark tide back with your allies";
}

function storyChapterLabel(lakesideStage: number, eclipseStage: number) {
  if (lakesideStage <= 0) return "I - First Steps";
  if (lakesideStage < 3) return "II - Tidal Trial";
  if (eclipseStage <= 0) return "III - Long Road East";
  if (eclipseStage < 3) return "IV - Eclipse Oath";
  return "V - Dawn Against Shadow";
}
