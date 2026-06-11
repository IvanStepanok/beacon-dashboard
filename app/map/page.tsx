"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { X, MapPin, ArrowRight, Sparkles } from "lucide-react";
import { SubmissionsMap } from "@/components/SubmissionsMap";
import { DamageBadge, VerificationBadge } from "@/components/ui";
import { UpdatedAgo, TruncationBanner } from "@/components/Freshness";
import { api } from "@/lib/api";
import { relativeTime, locationLabel, coordsLabel, crisisTitle } from "@/lib/format";
import {
  DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER, CLUSTER_LABELS, damageLabel,
  type Crisis, type DamageTier, type Report, type Verification,
} from "@/lib/types";

const VERIF_FILTERS: Verification[] = ["verified", "pending", "flagged"];

export default function MapPage() {
  const [all, setAll] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [damage, setDamage] = useState<Set<DamageTier>>(new Set());
  const [verif, setVerif] = useState<Set<Verification>>(new Set());
  const [selectedId, setSelectedId] = useState<string | null>(null);
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

  // Load reports only after the crisis scope is resolved (avoids a flash of
  // the unscoped world before the active crisis arrives). A 30s silent re-fetch
  // keeps the map near-real-time (M3); viewport and filters are untouched —
  // the map only remounts when the crisis scope (its key) changes.
  useEffect(() => {
    if (!scopeReady) return;
    let cancelled = false;
    const fetchReports = () =>
      api
        .listAllReports({ crisisId: selectedCrisis || undefined, pageSize: 200 }, { signal: () => cancelled })
        .then((r) => {
          if (cancelled) return;
          setAll(r.items);
          setTotal(r.total);
          setUpdatedAt(Date.now());
        })
        // A failed poll (API blip) keeps the last data on screen; the UpdatedAgo
        // stamp stops advancing, which IS the staleness signal — no rejection leaks.
        .catch(() => {});
    fetchReports();
    const t = setInterval(fetchReports, 30_000);
    return () => { cancelled = true; clearInterval(t); };
  }, [scopeReady, selectedCrisis]);

  const filtered = useMemo(
    () =>
      all.filter(
        (r) =>
          (damage.size === 0 || damage.has(r.damage)) &&
          (verif.size === 0 || verif.has(r.verification)),
      ),
    [all, damage, verif],
  );
  const selected = filtered.find((r) => r.id === selectedId) ?? null;

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
            onChange={(e) => { setSelectedCrisis(e.target.value); setSelectedId(null); }}
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
          {filtered.length} of {all.length} shown
          <UpdatedAgo at={updatedAt} />
        </span>
      </div>

      <div className="relative flex-1">
        <TruncationBanner
          shown={all.length}
          total={total}
          className="pointer-events-none absolute left-1/2 top-4 z-10 -translate-x-1/2 shadow-sm"
        />
        {/* Keyed by crisis: switching scope remounts the map so the new crisis's
            center + one-shot fitBounds apply. Filter/selection changes keep the
            key (and therefore the viewport) stable. */}
        <SubmissionsMap
          key={selectedCrisis || "unscoped"}
          reports={filtered}
          selectedId={selectedId}
          onSelect={setSelectedId}
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
              <button onClick={() => setSelectedId(null)} className="grid h-7 w-7 place-items-center rounded-lg text-ink3 hover:bg-surface2">
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
