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

export const GAME_MAPS: MapData[] = [town, routeNorth, forest, canyon, lakeside];
export const MAP_INDEX = Object.fromEntries(GAME_MAPS.map((m) => [m.id, m]));
