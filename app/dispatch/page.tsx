"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ListChecks } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DamageBadge, VerificationBadge } from "@/components/ui";
import { UpdatedAgo, TruncationBanner } from "@/components/Freshness";
import { ReportPanel } from "@/components/ReportPanel";
import { api } from "@/lib/api";
import { relativeTime, locationLabel, areaLabel, crisisTitle } from "@/lib/format";
import { CLUSTER_LABELS, type Crisis, type Report, type Verification } from "@/lib/types";

// Beacon is a situational-awareness dataset, NOT a responder-dispatch system (Q23).
// This surface is a VERIFICATION queue: an analyst triages incoming community reports
// and verifies / holds / flags them. Pending first (the work), then flagged (needs a
// second look), then verified. The verify/flag actions (with the photo-gate) live in
// the shared ReportPanel drawer.
const VERIF_FILTERS: Verification[] = ["pending", "flagged", "verified"];
const VERIF_ORDER: Record<Verification, number> = { pending: 0, flagged: 1, verified: 2 };

export default function VerificationQueuePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [verif, setVerif] = useState<Set<Verification>>(new Set(["pending"]));

  // Monotonic request id: an in-flight 60s poll must not revert an analyst's
  // just-made verification until the next tick.
  const reqIdRef = useRef(0);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    const reqId = ++reqIdRef.current;
    // Scoped to the active crisis; unscoped only when none resolves.
    api
      .activeCrisis()
      .then((active) => {
        setCrisis(active);
        return api.listAllReports({ crisisId: active.id, pageSize: 200 });
      })
      .catch(() => {
        setCrisis(null);
        return api.listAllReports({ pageSize: 200 });
      })
      .then((r) => {
        if (reqId !== reqIdRef.current) return; // stale snapshot — discard
        setReports(r.items);
        setTotal(r.total);
        setUpdatedAt(Date.now());
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Mount-time load + 60s silent refresh (near-real-time). setState in effect is intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [load]);

  // A local verify/flag outdates any in-flight poll snapshot — bump the id so a
  // stale response can't overwrite it, and patch the row in place.
  const onChanged = (u: Report) => {
    reqIdRef.current++;
    setReports((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...u } : x)));
  };

  const queue = useMemo(() => {
    const f = verif.size ? reports.filter((r) => verif.has(r.verification)) : reports;
    return [...f].sort(
      (a, b) => VERIF_ORDER[a.verification] - VERIF_ORDER[b.verification] || a.ageMin - b.ageMin,
    );
  }, [reports, verif]);

  const pendingCount = useMemo(
    () => reports.filter((r) => r.verification === "pending").length,
    [reports],
  );

  const toggle = (v: Verification) =>
    setVerif((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });

  return (
    <div>
      <PageHeader
        title="Verification & triage"
        subtitle={
          crisis
            ? `Triage and verify community reports for ${crisisTitle(crisis)} — verify, hold for review, or flag.`
            : "Triage and verify incoming community reports — verify, hold for review, or flag."
        }
        action={updatedAt ? <UpdatedAgo at={updatedAt} /> : null}
      />

      <div className="space-y-4 px-8 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-[13px] font-semibold text-primary-ink">
            <ListChecks size={14} /> {pendingCount} pending review
          </span>
          <span className="mx-1 h-4 w-px bg-line" />
          {VERIF_FILTERS.map((v) => {
            const on = verif.has(v);
            return (
              <button
                key={v}
                onClick={() => toggle(v)}
                className={`rounded-full border px-3 py-1 text-[13px] font-medium capitalize transition-colors ${
                  on ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink2 hover:bg-surface2"
                }`}
              >
                {v}
              </button>
            );
          })}
          <span className="ml-auto text-[13px] font-medium text-ink2">
            {queue.length} of {total}
          </span>
        </div>

        <TruncationBanner shown={reports.length} total={total} />

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line text-[12px] uppercase tracking-wide text-ink3">
                <th className="px-4 py-3 font-semibold">Damage</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Area</th>
                <th className="px-4 py-3 font-semibold">Sectors</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Age</th>
              </tr>
            </thead>
            <tbody>
              {queue.map((r) => (
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
                  <td className="px-4 py-3 text-[13px] text-ink2">
                    {r.clusters.map((c) => CLUSTER_LABELS[c] ?? c).join(", ") || "—"}
                  </td>
                  <td className="px-4 py-3"><VerificationBadge status={r.verification} /></td>
                  <td className="px-4 py-3 text-right text-[12px] text-ink3">{relativeTime(r.ageMin)}</td>
                </tr>
              ))}
              {!loading && queue.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-ink3">
                    Nothing in the queue for this filter.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[14px] text-ink3">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedId && (
        <ReportPanel key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} onChanged={onChanged} />
      )}
    </div>
  );
}
