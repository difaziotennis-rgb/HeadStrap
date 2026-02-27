"use client";

import { useEffect } from "react";
import { BattleScene } from "@/components/game/BattleScene";
import { MobileControls } from "@/components/game/MobileControls";
import { SandboxPanel } from "@/components/game/SandboxPanel";
import { StarterPicker } from "@/components/game/StarterPicker";
import { TeamPanel } from "@/components/game/TeamPanel";
import { WorldCanvas } from "@/components/game/WorldCanvas";
import { useGameStore } from "@/lib/game/state/gameStore";

export function GameShell() {
  const store = useGameStore();
  const { state, map, isHydrated } = store;

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (state.mode !== "world") return;
      if (event.key === "ArrowUp" || event.key.toLowerCase() === "w") store.move("up");
      if (event.key === "ArrowDown" || event.key.toLowerCase() === "s") store.move("down");
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") store.move("left");
      if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") store.move("right");
      if (event.key.toLowerCase() === "t") store.swapPartyIndex(1);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.mode, store]);

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
    <div className="space-y-4">
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
        <p className="mt-1 text-xs text-slate-400">
          Desktop: arrows/WASD • Mobile: touch D-pad • Battles: action timer + narrated turn flow.
        </p>
      </div>

      {!state.starterChosen ? <StarterPicker onChoose={store.chooseStarter} /> : null}

      <div className="grid gap-4 lg:grid-cols-[1fr_370px]">
        <div className="space-y-4">
          {state.mode === "battle" && state.battle ? (
            <BattleScene
              battle={state.battle}
              inventory={state.inventory}
              onMove={store.battleMove}
              onRun={store.runFromBattle}
              onUseItem={store.useItem}
              playerMonster={state.party[0]}
            />
          ) : (
            <>
              <WorldCanvas map={map} player={state.player} />
              <MobileControls onMove={store.move} onOpenTeam={() => store.swapPartyIndex(1)} />
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
    </div>
  );
}
