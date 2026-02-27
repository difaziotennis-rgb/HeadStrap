export type ElementType =
  | "flora"
  | "ember"
  | "aqua"
  | "volt"
  | "stone"
  | "gust"
  | "void";

export type MoveCategory = "physical" | "special" | "status";

export type Facing = "up" | "down" | "left" | "right";

export type WorldMode = "world" | "battle" | "team";

export type ItemId = "capture_orb" | "super_orb" | "potion" | "mega_potion";

export interface MoveData {
  id: string;
  name: string;
  type: ElementType;
  power: number;
  accuracy: number;
  pp: number;
  category: MoveCategory;
}

export interface SpeciesData {
  id: string;
  name: string;
  type: ElementType;
  baseHp: number;
  baseAttack: number;
  baseDefense: number;
  baseSpeed: number;
  catchRate: number;
  xpYield: number;
  moveIds: string[];
}

export interface MonsterMove {
  moveId: string;
  currentPp: number;
}

export interface MonsterInstance {
  uid: string;
  speciesId: string;
  level: number;
  exp: number;
  maxHp: number;
  currentHp: number;
  attack: number;
  defense: number;
  speed: number;
  moves: MonsterMove[];
}

export interface EncounterEntry {
  speciesId: string;
  minLevel: number;
  maxLevel: number;
  weight: number;
}

export interface MapTile {
  kind:
    | "ground"
    | "wall"
    | "grass"
    | "water"
    | "portal"
    | "tree"
    | "bush"
    | "path"
    | "tall_grass"
    | "short_grass"
    | "bridge";
  toMapId?: string;
  toX?: number;
  toY?: number;
}

export interface MapData {
  id: string;
  name: string;
  width: number;
  height: number;
  spawnX: number;
  spawnY: number;
  tiles: MapTile[];
}

export interface BattleState {
  enemy: MonsterInstance;
  isWild: boolean;
  enemyName: string;
  trainerId?: string;
  trainerRoster?: MonsterInstance[];
  activePartyIndex: number;
  log: string[];
  turn: number;
  awaitingSwitch: boolean;
  encounterArea: string;
  pendingEnemyTurn: boolean;
}

export interface PlayerState {
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  stepCounter: number;
  avatarId: string;
}

export interface SandboxState {
  enabled: boolean;
  guaranteedEncounter: string | null;
}

export interface GameState {
  mode: WorldMode;
  player: PlayerState;
  party: MonsterInstance[];
  storage: MonsterInstance[];
  inventory: Record<ItemId, number>;
  visitedMaps: string[];
  battle: BattleState | null;
  sandbox: SandboxState;
  starterChosen: boolean;
  lastSavedAt: number | null;
  defeatedTrainerIds: string[];
  activeDialog: string | null;
}

export interface NpcCharacter {
  id: string;
  name: string;
  mapId: string;
  x: number;
  y: number;
  facing: Facing;
  role: "trainer" | "villager" | "merchant" | "rival";
  personality: string;
  introLine: string;
  followupLine: string;
  trainerSpeciesIds?: string[];
  trainerLevels?: number[];
}

export interface BattleMoveResult {
  nextState: BattleState;
  playerMonster: MonsterInstance;
  enemyMonster: MonsterInstance;
  faintedEnemy: boolean;
  faintedPlayer: boolean;
}
