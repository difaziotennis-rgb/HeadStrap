import { MapData, MapTile } from "@/lib/game/state/gameTypes";

function makeTiles(rows: string[]): MapTile[] {
  const tileMap: Record<string, MapTile["kind"]> = {
    ".": "ground",
    "#": "wall",
    "g": "grass",
    "w": "water",
    "p": "portal",
  };
  return rows.flatMap((row) =>
    row.split("").map((char) => ({
      kind: tileMap[char] ?? "ground",
    })),
  );
}

const starterTownRows = [
  "####################",
  "#.............ggggp#",
  "#..######.....gggg.#",
  "#..#....#..........#",
  "#..#....#..........#",
  "#..#....#..........#",
  "#..######....#######",
  "#..........g.......#",
  "#....ggggggg.......#",
  "#....ggggggg.......#",
  "#..........#########",
  "#..................#",
  "####################",
];

const routeNorthRows = [
  "####################",
  "#pgggggg...ggggggg.#",
  "#.gggggg...ggggggg.#",
  "#.gggg...######....#",
  "#.....ggg#....#....#",
  "#.....ggg#....#....#",
  "#.....ggg#....#....#",
  "#.....ggg######....#",
  "#..................#",
  "#....wwwww.........#",
  "#....wwwww.........#",
  "#.................p#",
  "####################",
];

const canyonRows = [
  "####################",
  "#p....#####........#",
  "#.....#...#....gg..#",
  "#.....#...#....gg..#",
  "#..####...####.gg..#",
  "#..#.........#.....#",
  "#..#..wwww...#.....#",
  "#..#..wwww...#.....#",
  "#..#.........#.....#",
  "#..###########.....#",
  "#.............gggg.#",
  "#.............gggg.#",
  "####################",
];

export const GAME_MAPS: MapData[] = [
  {
    id: "starter_town",
    name: "Starter Town",
    width: 20,
    height: 13,
    spawnX: 2,
    spawnY: 2,
    tiles: makeTiles(starterTownRows).map((tile, idx) => {
      const x = idx % 20;
      const y = Math.floor(idx / 20);
      if (tile.kind === "portal" && x === 18 && y === 1) {
        return { ...tile, toMapId: "route_north", toX: 1, toY: 1 };
      }
      return tile;
    }),
  },
  {
    id: "route_north",
    name: "Route North",
    width: 20,
    height: 13,
    spawnX: 1,
    spawnY: 1,
    tiles: makeTiles(routeNorthRows).map((tile, idx) => {
      const x = idx % 20;
      const y = Math.floor(idx / 20);
      if (tile.kind === "portal" && x === 1 && y === 1) {
        return { ...tile, toMapId: "starter_town", toX: 17, toY: 1 };
      }
      if (tile.kind === "portal" && x === 18 && y === 11) {
        return { ...tile, toMapId: "canyon_pass", toX: 1, toY: 1 };
      }
      return tile;
    }),
  },
  {
    id: "canyon_pass",
    name: "Canyon Pass",
    width: 20,
    height: 13,
    spawnX: 1,
    spawnY: 1,
    tiles: makeTiles(canyonRows).map((tile, idx) => {
      const x = idx % 20;
      const y = Math.floor(idx / 20);
      if (tile.kind === "portal" && x === 1 && y === 1) {
        return { ...tile, toMapId: "route_north", toX: 17, toY: 11 };
      }
      return tile;
    }),
  },
];

export const MAP_INDEX = Object.fromEntries(GAME_MAPS.map((m) => [m.id, m]));
