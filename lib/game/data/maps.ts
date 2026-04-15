import { MapData, MapTile } from "@/lib/game/state/gameTypes";

function idx(x: number, y: number, w: number) {
  return y * w + x;
}

function makeMap(id: string, name: string, width: number, height: number, spawnX: number, spawnY: number): MapData {
  const tiles: MapTile[] = Array.from({ length: width * height }, () => ({ kind: "ground" }));
  return { id, name, width, height, spawnX, spawnY, tiles };
}

function fillRect(map: MapData, x0: number, y0: number, x1: number, y1: number, kind: MapTile["kind"]) {
  for (let y = y0; y <= y1; y += 1) {
    for (let x = x0; x <= x1; x += 1) {
      if (x >= 0 && y >= 0 && x < map.width && y < map.height) {
        map.tiles[idx(x, y, map.width)] = { kind };
      }
    }
  }
}

function borderWalls(map: MapData) {
  fillRect(map, 0, 0, map.width - 1, 0, "wall");
  fillRect(map, 0, map.height - 1, map.width - 1, map.height - 1, "wall");
  fillRect(map, 0, 0, 0, map.height - 1, "wall");
  fillRect(map, map.width - 1, 0, map.width - 1, map.height - 1, "wall");
}

function setTile(map: MapData, x: number, y: number, tile: MapTile) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return;
  map.tiles[idx(x, y, map.width)] = tile;
}

const town = makeMap("starter_town", "Willow Town", 44, 28, 5, 21);
borderWalls(town);
fillRect(town, 2, 18, 41, 24, "path");
fillRect(town, 5, 4, 15, 12, "short_grass");
fillRect(town, 24, 4, 39, 12, "short_grass");
fillRect(town, 17, 16, 21, 24, "wall");
fillRect(town, 23, 16, 27, 24, "wall");
fillRect(town, 10, 14, 33, 17, "path");
for (let x = 3; x < 41; x += 2) setTile(town, x, 2, { kind: "tree" });
setTile(town, 42, 20, { kind: "portal", toMapId: "route_north", toX: 1, toY: 18 });

const routeNorth = makeMap("route_north", "Route Verdant", 52, 32, 1, 18);
borderWalls(routeNorth);
fillRect(routeNorth, 2, 16, 49, 21, "path");
fillRect(routeNorth, 4, 3, 18, 13, "tall_grass");
fillRect(routeNorth, 22, 6, 34, 14, "short_grass");
fillRect(routeNorth, 36, 3, 47, 15, "tall_grass");
fillRect(routeNorth, 9, 23, 42, 28, "water");
fillRect(routeNorth, 21, 23, 25, 28, "bridge");
for (let y = 3; y < 15; y += 2) setTile(routeNorth, 20, y, { kind: "tree" });
setTile(routeNorth, 1, 18, { kind: "portal", toMapId: "starter_town", toX: 41, toY: 20 });
setTile(routeNorth, 50, 18, { kind: "portal", toMapId: "forest_arc", toX: 1, toY: 20 });
setTile(routeNorth, 26, 30, { kind: "portal", toMapId: "canyon_pass", toX: 22, toY: 1 });

const forest = makeMap("forest_arc", "Moonfern Forest", 58, 34, 1, 20);
borderWalls(forest);
fillRect(forest, 2, 2, 55, 30, "tall_grass");
fillRect(forest, 2, 16, 55, 20, "path");
fillRect(forest, 10, 8, 16, 14, "water");
fillRect(forest, 30, 24, 38, 29, "water");
for (let y = 3; y < 31; y += 2) {
  for (let x = 3; x < 56; x += 3) {
    if ((x + y) % 5 === 0) setTile(forest, x, y, { kind: "tree" });
    if ((x + y) % 7 === 0) setTile(forest, x + 1, y, { kind: "bush" });
  }
}
setTile(forest, 1, 20, { kind: "portal", toMapId: "route_north", toX: 49, toY: 18 });
setTile(forest, 56, 20, { kind: "portal", toMapId: "lakeside", toX: 1, toY: 18 });

const canyon = makeMap("canyon_pass", "Crag Canyon", 46, 30, 22, 1);
borderWalls(canyon);
fillRect(canyon, 2, 3, 43, 7, "path");
fillRect(canyon, 2, 12, 43, 17, "path");
fillRect(canyon, 4, 20, 39, 26, "short_grass");
for (let x = 4; x < 42; x += 2) {
  setTile(canyon, x, 9, { kind: "wall" });
  if (x % 4 === 0) setTile(canyon, x, 10, { kind: "bush" });
}
setTile(canyon, 22, 1, { kind: "portal", toMapId: "route_north", toX: 26, toY: 29 });
setTile(canyon, 44, 14, { kind: "portal", toMapId: "lakeside", toX: 1, toY: 14 });

const lakeside = makeMap("lakeside", "Lakeside City", 52, 32, 1, 14);
borderWalls(lakeside);
fillRect(lakeside, 3, 3, 26, 12, "water");
fillRect(lakeside, 27, 3, 48, 12, "short_grass");
fillRect(lakeside, 2, 14, 49, 19, "path");
fillRect(lakeside, 12, 22, 20, 28, "wall");
fillRect(lakeside, 30, 22, 38, 28, "wall");
for (let x = 4; x < 47; x += 3) setTile(lakeside, x, 21, { kind: "tree" });
setTile(lakeside, 1, 14, { kind: "portal", toMapId: "canyon_pass", toX: 43, toY: 14 });
setTile(lakeside, 50, 18, { kind: "portal", toMapId: "forest_arc", toX: 55, toY: 20 });
setTile(lakeside, 16, 22, { kind: "portal", toMapId: "lakeside_gym_lobby", toX: 8, toY: 13 });
setTile(lakeside, 34, 22, { kind: "portal", toMapId: "lakeside_lab", toX: 8, toY: 11 });
setTile(lakeside, 26, 30, { kind: "portal", toMapId: "emberstep_plains", toX: 4, toY: 36 });

const gymLobby = makeMap("lakeside_gym_lobby", "Lakeside Gym Lobby", 18, 16, 8, 13);
borderWalls(gymLobby);
fillRect(gymLobby, 2, 2, 15, 13, "path");
fillRect(gymLobby, 4, 4, 6, 6, "short_grass");
fillRect(gymLobby, 11, 4, 13, 6, "short_grass");
setTile(gymLobby, 8, 15, { kind: "portal", toMapId: "lakeside", toX: 16, toY: 23 });
setTile(gymLobby, 8, 1, { kind: "portal", toMapId: "lakeside_gym_arena", toX: 10, toY: 17 });

const gymArena = makeMap("lakeside_gym_arena", "Lakeside Gym Arena", 22, 20, 10, 17);
borderWalls(gymArena);
fillRect(gymArena, 3, 3, 18, 16, "bridge");
fillRect(gymArena, 5, 5, 16, 14, "path");
fillRect(gymArena, 8, 7, 13, 12, "short_grass");
setTile(gymArena, 10, 19, { kind: "portal", toMapId: "lakeside_gym_lobby", toX: 8, toY: 2 });

const lakesideLab = makeMap("lakeside_lab", "Aether Lab", 18, 14, 8, 11);
borderWalls(lakesideLab);
fillRect(lakesideLab, 2, 2, 15, 11, "path");
fillRect(lakesideLab, 3, 3, 5, 4, "water");
fillRect(lakesideLab, 12, 3, 14, 4, "water");
setTile(lakesideLab, 8, 13, { kind: "portal", toMapId: "lakeside", toX: 34, toY: 23 });

const emberstepPlains = makeMap("emberstep_plains", "Emberstep Plains", 96, 72, 4, 36);
borderWalls(emberstepPlains);
fillRect(emberstepPlains, 3, 34, 92, 39, "path");
fillRect(emberstepPlains, 8, 8, 28, 28, "short_grass");
fillRect(emberstepPlains, 34, 10, 58, 28, "tall_grass");
fillRect(emberstepPlains, 64, 8, 90, 26, "short_grass");
fillRect(emberstepPlains, 14, 46, 40, 66, "tall_grass");
fillRect(emberstepPlains, 50, 48, 86, 66, "short_grass");
fillRect(emberstepPlains, 43, 46, 47, 66, "water");
fillRect(emberstepPlains, 43, 54, 47, 58, "bridge");
for (let y = 6; y < 68; y += 3) {
  for (let x = 6; x < 92; x += 4) {
    if ((x + y) % 9 === 0) setTile(emberstepPlains, x, y, { kind: "tree" });
    if ((x * y) % 17 === 0) setTile(emberstepPlains, x + 1, y, { kind: "bush" });
  }
}
setTile(emberstepPlains, 2, 36, { kind: "portal", toMapId: "lakeside", toX: 26, toY: 29 });
setTile(emberstepPlains, 93, 36, { kind: "portal", toMapId: "dreadmarsh", toX: 2, toY: 34 });
setTile(emberstepPlains, 48, 2, { kind: "portal", toMapId: "sunspire_highlands", toX: 50, toY: 71 });

const dreadmarsh = makeMap("dreadmarsh", "Dreadmarsh Lowlands", 92, 68, 2, 34);
borderWalls(dreadmarsh);
fillRect(dreadmarsh, 3, 31, 88, 36, "path");
fillRect(dreadmarsh, 6, 7, 34, 26, "tall_grass");
fillRect(dreadmarsh, 40, 8, 72, 30, "short_grass");
fillRect(dreadmarsh, 12, 42, 38, 62, "short_grass");
fillRect(dreadmarsh, 46, 40, 86, 64, "tall_grass");
fillRect(dreadmarsh, 28, 42, 62, 47, "water");
fillRect(dreadmarsh, 49, 42, 53, 47, "bridge");
for (let y = 5; y < 64; y += 2) {
  if (y % 6 === 0) fillRect(dreadmarsh, 8, y, 84, y, "bush");
}
for (let x = 10; x < 84; x += 5) {
  if (x % 10 === 0) fillRect(dreadmarsh, x, 10, x, 60, "tree");
}
setTile(dreadmarsh, 2, 34, { kind: "portal", toMapId: "emberstep_plains", toX: 92, toY: 36 });
setTile(dreadmarsh, 89, 34, { kind: "portal", toMapId: "umbral_woods", toX: 2, toY: 34 });

const sunspireHighlands = makeMap("sunspire_highlands", "Sunspire Highlands", 100, 74, 50, 71);
borderWalls(sunspireHighlands);
fillRect(sunspireHighlands, 3, 66, 96, 70, "path");
fillRect(sunspireHighlands, 5, 7, 42, 30, "short_grass");
fillRect(sunspireHighlands, 50, 7, 94, 28, "tall_grass");
fillRect(sunspireHighlands, 10, 38, 38, 60, "tall_grass");
fillRect(sunspireHighlands, 46, 40, 92, 64, "short_grass");
fillRect(sunspireHighlands, 18, 32, 84, 35, "path");
for (let y = 8; y < 66; y += 4) {
  for (let x = 8; x < 94; x += 6) {
    if ((x + y) % 8 === 0) setTile(sunspireHighlands, x, y, { kind: "tree" });
    if ((x + y) % 11 === 0) setTile(sunspireHighlands, x + 1, y, { kind: "bush" });
  }
}
setTile(sunspireHighlands, 50, 71, { kind: "portal", toMapId: "emberstep_plains", toX: 48, toY: 3 });
setTile(sunspireHighlands, 97, 38, { kind: "portal", toMapId: "obsidian_gate", toX: 2, toY: 33 });

const umbralWoods = makeMap("umbral_woods", "Umbral Woods", 98, 70, 2, 34);
borderWalls(umbralWoods);
fillRect(umbralWoods, 3, 31, 94, 36, "path");
fillRect(umbralWoods, 6, 6, 94, 28, "tall_grass");
fillRect(umbralWoods, 6, 40, 94, 64, "short_grass");
fillRect(umbralWoods, 22, 18, 32, 24, "water");
fillRect(umbralWoods, 62, 44, 78, 50, "water");
for (let y = 5; y < 66; y += 2) {
  for (let x = 5; x < 95; x += 3) {
    if ((x * 3 + y) % 7 === 0) setTile(umbralWoods, x, y, { kind: "tree" });
    if ((x + y) % 9 === 0) setTile(umbralWoods, x + 1, y, { kind: "bush" });
  }
}
setTile(umbralWoods, 2, 34, { kind: "portal", toMapId: "dreadmarsh", toX: 88, toY: 34 });
setTile(umbralWoods, 48, 2, { kind: "portal", toMapId: "obsidian_gate", toX: 45, toY: 63 });

const obsidianGate = makeMap("obsidian_gate", "Obsidian Gate", 90, 66, 2, 33);
borderWalls(obsidianGate);
fillRect(obsidianGate, 3, 30, 86, 36, "path");
fillRect(obsidianGate, 6, 8, 34, 24, "short_grass");
fillRect(obsidianGate, 40, 9, 84, 24, "tall_grass");
fillRect(obsidianGate, 10, 42, 38, 58, "short_grass");
fillRect(obsidianGate, 44, 42, 84, 60, "tall_grass");
for (let x = 5; x < 86; x += 3) {
  setTile(obsidianGate, x, 26, { kind: "wall" });
  if (x % 2 === 0) setTile(obsidianGate, x, 27, { kind: "bush" });
}
setTile(obsidianGate, 2, 33, { kind: "portal", toMapId: "sunspire_highlands", toX: 96, toY: 38 });
setTile(obsidianGate, 45, 63, { kind: "portal", toMapId: "umbral_woods", toX: 48, toY: 3 });
setTile(obsidianGate, 87, 33, { kind: "portal", toMapId: "eclipse_city", toX: 2, toY: 32 });

const eclipseCity = makeMap("eclipse_city", "Eclipse City", 88, 64, 2, 32);
borderWalls(eclipseCity);
fillRect(eclipseCity, 4, 5, 30, 24, "water");
fillRect(eclipseCity, 34, 5, 84, 24, "short_grass");
fillRect(eclipseCity, 3, 30, 84, 36, "path");
fillRect(eclipseCity, 10, 42, 24, 56, "wall");
fillRect(eclipseCity, 30, 42, 44, 56, "wall");
fillRect(eclipseCity, 50, 42, 64, 56, "wall");
fillRect(eclipseCity, 70, 42, 82, 56, "wall");
for (let x = 6; x < 84; x += 3) setTile(eclipseCity, x, 40, { kind: "tree" });
setTile(eclipseCity, 2, 32, { kind: "portal", toMapId: "obsidian_gate", toX: 86, toY: 33 });
setTile(eclipseCity, 20, 42, { kind: "portal", toMapId: "eclipse_gym_lobby", toX: 10, toY: 15 });
setTile(eclipseCity, 76, 42, { kind: "portal", toMapId: "dawn_sanctuary", toX: 4, toY: 30 });
setTile(eclipseCity, 44, 2, { kind: "portal", toMapId: "void_catacombs", toX: 3, toY: 28 });

const eclipseGymLobby = makeMap("eclipse_gym_lobby", "Eclipse Gym Lobby", 22, 18, 10, 15);
borderWalls(eclipseGymLobby);
fillRect(eclipseGymLobby, 2, 2, 19, 15, "path");
fillRect(eclipseGymLobby, 4, 4, 7, 7, "short_grass");
fillRect(eclipseGymLobby, 14, 4, 17, 7, "short_grass");
setTile(eclipseGymLobby, 10, 17, { kind: "portal", toMapId: "eclipse_city", toX: 20, toY: 43 });
setTile(eclipseGymLobby, 10, 1, { kind: "portal", toMapId: "eclipse_gym_arena", toX: 14, toY: 20 });

const eclipseGymArena = makeMap("eclipse_gym_arena", "Eclipse Gym Arena", 28, 22, 14, 20);
borderWalls(eclipseGymArena);
fillRect(eclipseGymArena, 3, 3, 24, 18, "bridge");
fillRect(eclipseGymArena, 6, 6, 21, 15, "path");
fillRect(eclipseGymArena, 10, 8, 17, 13, "short_grass");
setTile(eclipseGymArena, 14, 21, { kind: "portal", toMapId: "eclipse_gym_lobby", toX: 10, toY: 2 });

const dawnSanctuary = makeMap("dawn_sanctuary", "Dawn Sanctuary", 84, 60, 4, 30);
borderWalls(dawnSanctuary);
fillRect(dawnSanctuary, 3, 27, 80, 33, "path");
fillRect(dawnSanctuary, 6, 6, 26, 24, "short_grass");
fillRect(dawnSanctuary, 30, 6, 54, 24, "water");
fillRect(dawnSanctuary, 58, 6, 78, 24, "short_grass");
fillRect(dawnSanctuary, 8, 38, 78, 55, "tall_grass");
fillRect(dawnSanctuary, 42, 6, 44, 24, "bridge");
for (let x = 8; x < 78; x += 4) {
  if (x % 8 === 0) setTile(dawnSanctuary, x, 35, { kind: "tree" });
}
setTile(dawnSanctuary, 4, 30, { kind: "portal", toMapId: "eclipse_city", toX: 75, toY: 43 });
setTile(dawnSanctuary, 80, 30, { kind: "portal", toMapId: "void_catacombs", toX: 72, toY: 28 });

const voidCatacombs = makeMap("void_catacombs", "Void Catacombs", 76, 56, 3, 28);
borderWalls(voidCatacombs);
fillRect(voidCatacombs, 3, 25, 72, 31, "path");
fillRect(voidCatacombs, 8, 8, 26, 20, "tall_grass");
fillRect(voidCatacombs, 30, 8, 46, 20, "short_grass");
fillRect(voidCatacombs, 50, 8, 68, 20, "tall_grass");
fillRect(voidCatacombs, 10, 36, 66, 50, "short_grass");
for (let y = 6; y < 52; y += 3) {
  if (y % 6 === 0) fillRect(voidCatacombs, 6, y, 70, y, "wall");
}
setTile(voidCatacombs, 3, 28, { kind: "portal", toMapId: "eclipse_city", toX: 44, toY: 3 });
setTile(voidCatacombs, 72, 28, { kind: "portal", toMapId: "dawn_sanctuary", toX: 79, toY: 30 });

export const GAME_MAPS: MapData[] = [
  town,
  routeNorth,
  forest,
  canyon,
  lakeside,
  gymLobby,
  gymArena,
  lakesideLab,
  emberstepPlains,
  dreadmarsh,
  sunspireHighlands,
  umbralWoods,
  obsidianGate,
  eclipseCity,
  eclipseGymLobby,
  eclipseGymArena,
  dawnSanctuary,
  voidCatacombs,
];
export const MAP_INDEX = Object.fromEntries(GAME_MAPS.map((m) => [m.id, m]));
