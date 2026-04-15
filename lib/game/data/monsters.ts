import { SpeciesData } from "@/lib/game/state/gameTypes";

const names = [
  "Spriglit",
  "Cindrip",
  "Brookit",
  "Voltlet",
  "Pebblit",
  "Whispry",
  "Brambug",
  "Ashmunk",
  "Droplet",
  "Zapkit",
  "Mossel",
  "Gravix",
  "Airsting",
  "Nightimp",
  "Rootle",
  "Blazette",
  "Ripplex",
  "Staticlaw",
  "Shardillo",
  "Breezard",
  "Fangrove",
  "Flarefox",
  "Tidera",
  "Voltusk",
  "Thornox",
  "Magmaul",
  "Coralisk",
  "Stormane",
  "Cragoon",
  "Skyrune",
  "Verdrake",
  "Pyrolisk",
  "Hydrill",
  "Arclion",
  "Basaltor",
  "Umbrawyrm",
];

const types: SpeciesData["type"][] = ["flora", "ember", "aqua", "volt", "stone", "gust", "void"];

const moveSetBank = [
  ["jab", "leaf_slice"],
  ["jab", "ember_pop"],
  ["jab", "aqua_dart"],
  ["jab", "spark_bite"],
  ["jab", "pebble_shot"],
  ["jab", "gust_pin"],
  ["jab", "void_pulse"],
];

export const SPECIES_LIST: SpeciesData[] = names.map((name, index) => {
  const type = types[index % types.length];
  const base = 42 + (index % 6) * 4;
  const moveIds = moveSetBank[index % moveSetBank.length];
  return {
    id: `m_${index + 1}`,
    name,
    type,
    baseHp: base + 14,
    baseAttack: base + 8,
    baseDefense: base + 4,
    baseSpeed: base + 6,
    catchRate: Math.max(35, 85 - (index % 8) * 6),
    xpYield: 30 + (index % 10) * 4,
    moveIds,
  };
});

export const SPECIES_INDEX = Object.fromEntries(SPECIES_LIST.map((s) => [s.id, s]));

export const STARTER_IDS = ["m_1", "m_2", "m_3"];
