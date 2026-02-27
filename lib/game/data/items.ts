import { ItemId } from "@/lib/game/state/gameTypes";

export type ItemData = {
  id: ItemId;
  name: string;
  battleOnly: boolean;
  healAmount?: number;
  catchBonus?: number;
};

export const ITEM_INDEX: Record<ItemId, ItemData> = {
  capture_orb: { id: "capture_orb", name: "Capture Orb", battleOnly: true, catchBonus: 1 },
  super_orb: { id: "super_orb", name: "Super Orb", battleOnly: true, catchBonus: 1.5 },
  potion: { id: "potion", name: "Potion", battleOnly: true, healAmount: 20 },
  mega_potion: { id: "mega_potion", name: "Mega Potion", battleOnly: true, healAmount: 45 },
};
