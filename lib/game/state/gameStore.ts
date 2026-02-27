"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ITEM_INDEX } from "@/lib/game/data/items";
import { MAP_INDEX } from "@/lib/game/data/maps";
import { SPECIES_INDEX } from "@/lib/game/data/monsters";
import { NPCS } from "@/lib/game/data/npcs";
import { applyEnemyMove, applyPlayerMove, attemptCapture, awardExperience, useHealingItem } from "@/lib/game/engine/battleEngine";
import { createMonsterInstance } from "@/lib/game/engine/worldFactory";
import { movePlayer } from "@/lib/game/engine/worldEngine";
import { Facing, GameState, ItemId } from "@/lib/game/state/gameTypes";
import { clearGameState, createInitialState, loadGameState, saveGameState } from "@/lib/game/state/saveStore";

function hasLivingMonster(state: GameState) {
  return state.party.some((m) => m.currentHp > 0);
}

export function useGameStore() {
  const [state, setState] = useState<GameState>(createInitialState);
  const [isHydrated, setIsHydrated] = useState(false);
  const [mapTransitioning, setMapTransitioning] = useState(false);

  useEffect(() => {
    setState(loadGameState());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    saveGameState(state);
  }, [state, isHydrated]);

  const map = MAP_INDEX[state.player.mapId];
  const activeMonster = state.party[0];
  const enemyMonster = state.battle?.enemy ?? null;
  const mapNpcs = NPCS.filter((n) => n.mapId === state.player.mapId);

  const getAdjacentNpc = useCallback((prev: GameState) => {
    return NPCS.find((npc) => {
      if (npc.mapId !== prev.player.mapId) return false;
      const dx = Math.abs(npc.x - prev.player.x);
      const dy = Math.abs(npc.y - prev.player.y);
      return dx + dy === 1;
    });
  }, []);

  const move = useCallback((facing: Facing) => {
    setState((prev) => {
      if (prev.mode !== "world") return prev;
      const result = movePlayer(
        prev.player.mapId,
        prev.player.x,
        prev.player.y,
        facing,
        prev.player.stepCounter,
        prev.sandbox.enabled ? prev.sandbox.guaranteedEncounter : null,
      );
      const next = {
        ...prev,
        player: {
          ...prev.player,
          mapId: result.mapId,
          x: result.x,
          y: result.y,
          facing,
          stepCounter: prev.player.stepCounter + (result.moved ? 1 : 0),
        },
        visitedMaps: prev.visitedMaps.includes(result.mapId) ? prev.visitedMaps : [...prev.visitedMaps, result.mapId],
        activeDialog: null,
      };
      if (result.transitionedMap) {
        setMapTransitioning(true);
        setTimeout(() => setMapTransitioning(false), 240);
      }
      if (result.triggerEncounter && hasLivingMonster(next)) {
        return {
          ...next,
          mode: "battle",
          battle: {
            enemy: result.triggerEncounter,
            isWild: true,
            enemyName: SPECIES_INDEX[result.triggerEncounter.speciesId].name,
            trainerId: undefined,
            trainerRoster: undefined,
            activePartyIndex: 0,
            log: [`A wild ${SPECIES_INDEX[result.triggerEncounter.speciesId].name} appeared!`],
            turn: 0,
            awaitingSwitch: false,
            encounterArea: result.mapId,
            pendingEnemyTurn: false,
          },
          sandbox: {
            ...next.sandbox,
            guaranteedEncounter: null,
          },
        };
      }
      return next;
    });
  }, []);

  const chooseStarter = useCallback((speciesId: string) => {
    setState((prev) => {
      if (prev.starterChosen) return prev;
      return {
        ...prev,
        starterChosen: true,
        party: [createMonsterInstance(speciesId, 5)],
      };
    });
  }, []);

  const chooseAvatar = useCallback((avatarId: string) => {
    setState((prev) => ({
      ...prev,
      player: {
        ...prev.player,
        avatarId,
      },
    }));
  }, []);

  const runFromBattle = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== "battle" || !prev.battle) return prev;
      const escaped = Math.random() > 0.35;
      if (!escaped) {
        return {
          ...prev,
          battle: {
            ...prev.battle,
            log: [...prev.battle.log.slice(-7), "Couldn't escape!"],
          },
        };
      }
      return {
        ...prev,
        mode: "world",
        battle: null,
        activeDialog: "You escaped from the battle.",
      };
    });
  }, []);

  const useItem = useCallback((itemId: ItemId) => {
    setState((prev) => {
      if ((prev.inventory[itemId] ?? 0) <= 0) return prev;
      if (prev.mode === "battle" && prev.battle) {
        const nextInv = { ...prev.inventory, [itemId]: prev.inventory[itemId] - 1 };
        if (itemId === "capture_orb" || itemId === "super_orb") {
          const bonus = ITEM_INDEX[itemId].catchBonus ?? 1;
          const caught = attemptCapture(prev.battle.enemy, bonus);
          if (caught) {
            const nextMonster = { ...prev.battle.enemy, uid: `${prev.battle.enemy.uid}_caught` };
            const hasRoom = prev.party.length < 6;
            return {
              ...prev,
              mode: "world",
              battle: null,
              inventory: nextInv,
              party: hasRoom ? [...prev.party, nextMonster] : prev.party,
              storage: hasRoom ? prev.storage : [...prev.storage, nextMonster],
              activeDialog: `You captured ${SPECIES_INDEX[nextMonster.speciesId].name}!`,
            };
          }
          return {
            ...prev,
            inventory: nextInv,
            battle: {
              ...prev.battle,
              log: [...prev.battle.log.slice(-7), "The monster broke free!"],
            },
          };
        }
        if (itemId === "potion" || itemId === "mega_potion") {
          const active = prev.party[0];
          const healed = useHealingItem(active, itemId);
          const nextParty = [...prev.party];
          nextParty[0] = healed;
          return {
            ...prev,
            inventory: nextInv,
            party: nextParty,
            battle: {
              ...prev.battle,
              log: [...prev.battle.log.slice(-7), `${SPECIES_INDEX[active.speciesId].name} recovered HP.`],
            },
          };
        }
      }
      return prev;
    });
  }, []);

  const battleMove = useCallback((moveIndex: number) => {
    setState((prev) => {
      if (prev.mode !== "battle" || !prev.battle) return prev;
      if (prev.battle.pendingEnemyTurn) return prev;
      const playerMonster = prev.party[0];
      let enemyMonster = prev.battle.enemy;
      let battle = prev.battle;

      let party = [...prev.party];
      const res = applyPlayerMove(battle, party[0], enemyMonster, moveIndex);
      battle = res.nextState;
      party[0] = res.playerMonster;
      enemyMonster = res.enemyMonster;
      const faintedEnemy = res.faintedEnemy;

      if (faintedEnemy) {
        if (battle.trainerId && battle.trainerRoster && battle.trainerRoster.length > 0) {
          const [nextEnemy, ...rest] = battle.trainerRoster;
          return {
            ...prev,
            party,
            battle: {
              ...battle,
              enemy: nextEnemy,
              trainerRoster: rest,
              pendingEnemyTurn: false,
              log: [...battle.log.slice(-7), `${battle.enemyName} sent out ${SPECIES_INDEX[nextEnemy.speciesId].name}!`],
            },
          };
        }
        const gained = awardExperience(party[0], SPECIES_INDEX[enemyMonster.speciesId].xpYield);
        party[0] = gained.monster;
        const trainerWin = battle.trainerId ? !prev.defeatedTrainerIds.includes(battle.trainerId) : false;
        return {
          ...prev,
          party,
          mode: "world",
          battle: null,
          defeatedTrainerIds: trainerWin ? [...prev.defeatedTrainerIds, battle.trainerId as string] : prev.defeatedTrainerIds,
          activeDialog: trainerWin
            ? "Trainer defeated. Their route checkpoint is now clear."
            : "Wild battle complete.",
        };
      }

      return {
        ...prev,
        party,
        battle: {
          ...battle,
          enemy: enemyMonster,
          pendingEnemyTurn: true,
        },
      };
    });
  }, []);

  const enemyTurn = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== "battle" || !prev.battle) return prev;
      if (!prev.battle.pendingEnemyTurn) return prev;
      const party = [...prev.party];
      const playerMonster = party[0];
      const enemyMonster = prev.battle.enemy;
      const battle = prev.battle;
      const res = applyEnemyMove(battle, playerMonster, enemyMonster);
      party[0] = res.playerMonster;
      const nextEnemy = res.enemyMonster;

      if (res.faintedPlayer) {
        const nextActiveIdx = party.findIndex((m) => m.currentHp > 0);
        if (nextActiveIdx === -1) {
          return {
            ...prev,
            mode: "world",
            battle: null,
            player: {
              ...prev.player,
              mapId: "starter_town",
              x: 5,
              y: 21,
            },
            party: prev.party.map((m) => ({ ...m, currentHp: m.maxHp })),
            activeDialog: "Your team blacked out and was restored in Willow Town.",
          };
        }
        const nextParty = [...party];
        const [nextActive] = nextParty.splice(nextActiveIdx, 1);
        nextParty.unshift(nextActive);
        return {
          ...prev,
          party: nextParty,
          battle: {
            ...res.nextState,
            enemy: nextEnemy,
            pendingEnemyTurn: false,
            log: [...res.nextState.log.slice(-7), `${SPECIES_INDEX[nextActive.speciesId].name}, go!`],
          },
        };
      }

      return {
        ...prev,
        party,
        battle: {
          ...res.nextState,
          enemy: nextEnemy,
          pendingEnemyTurn: false,
        },
      };
    });
  }, []);

  const interact = useCallback(() => {
    setState((prev) => {
      if (prev.mode !== "world") return prev;
      const npc = getAdjacentNpc(prev);
      if (!npc) {
        return {
          ...prev,
          activeDialog: "No one is close enough to talk. Move next to a character and press Interact.",
        };
      }

      if (npc.role === "trainer" || npc.role === "rival") {
        const alreadyDefeated = prev.defeatedTrainerIds.includes(npc.id);
        if (alreadyDefeated) {
          return {
            ...prev,
            activeDialog: `${npc.name}: ${npc.followupLine}`,
          };
        }
        const speciesId = npc.trainerSpeciesIds?.[0] ?? "m_7";
        const level = npc.trainerLevels?.[0] ?? 8;
        const roster = (npc.trainerSpeciesIds ?? []).slice(1).map((sId, i) => createMonsterInstance(sId, npc.trainerLevels?.[i + 1] ?? level + i + 1));
        return {
          ...prev,
          mode: "battle",
          battle: {
            enemy: createMonsterInstance(speciesId, level),
            isWild: false,
            enemyName: npc.name,
            trainerId: npc.id,
            trainerRoster: roster,
            activePartyIndex: 0,
            log: [`${npc.name}: "${npc.introLine}"`, `${npc.name} sent out ${SPECIES_INDEX[speciesId].name}!`],
            turn: 0,
            awaitingSwitch: false,
            encounterArea: npc.mapId,
            pendingEnemyTurn: false,
          },
          activeDialog: null,
        };
      }

      return {
        ...prev,
        activeDialog: `${npc.name}: ${npc.introLine}`,
      };
    });
  }, [getAdjacentNpc]);

  const dismissDialog = useCallback(() => {
    setState((prev) => ({ ...prev, activeDialog: null }));
  }, []);

  const swapPartyIndex = useCallback((index: number) => {
    setState((prev) => {
      if (index <= 0 || index >= prev.party.length) return prev;
      const party = [...prev.party];
      const [picked] = party.splice(index, 1);
      party.unshift(picked);
      return { ...prev, party };
    });
  }, []);

  const setSandboxEncounter = useCallback((speciesId: string | null) => {
    setState((prev) => ({
      ...prev,
      sandbox: {
        ...prev.sandbox,
        guaranteedEncounter: speciesId,
      },
    }));
  }, []);

  const toggleSandbox = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sandbox: {
        ...prev.sandbox,
        enabled: !prev.sandbox.enabled,
      },
    }));
  }, []);

  const sandboxHealAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      party: prev.party.map((m) => ({ ...m, currentHp: m.maxHp })),
    }));
  }, []);

  const sandboxGrantItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      inventory: {
        capture_orb: (prev.inventory.capture_orb ?? 0) + 15,
        super_orb: (prev.inventory.super_orb ?? 0) + 8,
        potion: (prev.inventory.potion ?? 0) + 10,
        mega_potion: (prev.inventory.mega_potion ?? 0) + 5,
      },
    }));
  }, []);

  const sandboxTeleport = useCallback((mapId: string) => {
    setState((prev) => {
      const target = MAP_INDEX[mapId];
      if (!target) return prev;
      return {
        ...prev,
        mode: "world",
        battle: null,
        player: {
          ...prev.player,
          mapId: target.id,
          x: target.spawnX,
          y: target.spawnY,
        },
        visitedMaps: prev.visitedMaps.includes(target.id) ? prev.visitedMaps : [...prev.visitedMaps, target.id],
      };
    });
  }, []);

  const addSandboxMonster = useCallback((speciesId: string, level: number) => {
    setState((prev) => {
      const next = createMonsterInstance(speciesId, level);
      if (prev.party.length < 6) {
        return { ...prev, party: [...prev.party, next] };
      }
      return { ...prev, storage: [...prev.storage, next] };
    });
  }, []);

  const resetSave = useCallback(() => {
    clearGameState();
    setState(createInitialState());
  }, []);

  return useMemo(
    () => ({
      state,
      map,
      activeMonster,
      enemyMonster,
      move,
      chooseStarter,
      battleMove,
      enemyTurn,
      runFromBattle,
      useItem,
      swapPartyIndex,
      setSandboxEncounter,
      toggleSandbox,
      sandboxHealAll,
      sandboxGrantItems,
      sandboxTeleport,
      addSandboxMonster,
      resetSave,
      isHydrated,
      mapTransitioning,
      mapNpcs,
      chooseAvatar,
      interact,
      dismissDialog,
    }),
    [
      state,
      map,
      activeMonster,
      enemyMonster,
      move,
      chooseStarter,
      battleMove,
      enemyTurn,
      runFromBattle,
      useItem,
      swapPartyIndex,
      setSandboxEncounter,
      toggleSandbox,
      sandboxHealAll,
      sandboxGrantItems,
      sandboxTeleport,
      addSandboxMonster,
      resetSave,
      isHydrated,
      mapTransitioning,
      mapNpcs,
      chooseAvatar,
      interact,
      dismissDialog,
    ],
  );
}
