/* Paints the city ground texture onto a canvas — the same cartography the
   old GroundMap SVG drew (warm paper, white streets on warm casings, the
   river, parks, district labels), but consumed as a THREE texture under the
   3D building field. Client-only (canvas API). */

import {
  CITY_W, CITY_H, BLOCKS, STREETS, RIVER_PATH, ARTERIALS, BRIDGES, PARKS,
  LABELS, HERO_STREET, rnd, type CityBlock,
} from "./cityLayout";

const TEX_W = 2048;
const SCALE = TEX_W / CITY_W;
const TEX_H = Math.round(CITY_H * SCALE);

const TINT_FILL: Record<CityBlock["tint"], string> = {
  base: "#E3DDD0",
  light: "#EAE4D8",
  amber: "#EFDCAB",
  red: "#EDBBAB",
};

export function paintCityTexture(): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);

  ctx.fillStyle = "#F4F1EA";
  ctx.fillRect(0, 0, CITY_W, CITY_H);

  /* residential streets: warm casing, then white fill */
  ctx.lineCap = "round";
  for (const pass of [
    { stroke: "#E9E3D6", width: 8 },
    { stroke: "#FFFFFF", width: 5 },
  ]) {
    ctx.strokeStyle = pass.stroke;
    ctx.lineWidth = pass.width;
    ctx.beginPath();
    for (const s of STREETS) {
      ctx.moveTo(s.x1, s.z1);
      ctx.lineTo(s.x2, s.z2);
    }
    ctx.stroke();
  }

  /* block footprints — foundations under the 3D buildings */
  for (const b of BLOCKS) {
    ctx.save();
    ctx.translate(b.x, b.z);
    ctx.rotate((b.rot * Math.PI) / 180);
    ctx.fillStyle = TINT_FILL[b.tint];
    ctx.fillRect((-b.w / 2) * 1.3, (-b.d / 2) * 1.3, b.w * 1.3, b.d * 1.3);
    ctx.restore();
  }

  /* parks */
  for (const [cx, cz, rx, rz] of PARKS) {
    ctx.beginPath();
    ctx.ellipse(cx, cz, rx, rz, 0, 0, Math.PI * 2);
    ctx.fillStyle = "#D5E8C0";
    ctx.globalAlpha = 0.95;
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  /* the Asi */
  const river = new Path2D(RIVER_PATH);
  ctx.strokeStyle = "#AFCFE3";
  ctx.lineWidth = 64;
  ctx.globalAlpha = 0.9;
  ctx.stroke(river);
  ctx.globalAlpha = 1;
  ctx.strokeStyle = "#BFD9EA";
  ctx.lineWidth = 44;
  ctx.stroke(river);

  for (const b of BRIDGES) {
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(b.x1, b.z1);
    ctx.lineTo(b.x2, b.z2);
    ctx.stroke();
  }

  /* arterials over everything */
  for (const d of ARTERIALS) {
    const p = new Path2D(d);
    ctx.strokeStyle = "#E6E0D4";
    ctx.lineWidth = 16;
    ctx.stroke(p);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 10;
    ctx.stroke(p);
  }

  /* the landing street — a real road under the camera's feet */
  const heroRoad = new Path2D(
    `M ${HERO_STREET.x1} ${HERO_STREET.z1} L ${HERO_STREET.x2} ${HERO_STREET.z2}`,
  );
  ctx.strokeStyle = "#E0D9CB";
  ctx.lineWidth = 16;
  ctx.stroke(heroRoad);
  ctx.strokeStyle = "#FBFAF7";
  ctx.lineWidth = 11;
  ctx.stroke(heroRoad);
  ctx.save();
  ctx.setLineDash([5, 7]);
  ctx.strokeStyle = "#CFC8BA";
  ctx.lineWidth = 0.9;
  ctx.stroke(heroRoad);
  ctx.restore();

  /* debris shadow under the collapsed wing's rubble field */
  ctx.beginPath();
  ctx.ellipse(941, 388, 14, 10, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(118, 98, 80, 0.2)";
  ctx.fill();

  /* labels — visible from the bird's-eye beat, part of the maquette charm */
  ctx.fillStyle = "#8A909B";
  for (const l of LABELS) {
    ctx.font = `${l.italic ? "italic " : ""}${l.size > 20 ? 500 : 400} ${l.size}px "Noto Sans", sans-serif`;
    ctx.fillStyle = l.water ? "#7BA6C2" : "#8A909B";
    ctx.fillText(l.text, l.x, l.z);
  }

  return canvas;
}


/* ------------------------------------------------------- street patch -- */

export const PATCH = { cx: 948, cz: 408, size: 240 };

/* World → patch-canvas transform helper baked into ctx.setTransform. */
export function paintStreetPatch(): HTMLCanvasElement {
  const px = 2048;
  const scale = px / PATCH.size; // ~8.5 px/m
  const canvas = document.createElement("canvas");
  canvas.width = px;
  canvas.height = px;
  const ctx = canvas.getContext("2d")!;
  ctx.setTransform(scale, 0, 0, scale, -((PATCH.cx - PATCH.size / 2) * scale), -((PATCH.cz - PATCH.size / 2) * scale));

  ctx.fillStyle = "#F4F1EA";
  ctx.fillRect(PATCH.cx - PATCH.size / 2, PATCH.cz - PATCH.size / 2, PATCH.size, PATCH.size);

  /* gentle paper mottling so the foreground isn't a void */
  for (let i = 0; i < 260; i++) {
    const x = PATCH.cx - PATCH.size / 2 + rnd(i, 401) * PATCH.size;
    const z = PATCH.cz - PATCH.size / 2 + rnd(i, 409) * PATCH.size;
    ctx.beginPath();
    ctx.ellipse(x, z, 1.6 + rnd(i, 411) * 3.4, 1.2 + rnd(i, 413) * 2.6, rnd(i, 417) * 3.14, 0, Math.PI * 2);
    ctx.fillStyle = rnd(i, 419) > 0.5 ? "rgba(120,104,84,0.045)" : "rgba(255,255,255,0.05)";
    ctx.fill();
  }

  /* nearby grid streets that cross the patch */
  ctx.lineCap = "round";
  for (const pass of [
    { stroke: "#E7E1D3", width: 8 },
    { stroke: "#FCFBF8", width: 5.4 },
  ]) {
    ctx.strokeStyle = pass.stroke;
    ctx.lineWidth = pass.width;
    ctx.beginPath();
    for (const sLine of STREETS) {
      ctx.moveTo(sLine.x1, sLine.z1);
      ctx.lineTo(sLine.x2, sLine.z2);
    }
    ctx.stroke();
  }

  /* the landing street, full treatment: casing, asphalt-paper, sidewalk
     edges, centre dashes */
  const road = new Path2D(`M ${HERO_STREET.x1} ${HERO_STREET.z1} L ${HERO_STREET.x2} ${HERO_STREET.z2}`);
  ctx.strokeStyle = "#DDD6C7";
  ctx.lineWidth = 17;
  ctx.stroke(road);
  ctx.strokeStyle = "#FBFAF6";
  ctx.lineWidth = 12;
  ctx.stroke(road);
  ctx.save();
  ctx.setLineDash([2.4, 3.2]);
  ctx.strokeStyle = "#C9C2B2";
  ctx.lineWidth = 0.5;
  ctx.stroke(road);
  ctx.restore();

  /* rubble spill onto the street in front of the collapsed wing */
  for (let i = 0; i < 70; i++) {
    const x = 941 + (rnd(i, 431) - 0.5) * 22;
    const z = 389 + (rnd(i, 433) - 0.2) * 16;
    ctx.beginPath();
    ctx.ellipse(x, z, 0.4 + rnd(i, 437) * 1.1, 0.3 + rnd(i, 439) * 0.9, rnd(i, 441) * 3.14, 0, Math.PI * 2);
    ctx.fillStyle = rnd(i, 443) > 0.6 ? "rgba(190,120,98,0.4)" : "rgba(132,114,92,0.38)";
    ctx.fill();
  }
  ctx.beginPath();
  ctx.ellipse(941, 388, 15, 11, 0.3, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(118, 98, 80, 0.16)";
  ctx.fill();

  return canvas;
}
