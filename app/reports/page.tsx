"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ExportButtons } from "@/components/ExportButtons";
import { ReportPanel } from "@/components/ReportPanel";
import { DamageBadge, VerificationBadge } from "@/components/ui";
import { api, type ReportFilters } from "@/lib/api";
import { relativeTime, locationLabel, areaLabel } from "@/lib/format";
import {
  DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER,
  type Crisis, type DamageTier, type Report, type Verification,
} from "@/lib/types";

const VERIF_FILTERS: Verification[] = ["verified", "pending", "flagged"];

export default function ReportsPage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [damage, setDamage] = useState<Set<DamageTier>>(new Set());
  const [verif, setVerif] = useState<Set<Verification>>(new Set());
  const [items, setItems] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [grandTotal, setGrandTotal] = useState(0);
  const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  // Crisis selector: "" = All crises (default). Fetch every status (no arg) so
  // emergent / proposed crises are selectable, not just active ones.
  const [crises, setCrises] = useState<Crisis[]>([]);
  const [selectedCrisis, setSelectedCrisis] = useState("");

  useEffect(() => {
    let cancel = false;
    api.crises().then((c) => { if (!cancel) setCrises(c); }).catch(() => {});
    return () => { cancel = true; };
  }, []);

  const filters: ReportFilters = useMemo(
    () => ({
      crisisId: selectedCrisis || undefined,
      q: query.trim() || undefined,
      damage: damage.size ? [...damage] : undefined,
      verification: verif.size ? [...verif] : undefined,
      pageSize: 200,
    }),
    [selectedCrisis, query, damage, verif],
  );

  useEffect(() => {
    let cancel = false;
    api.listReports(filters).then((r) => {
      if (cancel) return;
      setItems(r.items);
      setTotal(r.total);
      setGrandTotal(r.grandTotal);
      setNextCursor(r.nextCursor);
    });
    return () => { cancel = true; };
  }, [filters]);

  // Append the next keyset page, echoing the opaque cursor + the same filters.
  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    api
      .listReports({ ...filters, cursor: nextCursor })
      .then((r) => {
        setItems((prev) => [...prev, ...r.items]);
        setNextCursor(r.nextCursor);
      })
      .finally(() => setLoadingMore(false));
  };

  const toggle = <T,>(set: Set<T>, v: T, fn: (s: Set<T>) => void) => {
    const next = new Set(set);
    if (next.has(v)) next.delete(v);
    else next.add(v);
    fn(next);
  };

  return (
    <>
      <div className="transition-[padding] duration-200 ease-out" style={{ paddingRight: selectedId ? 480 : 0 }}>
      <PageHeader
        title="Reports"
        subtitle="Community submissions — review, verify, triage and export"
        action={<ExportButtons filters={filters} />}
      />
      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <select
            value={selectedCrisis}
            onChange={(e) => setSelectedCrisis(e.target.value)}
            className="rounded-xl border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-primary"
          >
            <option value="">All crises</option>
            {crises
              .filter((c) => (c.reportCount ?? 0) > 0)
              .sort((a, b) => (b.reportCount ?? 0) - (a.reportCount ?? 0))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}{c.status !== "active" ? ` (${c.status})` : ""} · {c.reportCount ?? 0}
                </option>
              ))}
          </select>
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink3" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search place, ID, type…"
              className="w-64 rounded-xl border border-line bg-surface py-2 pl-9 pr-3 text-[14px] text-ink outline-none placeholder:text-ink3 focus:border-primary"
            />
          </div>
          <div className="flex items-center gap-2">
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
          <span className="ml-auto text-[13px] font-medium text-ink2">{total} of {grandTotal}</span>
        </div>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink3">
                <th className="px-4 py-3 font-semibold">Damage</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Age</th>
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className={`cursor-pointer border-b border-line/70 text-[14px] last:border-0 ${
                    selectedId === r.id ? "bg-primary-soft/50" : "hover:bg-surface2/60"
                  }`}
                >
                  <td className="px-4 py-3"><DamageBadge level={r.damage} /></td>
                  <td className="px-4 py-3 font-medium text-ink">{locationLabel(r)}</td>
                  <td className="px-4 py-3 text-[13px] text-ink2">{areaLabel(r)}</td>
                  <td className="px-4 py-3"><VerificationBadge status={r.verification} /></td>
                  <td className="px-4 py-3 text-right text-[12px] text-ink3">{relativeTime(r.ageMin)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[14px] text-ink3">No reports match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {nextCursor && (
          <div className="flex justify-center pt-2">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="rounded-xl border border-line bg-surface px-5 py-2 text-[14px] font-medium text-ink2 hover:bg-surface2 disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : `Load more (${items.length} of ${total})`}
            </button>
          </div>
        )}
      </div>
      </div>
      {selectedId && (
        <ReportPanel
          key={selectedId}
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onChanged={(u) => setItems((prev) => prev.map((it) => (it.id === u.id ? { ...it, ...u } : it)))}
        />
      )}
    </>
  );
}
