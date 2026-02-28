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

function canChallengeTrainer(state: GameState, trainerId: string) {
  const npc = NPCS.find((n) => n.id === trainerId);
  if (!npc || !npc.gymKey || !npc.gymOrder) return { allowed: true, reason: null as string | null };
  if (npc.gymKey === "eclipse" && !state.badges.includes("Tidal Badge")) {
    return {
      allowed: false,
      reason: "The Eclipse Gym rejects challengers without the Tidal Badge.",
    };
  }
  const requiredOrder = npc.gymOrder - 1;
  if (requiredOrder <= 0) return { allowed: true, reason: null as string | null };
  const needed = NPCS.filter((n) => n.gymKey === npc.gymKey && n.gymOrder === requiredOrder && (n.role === "trainer" || n.role === "rival")).map((n) => n.id);
  const allCleared = needed.every((id) => state.defeatedTrainerIds.includes(id));
  if (!allCleared) {
    return {
      allowed: false,
      reason: `You must clear gym stage ${requiredOrder} before challenging ${npc.name}.`,
    };
  }
  return { allowed: true, reason: null as string | null };
}

function areaStoryBeat(mapId: string, gymProgress: Record<string, number>, badges: string[]) {
  const lakesideStage = gymProgress.lakeside ?? 0;
  const eclipseStage = gymProgress.eclipse ?? 0;
  if (mapId.includes("forest")) {
    return "The forest whispers with old magic. Stay brave and keep your light.";
  }
  if (mapId.includes("canyon")) {
    return "Shadows gather in the canyon, but heroes carve hope through stone.";
  }
  if (mapId.includes("lakeside_gym_arena")) {
    return lakesideStage >= 2
      ? "The gym core trembles with dark tide energy. Friendship is your anchor."
      : "A cold aura circles the arena. Train with purpose before the final challenge.";
  }
  if (mapId.includes("emberstep")) {
    return "Emberstep marks the second chapter: cross fear, gather allies, and keep your flame.";
  }
  if (mapId.includes("dreadmarsh")) {
    return "The marsh feeds on doubt. Stay close to your team and move with courage.";
  }
  if (mapId.includes("sunspire")) {
    return "At Sunspire, every step is a vow. Heroes rise by lifting others with them.";
  }
  if (mapId.includes("umbral_woods")) {
    return "Umbral Woods mirrors your heart: shadows deepen, but so does hope.";
  }
  if (mapId.includes("obsidian_gate")) {
    return "Obsidian Gate tests resolve. The dark tide cannot claim a united team.";
  }
  if (mapId.includes("eclipse_gym_lobby")) {
    return "Eclipse Gym challenge: twilight, midnight, then dawn. Trust is your lantern.";
  }
  if (mapId.includes("eclipse_gym_arena")) {
    return eclipseStage >= 2
      ? "The final eclipse trial begins. Friendship and courage must outshine fear."
      : "Only focused hearts pass the eclipse trials. Keep your team close.";
  }
  if (mapId.includes("eclipse_city")) {
    return badges.includes("Tidal Badge")
      ? "Eclipse City welcomes a proven hero. One more badge may steady the whole region."
      : "Eclipse City is tense. Earn the Tidal Badge before challenging its shadows.";
  }
  if (mapId.includes("void_catacombs")) {
    return "The catacombs whisper ancient grief. Carry hope, or be consumed by the hush.";
  }
  if (mapId.includes("dawn_sanctuary")) {
    return "Dawn Sanctuary reminds every hero: light returns, even after the longest night.";
  }
  if (mapId.includes("lakeside_gym_lobby")) {
    return "The gym halls test resolve: courage, trust, and control over fear.";
  }
  if (mapId.includes("lab")) {
    return "Ancient runes in the lab hint at a sleeping force beneath the region.";
  }
  if (mapId.includes("route")) {
    return "Every route is part of your hero's journey. Keep moving forward.";
  }
  return "Hope travels with you. A brighter future is built one battle at a time.";
}

function cinematicQuestBeat(mapId: string, questStage: number) {
  if (mapId === "emberstep_plains" && questStage < 1) {
    return {
      stage: 1,
      text: "Cinematic Event: The Emberstep sky darkens. A distant bell rings, and your team feels the coming eclipse.",
    };
  }
  if (mapId === "eclipse_city" && questStage < 2) {
    return {
      stage: 2,
      text: "Cinematic Event: Eclipse City's wards flicker. Citizens whisper your name as the last line of hope.",
    };
  }
  if (mapId === "void_catacombs" && questStage < 3) {
    return {
      stage: 3,
      text: "Cinematic Event: The catacombs breathe with ancient shadow. Your party's bond becomes your only lantern.",
    };
  }
  if (mapId === "dawn_sanctuary" && questStage < 4) {
    return {
      stage: 4,
      text: "Cinematic Event: At dawn, the sanctuary answers. Light and darkness meet, and your oath hardens.",
    };
  }
  return null;
}

function dynamicMapEvent(mapId: string, stepCounter: number, mapEventState: Record<string, number>) {
  const cooldown = mapEventState[mapId] ?? 0;
  if (stepCounter < cooldown) return null;
  const eventsByMap: Record<string, string[]> = {
    dreadmarsh: [
      "Dynamic Event: A mist surge cuts visibility. Nearby creatures grow bolder.",
      "Dynamic Event: A lantern spirit appears, then vanishes toward safer ground.",
    ],
    umbral_woods: [
      "Dynamic Event: Whispering branches reveal a hidden safe path for a moment.",
      "Dynamic Event: A shadow pulse ripples through the woods; your team steadies each other.",
    ],
    eclipse_city: [
      "Dynamic Event: City ward crystals flare bright, pushing darkness back for now.",
      "Dynamic Event: A crowd gathers to cheer your progress through the eclipse trials.",
    ],
  };
  const options = eventsByMap[mapId];
  if (!options || Math.random() > 0.07) return null;
  const line = options[Math.floor(Math.random() * options.length)];
  return {
    line,
    nextCooldown: stepCounter + 45,
  };
}

function inferAiPersonality(npcName: string, personality: string) {
  const text = `${npcName} ${personality}`.toLowerCase();
  if (text.includes("aggressive") || text.includes("brawler") || text.includes("marshal") || text.includes("hunter")) {
    return "aggressive" as const;
  }
  if (text.includes("calm") || text.includes("guardian") || text.includes("defensive") || text.includes("captain")) {
    return "defensive" as const;
  }
  if (text.includes("trickster") || text.includes("shadow") || text.includes("mystic") || text.includes("oracle")) {
    return "trickster" as const;
  }
  return "balanced" as const;
}

function inferWildAi(speciesId: string) {
  const type = SPECIES_INDEX[speciesId]?.type;
  if (type === "ember" || type === "stone") return "aggressive" as const;
  if (type === "aqua" || type === "flora") return "defensive" as const;
  if (type === "void" || type === "gust") return "trickster" as const;
  return "balanced" as const;
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
      const npcBlocking = NPCS.find(
        (npc) => npc.mapId === result.mapId && npc.x === result.x && npc.y === result.y,
      );
      if (npcBlocking) {
        return {
          ...prev,
          player: {
            ...prev.player,
            facing,
          },
        };
      }
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
        activeDialog: result.transitionedMap ? areaStoryBeat(result.mapId, prev.gymProgress, prev.badges) : null,
        lastWorldEvent: null,
      };
      const questBeat = result.transitionedMap ? cinematicQuestBeat(result.mapId, prev.questStage) : null;
      const worldEvent = dynamicMapEvent(result.mapId, next.player.stepCounter, prev.mapEventState);
      const withEvents = {
        ...next,
        questStage: questBeat ? questBeat.stage : prev.questStage,
        activeDialog: questBeat ? questBeat.text : next.activeDialog,
        lastWorldEvent: worldEvent?.line ?? null,
        mapEventState: worldEvent ? { ...prev.mapEventState, [result.mapId]: worldEvent.nextCooldown } : prev.mapEventState,
      };
      if (result.transitionedMap) {
        setMapTransitioning(true);
        setTimeout(() => setMapTransitioning(false), 240);
      }
      if (result.triggerEncounter && hasLivingMonster(withEvents)) {
        return {
          ...withEvents,
          mode: "battle",
          battle: {
            enemy: result.triggerEncounter,
            isWild: true,
            enemyName: SPECIES_INDEX[result.triggerEncounter.speciesId].name,
            isBoss: false,
            bossPhase: 1,
            aiPersonality: inferWildAi(result.triggerEncounter.speciesId),
            trainerId: undefined,
            trainerRoster: undefined,
            activePartyIndex: 0,
            log: [
              `A wild ${SPECIES_INDEX[result.triggerEncounter.speciesId].name} emerged from the veil.`,
              "A hush falls over the field. Stand with courage.",
            ],
            turn: 0,
            awaitingSwitch: false,
            encounterArea: result.mapId,
            pendingEnemyTurn: false,
          },
          sandbox: {
            ...withEvents.sandbox,
            guaranteedEncounter: null,
          },
        };
      }
      return withEvents;
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

      if (!faintedEnemy && battle.isBoss) {
        const hpRatio = enemyMonster.currentHp / Math.max(enemyMonster.maxHp, 1);
        const nextPhase = hpRatio <= 0.33 ? 3 : hpRatio <= 0.66 ? 2 : 1;
        if (nextPhase > battle.bossPhase) {
          const buffedEnemy = {
            ...enemyMonster,
            attack: enemyMonster.attack + (nextPhase === 2 ? 3 : 6),
            defense: enemyMonster.defense + (nextPhase === 2 ? 2 : 5),
            speed: enemyMonster.speed + (nextPhase === 2 ? 2 : 4),
          };
          enemyMonster = buffedEnemy;
          battle = {
            ...battle,
            bossPhase: nextPhase,
            log: [
              ...battle.log.slice(-7),
              nextPhase === 2
                ? `${battle.enemyName} enters Phase II - the arena darkens and power surges.`
                : `${battle.enemyName} enters Final Phase - void pressure rises!`,
            ],
          };
        }
      }

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
              bossPhase: battle.isBoss ? Math.max(1, battle.bossPhase) : 1,
              pendingEnemyTurn: false,
              log: [...battle.log.slice(-7), `${battle.enemyName} sent out ${SPECIES_INDEX[nextEnemy.speciesId].name}!`],
            },
          };
        }
        const gained = awardExperience(party[0], SPECIES_INDEX[enemyMonster.speciesId].xpYield);
        party[0] = gained.monster;
        const trainerWin = battle.trainerId ? !prev.defeatedTrainerIds.includes(battle.trainerId) : false;
        const trainerNpc = battle.trainerId ? NPCS.find((n) => n.id === battle.trainerId) : null;
        const nextBadges = [...prev.badges];
        const nextLore = [...prev.loreItems];
        if (trainerWin && trainerNpc?.badgeReward && !nextBadges.includes(trainerNpc.badgeReward)) {
          nextBadges.push(trainerNpc.badgeReward);
          const badgeLore = `lore_badge_${trainerNpc.badgeReward.toLowerCase().replace(/\s+/g, "_")}`;
          if (!nextLore.includes(badgeLore)) {
            nextLore.push(badgeLore);
          }
        }
        const nextGymProgress = { ...prev.gymProgress };
        if (trainerWin && trainerNpc?.gymKey && trainerNpc?.gymOrder) {
          nextGymProgress[trainerNpc.gymKey] = Math.max(nextGymProgress[trainerNpc.gymKey] ?? 0, trainerNpc.gymOrder);
        }
        return {
          ...prev,
          party,
          mode: "world",
          battle: null,
          defeatedTrainerIds: trainerWin ? [...prev.defeatedTrainerIds, battle.trainerId as string] : prev.defeatedTrainerIds,
          badges: nextBadges,
          loreItems: nextLore,
          gymProgress: nextGymProgress,
          activeDialog: trainerWin
            ? trainerNpc?.badgeReward
              ? `${trainerNpc.followupLine} You received ${trainerNpc.badgeReward}. A new light pushes back the dark tide.`
              : `${trainerNpc?.name ?? "Trainer"} defeated.`
            : "Wild battle complete. Your bond grows stronger.",
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
      const res = applyEnemyMove(battle, playerMonster, enemyMonster, battle.aiPersonality);
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
        const gate = canChallengeTrainer(prev, npc.id);
        if (!gate.allowed) {
          return {
            ...prev,
            activeDialog: gate.reason,
          };
        }
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
            isBoss: Boolean(npc.badgeReward),
            bossPhase: 1,
            aiPersonality: inferAiPersonality(npc.name, npc.personality),
            trainerId: npc.id,
            trainerRoster: roster,
            activePartyIndex: 0,
            log: [
              `${npc.trainerClass ? `${npc.trainerClass} ${npc.name}` : npc.name}: "${npc.introLine}"`,
              "This clash will test fear, faith, and friendship.",
              `${npc.name} sent out ${SPECIES_INDEX[speciesId].name}!`,
            ],
            turn: 0,
            awaitingSwitch: false,
            encounterArea: npc.mapId,
            pendingEnemyTurn: false,
          },
          activeDialog: null,
        };
      }

      const loreByNpc: Record<string, { id: string; line: string }> = {
        npc_29: { id: "lore_aether_tablet", line: "Lore found: Aether Tablet - 'Dark tides answer unresolved grief.'" },
        npc_41: { id: "lore_oath_bark", line: "Lore found: Oath Bark - 'Heroes swore to carry each other through the eclipse.'" },
        npc_55: { id: "lore_dawn_chime", line: "Lore found: Dawn Chime - 'Hope is strongest when shared aloud.'" },
      };
      const loreDrop = loreByNpc[npc.id];
      const gainsLore = loreDrop && !prev.loreItems.includes(loreDrop.id);

      return {
        ...prev,
        loreItems: gainsLore ? [...prev.loreItems, loreDrop.id] : prev.loreItems,
        activeDialog: gainsLore ? `${npc.name}: ${npc.introLine} ${loreDrop.line}` : `${npc.name}: ${npc.introLine}`,
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
