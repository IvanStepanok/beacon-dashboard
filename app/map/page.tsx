"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { SubmissionsMap } from "@/components/SubmissionsMap";
import { DamageBadge, VerificationBadge } from "@/components/ui";
import { UpdatedAgo } from "@/components/Freshness";
import { api, API_BASE } from "@/lib/api";
import { relativeTime, locationLabel, coordsLabel, crisisTitle } from "@/lib/format";
import {
  DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER, CLUSTER_LABELS, damageLabel,
  type Crisis, type DamageTier, type Report, type Verification,
} from "@/lib/types";

const VERIF_FILTERS: Verification[] = ["verified", "pending", "flagged"];

export default function MapPage() {
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [damage, setDamage] = useState<Set<DamageTier>>(new Set());
  const [verif, setVerif] = useState<Set<Verification>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // The selected report is fetched on demand (the map renders server-side vector
  // tiles now, so the full row is not already in memory). selectedPoint feeds the
  // map's halo from the clicked tile feature's geometry.
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<{ lng: number; lat: number } | null>(null);
  // Crisis scope: the map is always scoped to ONE crisis (default = active).
  // Unlike /reports there is no "All crises" option — a multi-crisis point soup
  // on one basemap reads as noise. Unscoped only as a last-resort fallback.
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [selectedCrisis, setSelectedCrisis] = useState("");
  const [scopeReady, setScopeReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([api.crises(), api.activeCrisis()]).then(([list, active]) => {
      if (cancelled) return;
      const cs = list.status === "fulfilled" ? list.value : [];
      setCrises(cs);
      if (active.status === "fulfilled") {
        setSelectedCrisis(active.value.id);
      } else {
        // No active crisis → scope to the busiest crisis that has reports;
        // only when none qualifies does the map fall back to unscoped.
        const busiest = [...cs].sort((a, b) => (b.reportCount ?? 0) - (a.reportCount ?? 0))[0];
        if (busiest && (busiest.reportCount ?? 0) > 0) setSelectedCrisis(busiest.id);
      }
      setScopeReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // Total count for the header — a single stats aggregate, not a row pull. A 30s
  // silent re-fetch keeps it near-real-time (M3); the map tiles carry their own
  // 30s cache, so panning/zooming re-fetches live geometry independently.
  useEffect(() => {
    if (!scopeReady) return;
    let cancelled = false;
    const fetchTotal = () =>
      api
        .statsOverview(selectedCrisis || undefined)
        .then((s) => {
          if (cancelled) return;
          setTotal(s.totalReports ?? 0);
          setUpdatedAt(Date.now());
        })
        .catch(() => {});
    fetchTotal();
    const t = setInterval(fetchTotal, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [scopeReady, selectedCrisis]);

  // The MVT tile template: server-side clustering + filtering means the whole
  // crisis (50k–500k) renders without ever pulling rows into the browser. Filters
  // ride as repeated query params; changing them re-points the source in place.
  const tileUrl = useMemo(() => {
    const p = new URLSearchParams();
    if (selectedCrisis) p.set("crisisId", selectedCrisis);
    for (const d of damage) p.append("damage", d);
    for (const v of verif) p.append("verification", v);
    const qs = p.toString();
    return `${API_BASE}/api/v1/tiles/reports/{z}/{x}/{y}${qs ? `?${qs}` : ""}`;
  }, [selectedCrisis, damage, verif]);

  // Fetch the clicked report's full row on demand (the tile only carries id+damage).
  // selectedReport is cleared in the event handlers that clear selectedId (close /
  // crisis switch / picking another pin), so the effect only ever fetches.
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    api.report(selectedId).then((r) => { if (!cancelled) setSelectedReport(r); }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedId]);

  // Clear both ids and the fetched row; used by the close button and crisis switch.
  const clearSelection = () => { setSelectedId(null); setSelectedPoint(null); setSelectedReport(null); };

  const selected = selectedReport;

  const toggle = <T,>(set: Set<T>, v: T, fn: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    fn(next);
  };

  // Selected crisis row → its center seeds the map view (backend serves
  // lat/lng as the dashboard alias of centerLat/centerLng).
  const crisisObj = crises.find((c) => c.id === selectedCrisis);

  return (
    <div className="flex h-screen flex-col">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-line bg-surface px-8 py-3">
        {selectedCrisis && (
          <select
            value={selectedCrisis}
            onChange={(e) => { setSelectedCrisis(e.target.value); clearSelection(); }}
            className="rounded-xl border border-line bg-surface px-3 py-1.5 text-[13px] text-ink outline-none focus:border-primary"
          >
            {crises
              .filter((c) => (c.reportCount ?? 0) > 0 || c.id === selectedCrisis)
              .sort((a, b) => (b.reportCount ?? 0) - (a.reportCount ?? 0))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {crisisTitle(c)}{c.status !== "active" ? ` (${c.status})` : ""} · {c.reportCount ?? 0}
                </option>
              ))}
          </select>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold uppercase tracking-wide text-ink3">Damage</span>
          {DAMAGE_TIER_ORDER.map((d) => {
            const on = damage.has(d);
            return (
              <button
                key={d}
                onClick={() => toggle(damage, d, setDamage)}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors"
                style={{
                  borderColor: on ? DAMAGE_TIER_COLORS[d] : "var(--color-line)",
                  backgroundColor: on ? `${DAMAGE_TIER_COLORS[d]}1f` : "transparent",
                  color: on ? DAMAGE_TIER_COLORS[d] : "var(--color-ink2)",
                }}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DAMAGE_TIER_COLORS[d] }} />
                {DAMAGE_TIER_LABELS[d]}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          {VERIF_FILTERS.map((v) => {
            const on = verif.has(v);
            return (
              <button
                key={v}
                onClick={() => toggle(verif, v, setVerif)}
                className={`rounded-full border px-3 py-1 text-[13px] font-medium capitalize transition-colors ${
                  on ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink2 hover:bg-surface2"
                }`}
              >
                {v}
              </button>
            );
          })}
        </div>
        <span className="ml-auto flex items-center gap-3 text-[13px] font-medium text-ink2">
          {total.toLocaleString()} reports
          <UpdatedAgo at={updatedAt} />
        </span>
      </div>

      <div className="relative flex-1">
        {/* Keyed by crisis: switching scope remounts the map so the new crisis's
            center applies. Filter changes keep the key (and viewport) stable and
            re-point the vector source in place. */}
        <SubmissionsMap
          key={selectedCrisis || "unscoped"}
          tileUrl={tileUrl}
          selectedId={selectedId}
          selectedPoint={selectedPoint}
          onSelect={(id, lngLat) => { setSelectedReport(null); setSelectedId(id); setSelectedPoint(lngLat); }}
          center={crisisObj ? { lat: crisisObj.lat, lng: crisisObj.lng } : undefined}
        />

        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-line bg-surface/95 px-3 py-2 shadow-sm backdrop-blur">
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink3">Damage classification</div>
          {DAMAGE_TIER_ORDER.map((d) => (
            <div key={d} className="flex items-center gap-2 py-0.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DAMAGE_TIER_COLORS[d] }} />
              <span className="text-[12px] text-ink2">{DAMAGE_TIER_LABELS[d]}</span>
            </div>
          ))}
        </div>

        {selected && (
          <div className="absolute right-4 top-4 bottom-4 w-80 overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-primary/10">
            <div className="flex items-start justify-between">
              <DamageBadge level={selected.damage} />
              <button onClick={clearSelection} className="grid h-7 w-7 place-items-center rounded-lg text-ink3 hover:bg-surface2">
                <X size={16} />
              </button>
            </div>
            <h3 className="mt-3 flex items-center gap-1.5 text-[16px] font-bold text-ink">
              <MapPin size={15} className="text-primary" />
              {locationLabel(selected)}
            </h3>
            <div className="mt-0.5 text-[12px] text-ink3">
              {relativeTime(selected.ageMin)}
            </div>
            <dl className="mt-4 space-y-2.5 text-[13px]">
              <Row label="Status"><VerificationBadge status={selected.verification} /></Row>
              <Row label="Area">
                <span className="text-ink2">{selected.admin?.adm3?.name ?? "—"}</span>{" "}
                <span className="font-mono text-[11px] text-ink3">{selected.adm3Pcode}</span>
              </Row>
              <Row label="Plus Code"><span className="font-mono text-[12px] text-ink2">{selected.plusCode || selected.what3words || "—"}</span></Row>
              <Row label="Coordinates"><span className="font-mono text-[12px] text-ink2">{coordsLabel(selected)}</span></Row>
              <Row label="Sectors"><span className="text-ink2">{selected.clusters.map((c) => CLUSTER_LABELS[c] ?? c).join(", ") || "—"}</span></Row>
              <Row label="Debris"><span className="capitalize text-ink2">{selected.debris}</span></Row>
            </dl>
            {selected.aiLevel && (
              <div className="mt-4 rounded-xl bg-primary-soft/60 p-3">
                <div className="flex items-center gap-1.5 text-[12px] font-semibold text-primary-ink">
                  <Sparkles size={13} /> AI vision suggestion
                </div>
                <div className="mt-1 text-[13px] text-ink2">{damageLabel(selected.aiLevel)} · {selected.aiConfidence}% confidence</div>
              </div>
            )}
            {selected.description && (
              <div className="mt-4">
                <div className="text-[12px] font-semibold uppercase tracking-wide text-ink3">Field note</div>
                <p className="mt-1 text-[13px] text-ink">{selected.description.translated}</p>
                <p className="mt-1 text-[12px] italic text-ink3">“{selected.description.original}” · {selected.description.originalLang}</p>
              </div>
            )}
            <Link
              href={`/reports/${selected.id}`}
              className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-[14px] font-semibold text-white hover:bg-primary-ink"
            >
              Open full report <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink3">{label}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}
