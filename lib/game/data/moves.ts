import { MoveData } from "@/lib/game/state/gameTypes";

export const MOVE_INDEX: Record<string, MoveData> = {
  jab: { id: "jab", name: "Jab", type: "stone", power: 36, accuracy: 95, pp: 30, category: "physical" },
  spark_bite: { id: "spark_bite", name: "Spark Bite", type: "volt", power: 46, accuracy: 92, pp: 20, category: "physical" },
  aqua_dart: { id: "aqua_dart", name: "Aqua Dart", type: "aqua", power: 42, accuracy: 98, pp: 25, category: "special" },
  ember_pop: { id: "ember_pop", name: "Ember Pop", type: "ember", power: 40, accuracy: 99, pp: 25, category: "special" },
  leaf_slice: { id: "leaf_slice", name: "Leaf Slice", type: "flora", power: 44, accuracy: 95, pp: 25, category: "physical" },
  pebble_shot: { id: "pebble_shot", name: "Pebble Shot", type: "stone", power: 48, accuracy: 90, pp: 20, category: "physical" },
  gust_pin: { id: "gust_pin", name: "Gust Pin", type: "gust", power: 50, accuracy: 90, pp: 15, category: "special" },
  void_pulse: { id: "void_pulse", name: "Void Pulse", type: "void", power: 55, accuracy: 88, pp: 15, category: "special" },
  focus_up: { id: "focus_up", name: "Focus Up", type: "stone", power: 0, accuracy: 100, pp: 20, category: "status" },
};

export const STARTER_MOVESET = ["jab", "ember_pop", "leaf_slice", "aqua_dart"];
