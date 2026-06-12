/* Dense, deterministic city map for the ground act — the phone Basemap's
   cartographic language (warm paper, white roads on warm casings, block
   fills, soft parks, the Asi river) redrawn at city scale so a full-viewport
   zoom still reads as a real place. Everything is generated with a seeded
   hash — no Math.random, so SSR and client agree pixel-for-pixel.

   The damage cluster (red/amber tinted blocks) sits around (945, 380),
   which is where the act drops its crisis pin. */

const W = 1500;
const H = 850;
const EPI = { x: 945, y: 380 };

/* Deterministic 0..1 hash. Integer ops only — Math.sin differs in the last
   bits between Node and the browser (per-engine libm), which breaks SSR
   hydration; Math.imul is bit-exact everywhere. */
const rnd = (i: number, salt: number) => {
  let h = (Math.imul(i + 1, 374761393) + Math.imul(salt + 1, 668265263)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

/* The Asi river hugs the bottom-left corner. */
const RIVER = "M -40 640 C 180 600, 320 700, 520 760 S 900 880, 1100 900";

/* Two street grids meeting at an angle — old town vs the newer district. */
interface Grid {
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
const GRIDS: Grid[] = [
  { angle: -7, cx: 450, cy: 350, x0: -150, x1: 820, y0: -60, y1: 700, stepX: 112, stepY: 92, salt: 1 },
  { angle: 12, cx: 1100, cy: 420, x0: 700, x1: 1650, y0: -80, y1: 760, stepX: 104, stepY: 88, salt: 2 },
];

function blocksFor(g: Grid) {
  const blocks: { x: number; y: number; w: number; h: number; r: number; fill: string }[] = [];
  let i = 0;
  for (let x = g.x0; x < g.x1; x += g.stepX) {
    for (let y = g.y0; y < g.y1; y += g.stepY) {
      i++;
      /* 1-2 buildings per cell, jittered inside it, river corner left clear */
      const n = rnd(i, g.salt) > 0.42 ? 2 : 1;
      for (let k = 0; k < n; k++) {
        const bx = x + 14 + rnd(i, g.salt + 3 + k) * (g.stepX - 60);
        const by = y + 12 + rnd(i, g.salt + 7 + k) * (g.stepY - 48);
        if (bx < 560 && by > 600) continue; // the river bend
        const bw = 24 + rnd(i, g.salt + 11 + k) * 30;
        const bh = 16 + rnd(i, g.salt + 13 + k) * 22;
        /* damage tint near the epicenter (in unrotated coords — close enough
           for a 7-12° grid rotation) */
        const d = Math.hypot(bx - EPI.x, by - EPI.y);
        let fill = rnd(i, g.salt + 17 + k) > 0.5 ? "#E7E2D7" : "#EDE8DD";
        if (d < 190 && rnd(i, g.salt + 19 + k) > 0.45) {
          fill = d < 110 ? "#F0BFB0" : "#F2DFAC";
        }
        blocks.push({ x: bx, y: by, w: bw, h: bh, r: rnd(i, g.salt + 23 + k) * 6 - 3, fill });
      }
    }
  }
  return blocks;
}

function gridLines(g: Grid) {
  const v: string[] = [];
  const h: string[] = [];
  for (let x = g.x0; x <= g.x1; x += g.stepX) v.push(`M ${x} ${g.y0 - 80} L ${x} ${g.y1 + 80}`);
  for (let y = g.y0; y <= g.y1; y += g.stepY) h.push(`M ${g.x0 - 80} ${y} L ${g.x1 + 80} ${y}`);
  return [...v, ...h];
}

const ARTERIALS = [
  `M -40 ${H * 0.36} C 360 ${H * 0.32}, 760 ${H * 0.42}, ${W + 40} ${H * 0.3}`,
  `M ${W * 0.42} -40 C ${W * 0.44} 300, ${W * 0.38} 560, ${W * 0.47} ${H + 40}`,
  `M -40 ${H * 0.62} C 400 ${H * 0.58}, 900 ${H * 0.68}, ${W + 40} ${H * 0.55}`,
];

const PARKS: [number, number, number, number][] = [
  [330, 210, 86, 52], [1180, 620, 96, 58], [760, 130, 64, 40], [1320, 250, 70, 44],
];

const LABELS: { x: number; y: number; text: string; size: number; italic?: boolean }[] = [
  { x: 700, y: 300, text: "Antakya", size: 30 },
  { x: 420, y: 180, text: "Odabaşı", size: 15, italic: true },
  { x: 1120, y: 530, text: "Haraparası", size: 15, italic: true },
  { x: 870, y: 480, text: "Ulucami", size: 14, italic: true },
  { x: 250, y: 700, text: "Asi Nehri", size: 14, italic: true },
];

/* Geometry is fully deterministic — compute once at module load so the parent
   re-rendering never re-runs the ~300-element generation. */
const GRID_RENDER = GRIDS.map((g) => ({ g, lines: gridLines(g), blocks: blocksFor(g) }));

export function GroundMap() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width={W}
      height={H}
      aria-hidden
      className="absolute left-0 top-0"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect width={W} height={H} fill="#F4F1EA" />

      {/* residential grids: faint casings, then white streets, then blocks */}
      {GRID_RENDER.map(({ g, lines, blocks }, gi) => (
        <g key={gi} transform={`rotate(${g.angle} ${g.cx} ${g.cy})`}>
          {lines.map((d, i) => (
            <path key={`c${i}`} d={d} fill="none" stroke="#E9E3D6" strokeWidth={7} />
          ))}
          {lines.map((d, i) => (
            <path key={`f${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth={4} />
          ))}
          {blocks.map((b, i) => (
            <rect
              key={`b${i}`}
              x={b.x}
              y={b.y}
              width={b.w}
              height={b.h}
              rx={2}
              fill={b.fill}
              transform={`rotate(${b.r} ${b.x + b.w / 2} ${b.y + b.h / 2})`}
            />
          ))}
        </g>
      ))}

      {/* parks over the blocks, soft */}
      {PARKS.map(([cx, cy, rx, ry], i) => (
        <ellipse key={i} cx={cx} cy={cy} rx={rx} ry={ry} fill="#D5E8C0" opacity={0.92} />
      ))}

      {/* the Asi */}
      <path d={RIVER} fill="none" stroke="#AFCFE3" strokeWidth={64} strokeLinecap="round" opacity={0.9} />
      <path d={RIVER} fill="none" stroke="#BFD9EA" strokeWidth={44} strokeLinecap="round" />
      {/* bridges */}
      <path d="M 365 600 L 415 668" stroke="#FFFFFF" strokeWidth={10} />
      <path d="M 615 728 L 655 800" stroke="#FFFFFF" strokeWidth={10} />

      {/* arterials over everything */}
      {ARTERIALS.map((d, i) => (
        <path key={`ac${i}`} d={d} fill="none" stroke="#E6E0D4" strokeWidth={16} />
      ))}
      {ARTERIALS.map((d, i) => (
        <path key={`af${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth={10} />
      ))}

      {LABELS.map((l) => (
        <text
          key={l.text}
          x={l.x}
          y={l.y}
          fontSize={l.size}
          fontWeight={l.size > 20 ? 500 : 400}
          fontStyle={l.italic ? "italic" : "normal"}
          fill={l.text === "Asi Nehri" ? "#7BA6C2" : "#8A909B"}
          letterSpacing="0.6"
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
}
