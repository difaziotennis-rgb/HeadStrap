import { EncounterEntry } from "@/lib/game/state/gameTypes";

export const ENCOUNTER_TABLES: Record<string, EncounterEntry[]> = {
  starter_town: [
    { speciesId: "m_4", minLevel: 2, maxLevel: 4, weight: 30 },
    { speciesId: "m_5", minLevel: 2, maxLevel: 4, weight: 20 },
    { speciesId: "m_6", minLevel: 3, maxLevel: 5, weight: 10 },
  ],
  route_north: [
    { speciesId: "m_7", minLevel: 3, maxLevel: 5, weight: 20 },
    { speciesId: "m_8", minLevel: 3, maxLevel: 6, weight: 18 },
    { speciesId: "m_9", minLevel: 4, maxLevel: 6, weight: 15 },
    { speciesId: "m_10", minLevel: 4, maxLevel: 7, weight: 12 },
    { speciesId: "m_11", minLevel: 5, maxLevel: 7, weight: 10 },
  ],
  canyon_pass: [
    { speciesId: "m_18", minLevel: 6, maxLevel: 8, weight: 20 },
    { speciesId: "m_19", minLevel: 6, maxLevel: 8, weight: 20 },
    { speciesId: "m_20", minLevel: 7, maxLevel: 9, weight: 15 },
    { speciesId: "m_21", minLevel: 7, maxLevel: 10, weight: 12 },
    { speciesId: "m_22", minLevel: 8, maxLevel: 10, weight: 8 },
  ],
};
