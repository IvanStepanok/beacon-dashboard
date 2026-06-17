"use client";

import { useEffect, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Map as MlMap, GeoJSONSource } from "maplibre-gl";
import { getToken } from "@/lib/api";
import { DAMAGE_TIER_COLORS } from "@/lib/types";

const ANTAKYA = { lat: 36.2021, lng: 36.1601 };
const STYLE = "https://tiles.openfreemap.org/styles/liberty";
const SRC = "reports-mvt"; // vector tile source (server-clustered)
const SEL = "selected-src"; // tiny geojson source for the selection halo
const SELBLD = "selected-building-src"; // geojson source for the highlighted building footprint
const OMT_SRC = "openmaptiles"; // basemap (OpenFreeMap Liberty) vector source — OpenMapTiles schema
const FP_FILL = "footprint-fill";
const FP_LINE = "footprint-outline";
const SELBLD_FILL = "selected-building-fill";
const SELBLD_LINE = "selected-building-outline";
const BLD_SRC = "buildings-mvt"; // authoritative footprint vector tiles (backend /tiles/buildings)
const BLD_FILL = "auth-footprint-fill";
const BLD_LINE = "auth-footprint-outline";

// Tile layer names emitted by the backend ST_AsMVT: 'clusters' (grid counts at
// low zoom) and 'reports' (latest-per-building points at high zoom). The single
// vector source carries whichever the current zoom produced.
const L_CLUSTER = "clusters";
const L_REPORTS = "reports";

/**
 * Analyst submissions map backed by SERVER-side vector tiles (MVT). Unlike the
 * prior client-side GeoJSON+cluster source (which capped the map at ~5k loaded
 * reports), this renders the FULL crisis — 500k+ — because clustering happens in
 * PostGIS per tile and only ~1 KB of vector geometry crosses the wire per tile.
 * The analyst JWT rides on tile requests via transformRequest. `tileUrl` is the
 * `{z}/{x}/{y}` template (already carrying crisisId + filter query params); the
 * map re-points its source when it changes.
 */
export function SubmissionsMap({
  tileUrl,
  selectedId,
  selectedPoint,
  onSelect,
  center,
}: {
  tileUrl: string;
  selectedId: string | null;
  /** lng/lat of the selected report, for the halo (set by the parent on select). */
  selectedPoint: { lng: number; lat: number } | null;
  onSelect: (id: string, lngLat: { lng: number; lat: number }) => void;
  center?: { lat: number; lng: number };
}) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MlMap | null>(null);
  const readyRef = useRef(false);
  const onSelectRef = useRef(onSelect);
  const tileUrlRef = useRef(tileUrl);
  // eslint-disable-next-line react-hooks/refs
  onSelectRef.current = onSelect;
  // eslint-disable-next-line react-hooks/refs
  tileUrlRef.current = tileUrl;
  // The authoritative-footprint tile template is the reports template with the path
  // segment swapped; it carries the same crisisId (the buildings endpoint ignores the
  // damage/verification filter params).
  const buildingTileUrlRef = useRef(tileUrl.replace("/tiles/reports/", "/tiles/buildings/"));
  // eslint-disable-next-line react-hooks/refs
  buildingTileUrlRef.current = tileUrl.replace("/tiles/reports/", "/tiles/buildings/");
  const selectedIdRef = useRef(selectedId);
  // eslint-disable-next-line react-hooks/refs
  selectedIdRef.current = selectedId;

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
        attributionControl: { compact: true },
        // The analyst JWT can't ride on a bare tile GET, so inject it here for our
        // API tile requests only (never the public basemap on another origin).
        transformRequest: (url) => {
          if (url.includes("/api/v1/tiles/")) {
            const t = getToken();
            return t ? { url, headers: { Authorization: `Bearer ${t}` } } : { url };
          }
          return undefined;
        },
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");

      map.on("load", () => {
        if (!map) return;
        map.addSource(SRC, {
          type: "vector",
          tiles: [tileUrlRef.current],
          minzoom: 0,
          maxzoom: 16, // backend emits points for any z>=13; overzoom beyond 16
        });
        map.addSource(SEL, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        map.addSource(SELBLD, { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        // Authoritative footprint vector tiles (backend /tiles/buildings). Public endpoint;
        // the analyst JWT still rides via transformRequest. setTiles re-points on crisis change.
        map.addSource(BLD_SRC, { type: "vector", tiles: [buildingTileUrlRef.current], minzoom: 0, maxzoom: 16 });

        // Building FOOTPRINT grid from the basemap's OpenMapTiles `building` source-layer —
        // the same source the reporter app snaps to. Makes the analyst surface honor MH1e:
        // reports sit ON real building footprints, not bare coordinates. Drawn under the pins;
        // only added once the basemap vector source is present.
        if (map.getSource(OMT_SRC)) {
          map.addLayer({
            id: FP_FILL,
            type: "fill",
            source: OMT_SRC,
            "source-layer": "building",
            minzoom: 13,
            paint: {
              "fill-color": "#7c8a99",
              "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, 0.12, 18, 0.22],
            },
          });
          map.addLayer({
            id: FP_LINE,
            type: "line",
            source: OMT_SRC,
            "source-layer": "building",
            minzoom: 14,
            paint: {
              "line-color": "#55657a",
              "line-opacity": 0.7,
              "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.4, 17, 1.2],
            },
          });
        }

        // Authoritative building FOOTPRINTS from the backend (/tiles/buildings): real
        // polygons + source ids ingested per AOI (OSM / Open Buildings / gov shapefile),
        // drawn above the basemap grid so where they exist they read as the real ones.
        map.addLayer({
          id: BLD_FILL,
          type: "fill",
          source: BLD_SRC,
          "source-layer": "buildings",
          minzoom: 13,
          paint: {
            "fill-color": "#0a7d8c",
            "fill-opacity": ["interpolate", ["linear"], ["zoom"], 13, 0, 15, 0.18, 18, 0.3],
          },
        });
        map.addLayer({
          id: BLD_LINE,
          type: "line",
          source: BLD_SRC,
          "source-layer": "buildings",
          minzoom: 14,
          paint: {
            "line-color": "#0a7d8c",
            "line-opacity": 0.9,
            "line-width": ["interpolate", ["linear"], ["zoom"], 14, 0.6, 17, 1.6],
          },
        });

        // Highlight of the building footprint under the selected report (mirrors the
        // reporter app's footprint snap). Fed by SELBLD; above the grid, under the pins.
        map.addLayer({
          id: SELBLD_FILL,
          type: "fill",
          source: SELBLD,
          paint: { "fill-color": "#006eb5", "fill-opacity": 0.35 },
        });
        map.addLayer({
          id: SELBLD_LINE,
          type: "line",
          source: SELBLD,
          paint: { "line-color": "#006eb5", "line-width": 2.5 },
        });

        const tierMatch = [
          "match",
          ["get", "worst"],
          0, DAMAGE_TIER_COLORS.minimal,
          1, DAMAGE_TIER_COLORS.partial,
          2, DAMAGE_TIER_COLORS.complete,
          "#999999",
        ] as unknown as string;

        // Low-zoom cluster bubbles (source-layer 'clusters': n=count, worst=tier).
        map.addLayer({
          id: "cluster-circles",
          type: "circle",
          source: SRC,
          "source-layer": L_CLUSTER,
          paint: {
            "circle-color": tierMatch,
            "circle-opacity": 0.85,
            "circle-radius": ["interpolate", ["linear"], ["get", "n"], 1, 12, 50, 20, 500, 30, 5000, 42],
            "circle-stroke-width": 2,
            "circle-stroke-color": "#ffffff",
          },
        });
        map.addLayer({
          id: "cluster-count",
          type: "symbol",
          source: SRC,
          "source-layer": L_CLUSTER,
          layout: {
            "text-field": ["to-string", ["get", "n"]],
            "text-font": ["Noto Sans Bold"],
            "text-size": 12,
          },
          paint: { "text-color": "#ffffff", "text-halo-color": "rgba(0,0,0,0.25)", "text-halo-width": 1 },
        });

        // Selection halo (under the points).
        map.addLayer({
          id: "selected-halo",
          type: "circle",
          source: SEL,
          paint: {
            "circle-radius": 15,
            "circle-color": "#006eb5",
            "circle-opacity": 0.18,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#006eb5",
          },
        });

        // High-zoom individual points (source-layer 'reports': id, damage).
        map.addLayer({
          id: "report-points",
          type: "circle",
          source: SRC,
          "source-layer": L_REPORTS,
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

        // Click a cluster → zoom toward it; click a point → select it.
        map.on("click", "cluster-circles", (e) => {
          const c = (e.features?.[0]?.geometry as GeoJSON.Point | undefined)?.coordinates as
            | [number, number]
            | undefined;
          if (c) map!.easeTo({ center: c, zoom: Math.min(map!.getZoom() + 2.5, 16) });
        });
        map.on("click", "report-points", (e) => {
          const f = e.features?.[0];
          const c = (f?.geometry as GeoJSON.Point | undefined)?.coordinates as [number, number] | undefined;
          if (f?.properties?.id && c) onSelectRef.current(String(f.properties.id), { lng: c[0], lat: c[1] });
        });
        for (const layer of ["cluster-circles", "report-points"]) {
          map.on("mouseenter", layer, () => { map!.getCanvas().style.cursor = "pointer"; });
          map.on("mouseleave", layer, () => { map!.getCanvas().style.cursor = ""; });
        }

        readyRef.current = true;
      });
    })();

    return () => {
      disposed = true;
      readyRef.current = false;
      mapRef.current = null;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-point the vector source when the tile URL (crisis/filters) changes.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const src = map.getSource(SRC) as (GeoJSONSource & { setTiles?: (u: string[]) => void }) | undefined;
    // VectorTileSource.setTiles swaps the template and refreshes in place (no remount).
    const vsrc = src as unknown as { setTiles?: (u: string[]) => void } | undefined;
    if (vsrc?.setTiles) vsrc.setTiles([tileUrl]);
    const bsrc = map.getSource(BLD_SRC) as unknown as { setTiles?: (u: string[]) => void } | undefined;
    bsrc?.setTiles?.([tileUrl.replace("/tiles/reports/", "/tiles/buildings/")]);
  }, [tileUrl]);

  // Selection halo + building-footprint highlight follow the parent's selected point.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !readyRef.current) return;
    const sel = map.getSource(SEL) as GeoJSONSource | undefined;
    const selBld = map.getSource(SELBLD) as GeoJSONSource | undefined;
    const EMPTY: GeoJSON.FeatureCollection = { type: "FeatureCollection", features: [] };
    if (!sel) return;

    if (selectedId && selectedPoint) {
      sel.setData({
        type: "FeatureCollection",
        features: [{ type: "Feature", geometry: { type: "Point", coordinates: [selectedPoint.lng, selectedPoint.lat] }, properties: {} }],
      });
      // Zoom in enough for the footprint grid to render, then snap the highlight to the
      // building polygon under the report.
      map.easeTo({ center: [selectedPoint.lng, selectedPoint.lat], zoom: Math.max(map.getZoom(), 16) });
      const wantId = selectedId;
      const pt = selectedPoint;
      const highlightBuilding = () => {
        const m = mapRef.current;
        if (!m || selectedIdRef.current !== wantId) return; // selection moved on → skip stale
        // Prefer the authoritative footprint (BLD_FILL, on top) over the basemap grid (FP_FILL).
        const fpLayers = [BLD_FILL, FP_FILL].filter((l) => m.getLayer(l));
        if (fpLayers.length === 0) { selBld?.setData(EMPTY); return; }
        const p = m.project([pt.lng, pt.lat]);
        const feats = m.queryRenderedFeatures(
          [[p.x - 4, p.y - 4], [p.x + 4, p.y + 4]],
          { layers: fpLayers },
        );
        const geom = feats[0]?.geometry;
        selBld?.setData(
          geom
            ? { type: "FeatureCollection", features: [{ type: "Feature", geometry: geom, properties: {} }] }
            : EMPTY,
        );
      };
      // Run once the basemap building tiles have settled at the new zoom.
      map.once("idle", highlightBuilding);
    } else {
      sel.setData(EMPTY);
      selBld?.setData(EMPTY);
    }
  }, [selectedId, selectedPoint]);

  return <div ref={container} className="h-full w-full" />;
}
