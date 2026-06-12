/* One source of truth for the Antakya maquette: the ground-texture painter
   and the 3D building field both consume this layout, so the map you fly
   over IS the city you land in. All coordinates are meters; the city plane
   is 1500×850 with the same frame the old GroundMap SVG used (x east,
   z south). The crisis epicenter — the hero collapsed building, the beacon,
   the street the camera lands on — sits at (945, 380). Everything is
   generated with an integer hash (Math.imul), never Math.sin/random:
   deterministic across engines. */

export const CITY_W = 1500;
export const CITY_H = 850;
export const EPI = { x: 945, z: 380 };

/* Where the camera ends: standing on the street south of the hero building,
   eye height, building sitting left-of-center so the DOM phone (right side)
   never covers it. */
export const STREET_CAM = { x: 952, y: 1.7, z: 434 };
export const HERO_LOOK = { x: 943, y: 6.2, z: 382 };

/* Deterministic 0..1 hash — integer ops only (SSR/engine safe). */
export const rnd = (i: number, salt: number) => {
  let h = (Math.imul(i + 1, 374761393) + Math.imul(salt + 1, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/* Two street grids meeting at an angle — old town vs the newer district. */
export interface Grid {
  angle: number;
  cx: number;
  cy: number;
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  stepX: number;
  stepY: number;
  salt: number;
}
export const GRIDS: Grid[] = [
  { angle: -7, cx: 450, cy: 350, x0: -150, x1: 820, y0: -60, y1: 700, stepX: 112, stepY: 92, salt: 1 },
  { angle: 12, cx: 1100, cy: 420, x0: 700, x1: 1650, y0: -80, y1: 760, stepX: 104, stepY: 88, salt: 2 },
];

/* The camera's landing corridor and the hero block are kept free of
   procedural buildings — hand-placed geometry owns those spots. */
const CLEAR_ZONES: { x: number; z: number; r: number }[] = [
  { x: EPI.x, z: EPI.z, r: 34 },
  { x: 950, z: 420, r: 36 },
  { x: 952, z: 446, r: 30 },
  /* the swoop lane — the camera glides low over these blocks on final */
  { x: 958, z: 488, r: 30 },
  { x: 972, z: 540, r: 34 },
];

export type Tint = "base" | "light" | "amber" | "red";

export interface CityBlock {
  x: number; // center, world meters
  z: number;
  w: number;
  d: number;
  rot: number; // degrees, grid angle + jitter
  h: number; // building height, meters
  tint: Tint;
}

const deg = Math.PI / 180;

/* Rotate a grid-local point into world coordinates. */
function gridToWorld(g: Grid, lx: number, lz: number) {
  const a = g.angle * deg;
  const dx = lx - g.cx;
  const dz = lz - g.cy;
  return {
    x: g.cx + dx * Math.cos(a) - dz * Math.sin(a),
    z: g.cy + dx * Math.sin(a) + dz * Math.cos(a),
  };
}

function inRiver(x: number, z: number) {
  return x < 560 && z > 600;
}
function inClearZone(x: number, z: number) {
  return CLEAR_ZONES.some((c) => Math.hypot(x - c.x, z - c.z) < c.r);
}

function blocksFor(g: Grid): CityBlock[] {
  const blocks: CityBlock[] = [];
  let i = 0;
  for (let lx = g.x0; lx < g.x1; lx += g.stepX) {
    for (let lz = g.y0; lz < g.y1; lz += g.stepY) {
      i++;
      const n = rnd(i, g.salt) > 0.42 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const bw = 24 + rnd(i, g.salt + 11 + k) * 30;
        const bd = 16 + rnd(i, g.salt + 13 + k) * 22;
        const blx = lx + 14 + rnd(i, g.salt + 3 + k) * (g.stepX - 60) + bw / 2;
        const blz = lz + 12 + rnd(i, g.salt + 7 + k) * (g.stepY - 48) + bd / 2;
        if (blx < 560 && blz > 600) continue; // grid-local river guard (legacy)
        const { x, z } = gridToWorld(g, blx, blz);
        if (x < -10 || x > CITY_W + 10 || z < -10 || z > CITY_H + 10) continue;
        if (inRiver(x, z) || inClearZone(x, z)) continue;

        /* height: low-rise town, a few towers — exaggerated like a maquette */
        let h = 10 + rnd(i, g.salt + 31 + k) * 20;
        if (rnd(i, g.salt + 37 + k) > 0.93) h = 38 + rnd(i, g.salt + 41 + k) * 14;

        /* damage tint near the epicenter */
        const dist = Math.hypot(x - EPI.x, z - EPI.z);
        let tint: Tint = rnd(i, g.salt + 17 + k) > 0.5 ? "base" : "light";
        if (dist < 190 && rnd(i, g.salt + 19 + k) > 0.45) {
          tint = dist < 110 ? "red" : "amber";
          if (tint === "red" && rnd(i, g.salt + 43 + k) > 0.6) h *= 0.5; // partially down
        }
        blocks.push({
          x,
          z,
          w: bw * 0.62, // building inside its lot
          d: bd * 0.62,
          rot: g.angle + rnd(i, g.salt + 23 + k) * 6 - 3,
          h,
          tint,
        });
      }
    }
  }
  return blocks;
}

export const BLOCKS: CityBlock[] = GRIDS.flatMap(blocksFor);

/* Street centerlines in world space, for the texture painter. */
export interface StreetLine {
  x1: number;
  z1: number;
  x2: number;
  z2: number;
}
function gridStreets(g: Grid): StreetLine[] {
  const lines: StreetLine[] = [];
  for (let lx = g.x0; lx <= g.x1; lx += g.stepX) {
    const a = gridToWorld(g, lx, g.y0 - 80);
    const b = gridToWorld(g, lx, g.y1 + 80);
    lines.push({ x1: a.x, z1: a.z, x2: b.x, z2: b.z });
  }
  for (let lz = g.y0; lz <= g.y1; lz += g.stepY) {
    const a = gridToWorld(g, g.x0 - 80, lz);
    const b = gridToWorld(g, g.x1 + 80, lz);
    lines.push({ x1: a.x, z1: a.z, x2: b.x, z2: b.z });
  }
  return lines;
}
export const STREETS: StreetLine[] = GRIDS.flatMap(gridStreets);

/* SVG path strings — Path2D draws them straight onto the texture canvas. */
export const RIVER_PATH = "M -40 640 C 180 600, 320 700, 520 760 S 900 880, 1100 900";
export const ARTERIALS = [
  `M -40 ${CITY_H * 0.36} C 360 ${CITY_H * 0.32}, 760 ${CITY_H * 0.42}, ${CITY_W + 40} ${CITY_H * 0.3}`,
  `M ${CITY_W * 0.42} -40 C ${CITY_W * 0.44} 300, ${CITY_W * 0.38} 560, ${CITY_W * 0.47} ${CITY_H + 40}`,
  `M -40 ${CITY_H * 0.62} C 400 ${CITY_H * 0.58}, 900 ${CITY_H * 0.68}, ${CITY_W + 40} ${CITY_H * 0.55}`,
];
export const BRIDGES: StreetLine[] = [
  { x1: 365, z1: 600, x2: 415, z2: 668 },
  { x1: 615, z1: 728, x2: 655, z2: 800 },
];

export const PARKS: [number, number, number, number][] = [
  [330, 210, 86, 52], [1180, 620, 96, 58], [760, 130, 64, 40], [1320, 250, 70, 44],
];

export const LABELS: { x: number; z: number; text: string; size: number; italic?: boolean }[] = [
  { x: 700, z: 300, text: "Antakya", size: 30 },
  { x: 420, z: 180, text: "Odabaşı", size: 15, italic: true },
  { x: 1120, z: 530, text: "Haraparası", size: 15, italic: true },
  { x: 870, z: 480, text: "Ulucami", size: 14, italic: true },
  { x: 250, z: 700, text: "Asi Nehri", size: 14, italic: true },
];

/* The camera's street, drawn explicitly so the landing spot is a real road. */
export const HERO_STREET: StreetLine = { x1: 951, z1: 462, x2: 942, z2: 368 };

/* Trees — clustered in parks plus a few strays; crowns + trunks instanced. */
export interface Tree {
  x: number;
  z: number;
  s: number; // crown scale
}
export const TREES: Tree[] = (() => {
  const t: Tree[] = [];
  PARKS.forEach(([cx, cz, rx, rz], p) => {
    const n = 7;
    for (let i = 0; i < n; i++) {
      const a = rnd(i, p * 17 + 5) * Math.PI * 2;
      const r = Math.sqrt(rnd(i, p * 17 + 9));
      t.push({
        x: cx + Math.cos(a) * rx * 0.8 * r,
        z: cz + Math.sin(a) * rz * 0.8 * r,
        s: 0.8 + rnd(i, p * 17 + 13) * 0.6,
      });
    }
  });
  for (let i = 0; i < 14; i++) {
    const x = 60 + rnd(i, 71) * (CITY_W - 120);
    const z = 50 + rnd(i, 73) * (CITY_H - 100);
    if (inRiver(x, z) || inClearZone(x, z)) continue;
    t.push({ x, z, s: 0.7 + rnd(i, 79) * 0.5 });
  }
  return t;
})();

/* Hand-placed urban canyon along the landing street + the hero composition.
   rot in degrees; tint groups match the procedural ones. */
export const FLANKS: CityBlock[] = [
  /* left wall of the canyon */
  { x: 936, z: 412, w: 10, d: 14, rot: 12, h: 12, tint: "light" },
  { x: 934, z: 430, w: 9, d: 12, rot: 12, h: 15, tint: "amber" },
  { x: 935, z: 396, w: 9, d: 11, rot: 12, h: 10, tint: "red" },
  /* right wall */
  { x: 966, z: 408, w: 11, d: 14, rot: 12, h: 13, tint: "light" },
  { x: 967, z: 426, w: 9, d: 12, rot: 12, h: 9, tint: "base" },
  { x: 968, z: 390, w: 10, d: 13, rot: 12, h: 16, tint: "amber" },
  /* backdrop behind the hero */
  { x: 930, z: 370, w: 10, d: 12, rot: 12, h: 13, tint: "base" },
  { x: 962, z: 366, w: 10, d: 12, rot: 12, h: 11, tint: "light" },
  { x: 945, z: 358, w: 12, d: 12, rot: 12, h: 15, tint: "amber" },
];

/* The reported building: one wing still standing (four floors), one wing
   pancaked into tilted slabs and rubble. The beacon rises from the seam. */
export const HERO = {
  intact: { x: 949.5, z: 379, w: 7.5, d: 11.5, rot: 12, h: 13 },
  slabs: [
    { x: 941, y: 1.1, z: 386.5, rx: 0.1, ry: 0.2, rz: 0.3, w: 8.2, t: 0.8, d: 10 },
    { x: 942.8, y: 2.6, z: 383.2, rx: -0.24, ry: 0.5, rz: -0.16, w: 7.6, t: 0.8, d: 9 },
    { x: 940, y: 4.1, z: 381, rx: 0.3, ry: 0.1, rz: 0.22, w: 7, t: 0.8, d: 8 },
    { x: 942.4, y: 5.3, z: 379.4, rx: -0.18, ry: 0.34, rz: 0.34, w: 5.8, t: 0.7, d: 6.6 },
  ],
  rubbleCenter: { x: 941, z: 387 },
};

export const RUBBLE = Array.from({ length: 11 }, (_, i) => ({
  x: HERO.rubbleCenter.x + (rnd(i, 101) - 0.5) * 14,
  z: HERO.rubbleCenter.z + (rnd(i, 103) - 0.3) * 11,
  s: 0.8 + rnd(i, 107) * 1.5,
  ry: rnd(i, 109) * Math.PI,
}));

/* Camera path for the city flight, sampled by the rig and by the DOM
   altitude HUD (approximate y interpolation is fine for the readout). */
export const CAM_WAYPOINTS: [number, number, number][] = [
  [1165, 640, 1060],
  [1095, 370, 885],
  [1018, 150, 655],
  [988, 70, 568],
  [960, 22, 480],
  [STREET_CAM.x, STREET_CAM.y, STREET_CAM.z],
];

export function camAltitudeAt(u: number) {
  const ys = CAM_WAYPOINTS.map((w) => w[1]);
  const t = Math.min(0.9999, Math.max(0, u)) * (ys.length - 1);
  const i = Math.floor(t);
  return ys[i] + (ys[i + 1] - ys[i]) * (t - i);
}

/* Flight pacing shared by rig + HUD: p (act progress) → curve parameter. */
export const FLIGHT_END = 0.62; // act progress where the camera reaches the street
export function flightU(p: number) {
  const n = Math.min(1, Math.max(0, p / FLIGHT_END));
  return 1 - Math.pow(1 - n, 2.1); // fast out of the clouds, soft landing
}
