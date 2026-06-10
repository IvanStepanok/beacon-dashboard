"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import { rollupTier } from "@/lib/types";
import type { MapFeatureCollection } from "@/lib/api";

const ANTAKYA = { lat: 36.2021, lng: 36.1601 };
const SOURCE = "public-heat";
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
// Aggregate-only view: cap the zoom so a heat blob can never be read as one
// building's location. The backend's coarsening (verified-only, ~110 m grid for
// anonymous callers) is the hard guarantee; the cap keeps the VISUAL promise too.
const MAX_ZOOM = 13.5;

// Strip everything but the 3-tier rollup the heat weight needs — the public
// layer renders density, never per-report attributes (no ids, no pins).
function toHeatFC(fc: MapFeatureCollection | null) {
  return {
    type: "FeatureCollection" as const,
    features: (fc?.features ?? []).map((f) => ({
      type: "Feature" as const,
      geometry: f.geometry,
      properties: { tier: rollupTier(f.properties.damage) },
    })),
  };
}

/** Bounding box of the plotted features, or null when nothing has a point. */
function boundsOf(
  fc: ReturnType<typeof toHeatFC>,
): [[number, number], [number, number]] | null {
  if (fc.features.length === 0) return null;
  let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
  for (const f of fc.features) {
    const [lng, lat] = f.geometry.coordinates;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }
  return [[minLng, minLat], [maxLng, maxLat]];
}

/**
 * Community-facing hotspot map (Q18): ONE heatmap layer over the anonymous-tier
 * features — no individual report pins at any zoom, no click targets. Exact
 * locations stay with verified responders on the analyst console.
 */
export function PublicHeatmap({
  fc,
  center,
}: {
  fc: MapFeatureCollection | null;
  /** Initial view center (the active crisis's center); ANTAKYA when absent. */
  center?: { lat: number; lng: number };
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  // One-shot: fit the view to the FIRST non-empty data load, then never again —
  // the 60s re-polls must not yank the visitor's viewport around.
  const fitDoneRef = useRef(false);
  const fcRef = useRef(fc);
  // Keep the latest value without re-running the map-init effect; intentional.
  // eslint-disable-next-line react-hooks/refs
  fcRef.current = fc;

  const fitOnce = (map: MlMap, heat: ReturnType<typeof toHeatFC>) => {
    if (fitDoneRef.current) return;
    const bounds = boundsOf(heat);
    if (!bounds) return;
    fitDoneRef.current = true;
    map.fitBounds(bounds, { padding: 64, maxZoom: 12 });
  };

  // Create the map once.
  useEffect(() => {
    let map: MlMap | null = null;
    let disposed = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      if (disposed || !container.current) return;

      map = new maplibregl.Map({
        container: container.current,
        style: STYLE,
        center: center ? [center.lng, center.lat] : [ANTAKYA.lng, ANTAKYA.lat],
        zoom: 11,
        maxZoom: MAX_ZOOM,
        attributionControl: { compact: true },
      });
      // With a crisis center the view is already where the story is — auto-fit
      // would let one far-away verified report yank the camera out to a
      // continent-wide view. Fit only when discovering data without a center.
      if (center) fitDoneRef.current = true;
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        // Read through the ref: data may have arrived while the style loaded.
        const heat = toHeatFC(fcRef.current);
        map.addSource(SOURCE, { type: "geojson", data: heat });

        map.addLayer({
          id: "damage-heat",
          type: "heatmap",
          source: SOURCE,
          paint: {
            // Worse tiers burn hotter: complete=1, partial=0.6, minimal=0.25.
            "heatmap-weight": ["match", ["get", "tier"], "complete", 1, "partial", 0.6, 0.25],
            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 6, 0.8, MAX_ZOOM, 2.2],
            // Trauma-informed ramp (amber → terracotta, never pure red) — the
            // density analogue of DAMAGE_TIER_COLORS.
            "heatmap-color": [
              "interpolate", ["linear"], ["heatmap-density"],
              0, "rgba(212,154,42,0)",
              0.25, "rgba(212,154,42,0.30)",
              0.5, "rgba(212,154,42,0.55)",
              0.75, "rgba(200,116,60,0.70)",
              1, "rgba(182,98,80,0.85)",
            ],
            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 8, 14, 11, 26, MAX_ZOOM, 40],
          },
        });

        readyRef.current = true;
        fitOnce(map, heat);
      });
    })();

    return () => {
      disposed = true;
      readyRef.current = false;
      fitDoneRef.current = false;
      mapRef.current = null;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data on each poll.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (!src) return;
    const heat = toHeatFC(fc);
    src.setData(heat);
    fitOnce(map, heat);
  }, [fc]);

  return <div ref={container} className="h-full w-full" />;
}
