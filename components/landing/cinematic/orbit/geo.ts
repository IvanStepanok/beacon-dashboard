/* Geometry helpers for the orbit scene.

   Land dots use the GitHub-globe recipe: rasterize the world-atlas land
   topojson onto an offscreen canvas (equirectangular is just a linear map, no
   projection lib needed), then walk latitude bands placing dots proportionally
   to each band's circumference (cos(lat)) so the poles don't cluster, keeping
   only dots whose pixel lands on land. ~12k dots at the chosen density. */
import * as THREE from "three";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson";
import land110 from "world-atlas/land-110m.json";

/* Canonical lat/lng → unit-sphere position (matches three.js equirect UV
   mapping: -x at lng -180, so textures/dots/markers all agree). */
export function latLngToVector3(lat: number, lng: number, r: number) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta),
  );
}

const MASK_W = 1024;
const MASK_H = 512;

function rasterizeLandMask(): Uint8ClampedArray {
  const topo = land110 as unknown as Topology<{ land: GeometryCollection }>;
  const land = feature(topo, topo.objects.land) as FeatureCollection<MultiPolygon | Polygon>;

  const canvas = document.createElement("canvas");
  canvas.width = MASK_W;
  canvas.height = MASK_H;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, MASK_W, MASK_H);
  ctx.fillStyle = "#fff";

  const px = (lng: number) => ((lng + 180) / 360) * MASK_W;
  /* Image row 0 is lat +90 — flipping this renders the continents upside down. */
  const py = (lat: number) => ((90 - lat) / 180) * MASK_H;

  ctx.beginPath();
  for (const f of land.features) {
    const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
    for (const rings of polys) {
      for (const ring of rings) {
        ring.forEach(([lng, lat], i) => {
          if (i === 0) ctx.moveTo(px(lng), py(lat));
          else ctx.lineTo(px(lng), py(lat));
        });
        ctx.closePath();
      }
    }
  }
  ctx.fill("evenodd");
  return ctx.getImageData(0, 0, MASK_W, MASK_H).data;
}

export interface LandDot {
  lat: number;
  lng: number;
}

/* dotDensity = dots per unit of equatorial circumference; 64 lands near the
   GitHub-ish 12k mark with 160 latitude rows. Client-only (canvas API). */
export function buildLandDots(rows = 160, dotDensity = 64): LandDot[] {
  const mask = rasterizeLandMask();
  const isLand = (lat: number, lng: number) => {
    const x = Math.min(MASK_W - 1, Math.floor(((lng + 180) / 360) * MASK_W));
    const y = Math.min(MASK_H - 1, Math.floor(((90 - lat) / 180) * MASK_H));
    return mask[(y * MASK_W + x) * 4] > 90;
  };

  const dots: LandDot[] = [];
  for (let i = 0; i <= rows; i++) {
    const lat = -90 + (180 * i) / rows;
    const circ = Math.cos((lat * Math.PI) / 180) * 2 * Math.PI;
    const n = Math.max(1, Math.floor(circ * dotDensity));
    for (let j = 0; j < n; j++) {
      const lng = -180 + ((j + 0.5) * 360) / n;
      if (isLand(lat, lng)) dots.push({ lat, lng });
    }
  }
  return dots;
}
