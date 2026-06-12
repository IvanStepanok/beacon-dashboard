/* The transition clouds. Five white cumulus cutouts with alpha, cropped from
   the CC0 "Transparent Fair/Stormy Weather Clouds Map" on Wikimedia Commons
   (Tom Patterson / NASA Blue Marble lineage) — public domain, alpha-feathered
   offline into /public/landing/clouds/. Shared by the orbit descent, the city
   entry billboards and the DOM cloud-burst at the act seam. */

import * as THREE from "three";

export const CLOUD_URLS = [1, 2, 3, 4, 5].map((n) => `/landing/clouds/cloud-${n}.png`);

let cache: THREE.Texture[] | null = null;

export function getCloudTextures(): THREE.Texture[] {
  if (!cache) {
    const loader = new THREE.TextureLoader();
    cache = CLOUD_URLS.map((url) => {
      const tex = loader.load(url);
      tex.colorSpace = THREE.SRGBColorSpace;
      return tex;
    });
  }
  return cache;
}
