"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource, MapGeoJSONFeature } from "maplibre-gl";
import { DAMAGE_TIER_COLORS } from "@/lib/types";
import type { Report } from "@/lib/types";

const ANTAKYA = { lat: 36.2021, lng: 36.1601 };
const SOURCE = "reports";
const STYLE = "https://tiles.openfreemap.org/styles/liberty";

function toFeatureCollection(reports: Report[]) {
  return {
    type: "FeatureCollection" as const,
    // Location-unresolved (landmark-only) reports have lat/lng = null — they have
    // no point to plot, so they are omitted from the map layer (shown in the list).
    features: reports
      .filter((r): r is Report & { lat: number; lng: number } => typeof r.lat === "number" && typeof r.lng === "number")
      .map((r) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [r.lng, r.lat] },
        properties: { id: r.id, damage: r.damage },
      })),
  };
}

/** Bounding box of the plotted features, or null when nothing has a point. */
function boundsOf(
  fc: ReturnType<typeof toFeatureCollection>,
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

export function SubmissionsMap({
  reports,
  selectedId,
  onSelect,
  center,
}: {
  reports: Report[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Initial view center (e.g. the scoped crisis's center); ANTAKYA when absent. */
  center?: { lat: number; lng: number };
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  // One-shot: fit the view to the FIRST non-empty data load, then never again —
  // later filter/selection updates must not yank the analyst's viewport around.
  const fitDoneRef = useRef(false);
  // Previous selection — the camera eases ONLY when the selected id itself
  // changes, never when a poll swaps the `reports` array identity.
  const prevSelectedRef = useRef<string | null>(null);
  const onSelectRef = useRef(onSelect);
  const reportsRef = useRef(reports);
  // Keep the latest values without re-running the map-init effect; intentional.
  // eslint-disable-next-line react-hooks/refs
  onSelectRef.current = onSelect;
  // eslint-disable-next-line react-hooks/refs
  reportsRef.current = reports;

  const fitOnce = (map: MlMap, fc: ReturnType<typeof toFeatureCollection>) => {
    if (fitDoneRef.current) return;
    const bounds = boundsOf(fc);
    if (!bounds) return;
    fitDoneRef.current = true;
    map.fitBounds(bounds, { padding: 48, maxZoom: 15 });
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
        zoom: 12.4,
        attributionControl: { compact: true },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        // Read through the ref: reports may have arrived while the style loaded.
        const fc = toFeatureCollection(reportsRef.current);
        map.addSource(SOURCE, {
          type: "geojson",
          data: fc,
          cluster: true,
          clusterRadius: 48,
          clusterMaxZoom: 14,
        });

        map.addLayer({
          id: "clusters",
          type: "circle",
          source: SOURCE,
          filter: ["has", "point_count"],
          paint: {
            "circle-color": "#6e4fc4",
            "circle-opacity": 0.9,
            "circle-radius": ["step", ["get", "point_count"], 16, 5, 22, 15, 30],
            "circle-stroke-width": 3,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SOURCE,
          filter: ["has", "point_count"],
          layout: {
            "text-field": ["get", "point_count_abbreviated"],
            "text-font": ["Noto Sans Bold"],
            "text-size": 13,
          },
          paint: { "text-color": "#ffffff" },
        });

        // Selected halo (drawn under the point).
        map.addLayer({
          id: "selected-halo",
          type: "circle",
          source: SOURCE,
          filter: ["==", ["get", "id"], ""],
          paint: {
            "circle-radius": 16,
            "circle-color": "#6e4fc4",
            "circle-opacity": 0.18,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#6e4fc4",
          },
        });

        map.addLayer({
          id: "unclustered",
          type: "circle",
          source: SOURCE,
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "damage"],
              "minimal", DAMAGE_TIER_COLORS.minimal,
              "partial", DAMAGE_TIER_COLORS.partial,
              "complete", DAMAGE_TIER_COLORS.complete,
              "#999999",
            ],
            "circle-radius": 7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });

        // Interactions
        map.on("click", "clusters", async (e) => {
          const f = e.features?.[0] as MapGeoJSONFeature | undefined;
          if (!f) return;
          const clusterId = f.properties.cluster_id as number;
          const src = map!.getSource(SOURCE) as GeoJSONSource;
          const zoom = await src.getClusterExpansionZoom(clusterId);
          map!.easeTo({
            center: (f.geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        });
        map.on("click", "unclustered", (e) => {
          const f = e.features?.[0];
          if (f?.properties?.id) onSelectRef.current(String(f.properties.id));
        });
        for (const layer of ["clusters", "unclustered"]) {
          map.on("mouseenter", layer, () => {
            map!.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layer, () => {
            map!.getCanvas().style.cursor = "";
          });
        }

        readyRef.current = true;
        fitOnce(map, fc);
      });
    })();

    return () => {
      disposed = true;
      readyRef.current = false;
      fitDoneRef.current = false;
      prevSelectedRef.current = null;
      mapRef.current = null;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data when filters change.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(SOURCE) as GeoJSONSource | undefined;
    if (!src) return;
    const fc = toFeatureCollection(reports);
    src.setData(fc);
    fitOnce(map, fc);
  }, [reports]);

  // Update selected halo + fly to selection. The ease-to is guarded on the
  // PREVIOUS selected id: the 30s poll re-creates `reports` (new array identity)
  // and must not snap the camera back to a pin the analyst already panned away from.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    map.setFilter("selected-halo", ["==", ["get", "id"], selectedId ?? ""]);
    if (selectedId && selectedId !== prevSelectedRef.current) {
      const r = reports.find((x) => x.id === selectedId);
      if (r && typeof r.lat === "number" && typeof r.lng === "number") {
        map.easeTo({ center: [r.lng, r.lat], zoom: Math.max(map.getZoom(), 15) });
      }
    }
    prevSelectedRef.current = selectedId;
  }, [selectedId, reports]);

  return <div ref={container} className="h-full w-full" />;
}
