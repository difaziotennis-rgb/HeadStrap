import { EncounterEntry } from "@/lib/game/state/gameTypes";

export const ENCOUNTER_TABLES: Record<string, EncounterEntry[]> = {
  starter_town: [
    { speciesId: "m_4", minLevel: 2, maxLevel: 4, weight: 24 },
    { speciesId: "m_5", minLevel: 2, maxLevel: 4, weight: 22 },
    { speciesId: "m_6", minLevel: 3, maxLevel: 5, weight: 16 },
    { speciesId: "m_12", minLevel: 3, maxLevel: 5, weight: 8 },
  ],
  route_north: [
    { speciesId: "m_7", minLevel: 4, maxLevel: 6, weight: 20 },
    { speciesId: "m_8", minLevel: 4, maxLevel: 7, weight: 18 },
    { speciesId: "m_9", minLevel: 5, maxLevel: 7, weight: 15 },
    { speciesId: "m_10", minLevel: 5, maxLevel: 8, weight: 12 },
    { speciesId: "m_11", minLevel: 6, maxLevel: 8, weight: 10 },
    { speciesId: "m_15", minLevel: 7, maxLevel: 9, weight: 7 },
  ],
  forest_arc: [
    { speciesId: "m_13", minLevel: 6, maxLevel: 9, weight: 18 },
    { speciesId: "m_14", minLevel: 6, maxLevel: 9, weight: 15 },
    { speciesId: "m_15", minLevel: 7, maxLevel: 10, weight: 14 },
    { speciesId: "m_21", minLevel: 8, maxLevel: 10, weight: 12 },
    { speciesId: "m_24", minLevel: 8, maxLevel: 11, weight: 10 },
    { speciesId: "m_31", minLevel: 10, maxLevel: 12, weight: 5 },
  ],
  canyon_pass: [
    { speciesId: "m_18", minLevel: 8, maxLevel: 10, weight: 20 },
    { speciesId: "m_19", minLevel: 8, maxLevel: 10, weight: 20 },
    { speciesId: "m_20", minLevel: 9, maxLevel: 11, weight: 15 },
    { speciesId: "m_21", minLevel: 9, maxLevel: 12, weight: 12 },
    { speciesId: "m_22", minLevel: 10, maxLevel: 12, weight: 8 },
    { speciesId: "m_35", minLevel: 12, maxLevel: 14, weight: 4 },
  ],
  lakeside: [
    { speciesId: "m_23", minLevel: 10, maxLevel: 12, weight: 18 },
    { speciesId: "m_27", minLevel: 11, maxLevel: 13, weight: 14 },
    { speciesId: "m_30", minLevel: 11, maxLevel: 14, weight: 12 },
    { speciesId: "m_33", minLevel: 12, maxLevel: 15, weight: 10 },
    { speciesId: "m_36", minLevel: 13, maxLevel: 15, weight: 6 },
  ],
};
