"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Siren, X, MapPin, ArrowRight, Sparkles, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DamageBadge, VerificationBadge } from "@/components/ui";
import { UpdatedAgo, TruncationBanner } from "@/components/Freshness";
import { VerifyConfirm } from "@/components/VerifyConfirm";
import { api, ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { relativeTime, crisisTitle } from "@/lib/format";
import {
  CLUSTER_LABELS,
  damageColor,
  DISPOSITION_LABELS,
  SEVERITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS_ORDER,
  type Crisis,
  type Disposition,
  type Report,
  type Severity,
  type TaskStatus,
  type Verification,
} from "@/lib/types";

const SEVERITY_COLOR: Record<Severity, string> = {
  routine: "var(--color-ink3)",
  elevated: "var(--color-warn)",
  life_safety: "var(--color-complete)",
};
const OPEN_STATUSES: TaskStatus[] = ["new", "triaged", "assigned", "in_progress"];
const ALL_CLUSTERS = ["slsc", "health", "wash", "education", "logistics", "cccm", "early_recovery", "protection"];

export default function DispatchPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [crisis, setCrisis] = useState<Crisis | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Monotonic request id: a board snapshot only lands if no newer load (or
  // local mutation) started while it was in flight — an in-flight 60s poll
  // must not revert an analyst's just-made verification until the next tick.
  const reqIdRef = useRef(0);

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true);
    const reqId = ++reqIdRef.current;
    // Board is scoped to the active crisis; unscoped only when none resolves.
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
  // Mount-time data load + 60s silent refresh (M3 near-real-time); the setState
  // calls inside `load` are intentional.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    const t = setInterval(() => load(true), 60_000);
    return () => clearInterval(t);
  }, [load]);

  const replace = (r: Report) => {
    // A local mutation outdates any in-flight poll snapshot — bump the id so
    // a stale response can't overwrite this change.
    reqIdRef.current++;
    setReports((prev) => prev.map((x) => (x.id === r.id ? r : x)));
  };

  const groups = useMemo(() => {
    const g: Record<string, Report[]> = {};
    for (const st of TASK_STATUS_ORDER) g[st] = [];
    for (const r of reports) (g[r.taskStatus] ??= []).push(r);
    return g;
  }, [reports]);

  const lifeSafety = useMemo(
    () => reports.filter((r) => r.lifeSafety && OPEN_STATUSES.includes(r.taskStatus)),
    [reports],
  );
  const selected = reports.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title="Verification & triage"
        subtitle={
          crisis
            ? `${crisisTitle(crisis)} · Triage → verify → assign → resolve. Life-safety flags are surfaced first.`
            : "Triage → verify → assign → resolve. Life-safety flags are surfaced first."
        }
        action={<UpdatedAgo at={updatedAt} />}
      />

      <div className="relative flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-8 py-6">
          <TruncationBanner shown={reports.length} total={total} className="mb-4" />
          {/* Life-safety flags */}
          <div className="mb-6 rounded-2xl border border-complete/30 bg-complete-soft/50 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Siren size={16} className="text-complete" />
              <span className="text-[13px] font-bold uppercase tracking-wide text-complete">
                Life-safety flags
              </span>
              <span className="rounded-full bg-complete px-2 py-0.5 text-[12px] font-bold text-white">
                {lifeSafety.length} open
              </span>
            </div>
            {lifeSafety.length === 0 ? (
              <p className="text-[13px] text-ink2">No open life-safety reports.</p>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {lifeSafety.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className="min-w-[220px] shrink-0 rounded-xl border border-complete/40 bg-surface p-3 text-left shadow-sm hover:border-complete"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[12px] font-semibold text-complete">{r.taskRef}</span>
                      <DamageBadge level={r.damage} />
                    </div>
                    <div className="mt-1.5 truncate text-[14px] font-semibold text-ink">{r.place}</div>
                    <div className="mt-0.5 text-[12px] text-ink3">
                      {TASK_STATUS_LABELS[r.taskStatus]} · {relativeTime(r.ageMin)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status board */}
          {loading ? (
            <p className="text-[14px] text-ink3">Loading board…</p>
          ) : (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {TASK_STATUS_ORDER.map((st) => (
                <div key={st} className="flex min-w-[240px] flex-1 flex-col">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[13px] font-bold text-ink">{TASK_STATUS_LABELS[st]}</span>
                    <span className="rounded-full bg-surface2 px-2 py-0.5 text-[12px] font-semibold text-ink2">
                      {groups[st]?.length ?? 0}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {groups[st]?.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedId(r.id)}
                        className={`rounded-xl border bg-surface p-2.5 text-left transition-colors hover:border-primary ${
                          selectedId === r.id ? "border-primary ring-1 ring-primary" : "border-line"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] text-ink3">{r.taskRef}</span>
                          <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: SEVERITY_COLOR[r.severity] }}
                            title={SEVERITY_LABELS[r.severity]}
                          />
                        </div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: damageColor(r.damage) }} />
                          <span className="truncate text-[13px] font-medium text-ink">{r.place}</span>
                        </div>
                        <div className="mt-1 truncate text-[11px] text-ink3">
                          {r.assignee ? `→ ${r.assignee}` : (r.clusters[0] ? CLUSTER_LABELS[r.clusters[0]] : "unassigned")}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selected && (
          // Keyed by report: panel state (verify note, force confirm, assignee)
          // must never leak across report switches (mirrors /reports's panel).
          <DispatchPanel
            key={selected.id}
            report={selected}
            onClose={() => setSelectedId(null)}
            onChange={replace}
          />
        )}
      </div>
    </div>
  );
}

function DispatchPanel({
  report,
  onClose,
  onChange,
}: {
  report: Report;
  onClose: () => void;
  onChange: (r: Report) => void;
}) {
  const { canMutate } = useAuth();
  const [busy, setBusy] = useState(false);
  const [disposition, setDisposition] = useState<Disposition>("resolved");
  const [assignee, setAssignee] = useState(report.assignee ?? "");
  const [verifyNote, setVerifyNote] = useState("");
  const [needsForce, setNeedsForce] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (fn: () => Promise<Report>) => {
    if (!canMutate) return;
    setBusy(true);
    setActionError(null);
    try {
      onChange(await fn());
    } catch (e) {
      // 403 / 5xx / network — say so instead of an unhandled rejection.
      setActionError(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  };

  // Verification is its own path: a photo-less report answers 409 photo_required
  // on "verified" — surface the confirm box instead of failing silently.
  const verify = async (v: Verification, force = false) => {
    if (!canMutate || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      onChange(await api.patchVerification(report.id, v, { note: verifyNote, force }));
      setVerifyNote("");
      setNeedsForce(false);
    } catch (e) {
      if (v === "verified" && e instanceof ApiError && e.code === "photo_required") setNeedsForce(true);
      else setActionError(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  };

  const STATUS_FLOW: TaskStatus[] = ["triaged", "assigned", "in_progress", "resolved"];

  return (
    <div className="absolute right-4 top-4 bottom-4 w-[360px] overflow-y-auto rounded-2xl border border-line bg-surface p-5 shadow-xl shadow-primary/10">
      <div className="flex items-start justify-between">
        <div>
          <div className="font-mono text-[12px] font-semibold text-primary">{report.taskRef}</div>
          <h3 className="mt-0.5 flex items-center gap-1.5 text-[16px] font-bold text-ink">
            <MapPin size={15} className="text-primary" />
            {report.place}
          </h3>
        </div>
        <button onClick={onClose} className="grid h-7 w-7 place-items-center rounded-lg text-ink3 hover:bg-surface2">
          <X size={16} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <DamageBadge level={report.damage} />
        <VerificationBadge status={report.verification} />
        <span
          className="rounded-full px-2.5 py-1 text-[12px] font-semibold"
          style={{ color: SEVERITY_COLOR[report.severity], backgroundColor: `${SEVERITY_COLOR[report.severity]}1f` }}
        >
          {SEVERITY_LABELS[report.severity]}
        </span>
        {report.lifeSafety && (
          <span className="inline-flex items-center gap-1 rounded-full bg-complete px-2.5 py-1 text-[12px] font-bold text-white">
            <Siren size={12} /> Life-safety
          </span>
        )}
      </div>

      {!canMutate && (
        <div className="mt-3 rounded-lg border border-line bg-surface2/60 px-3 py-2 text-[12px] text-ink2">
          Read-only role — triage actions are disabled.
        </div>
      )}

      {actionError && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/40 bg-warn-soft/60 px-3 py-2 text-[12px] text-ink2">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warn" />
          <span>Action failed — {actionError}</span>
        </div>
      )}

      <dl className="mt-4 space-y-2 text-[13px]">
        <Row label="Status">{TASK_STATUS_LABELS[report.taskStatus]}</Row>
        <Row label="Assignee">{report.assignee ?? "—"}</Row>
        <Row label="Area">{report.admin?.adm3?.name ?? "—"} <span className="font-mono text-[11px] text-ink3">{report.adm3Pcode}</span></Row>
        <Row label="Sectors">{report.clusters.map((c) => CLUSTER_LABELS[c] ?? c).join(", ") || "—"}</Row>
        {report.disposition && <Row label="Disposition">{DISPOSITION_LABELS[report.disposition]}</Row>}
      </dl>

      {report.aiLevel && (
        <div className="mt-3 flex items-start gap-1.5 rounded-xl bg-primary-soft/60 p-2.5 text-[12px]">
          <Sparkles size={13} className="mt-0.5 text-primary-ink" />
          <span className="text-ink2">AI: {report.aiLevel} ({report.aiConfidence}%)</span>
        </div>
      )}

      {/* Verification */}
      <Section label="Verify">
        <div className="flex gap-2">
          {(["verified", "pending", "flagged"] as const).map((v) => (
            <button
              key={v}
              disabled={busy || !canMutate}
              onClick={() => verify(v)}
              className={`flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold capitalize ${
                report.verification === v ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink2 hover:bg-surface2"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
        <div className="mt-2">
          {needsForce ? (
            <VerifyConfirm
              note={verifyNote}
              onNote={setVerifyNote}
              onConfirm={() => verify("verified", true)}
              onCancel={() => setNeedsForce(false)}
              busy={busy}
            />
          ) : (
            <input
              value={verifyNote}
              onChange={(e) => setVerifyNote(e.target.value)}
              placeholder="Verification note (optional)"
              className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[12px] outline-none placeholder:text-ink3 focus:border-primary"
            />
          )}
        </div>
      </Section>

      {/* Assign */}
      <Section label="Assign to team">
        <div className="flex gap-2">
          <input
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="e.g. Field assessment team A"
            className="flex-1 rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-primary"
          />
          <button
            disabled={busy || !canMutate || !assignee.trim()}
            onClick={() => run(() => api.patchTask(report.id, { assignee: assignee.trim(), taskStatus: "assigned" }))}
            className="rounded-lg bg-primary px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-primary-ink disabled:opacity-50"
          >
            Assign
          </button>
        </div>
      </Section>

      {/* Advance status */}
      <Section label="Advance">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FLOW.map((st) => (
            <button
              key={st}
              disabled={busy || report.taskStatus === st}
              onClick={() => run(() => api.patchTask(report.id, { taskStatus: st }))}
              className="rounded-lg border border-line px-2 py-1 text-[12px] font-medium text-ink2 hover:bg-surface2 disabled:opacity-40"
            >
              {TASK_STATUS_LABELS[st]}
            </button>
          ))}
        </div>
      </Section>

      {/* Severity */}
      <Section label="Severity">
        <div className="flex gap-2">
          {(["routine", "elevated", "life_safety"] as Severity[]).map((sv) => (
            <button
              key={sv}
              disabled={busy || !canMutate}
              onClick={() => run(() => api.patchTask(report.id, { severity: sv }))}
              className="flex-1 rounded-lg border px-2 py-1.5 text-[12px] font-semibold"
              style={{
                borderColor: report.severity === sv ? SEVERITY_COLOR[sv] : "var(--color-line)",
                color: report.severity === sv ? SEVERITY_COLOR[sv] : "var(--color-ink2)",
                backgroundColor: report.severity === sv ? `${SEVERITY_COLOR[sv]}1f` : "transparent",
              }}
            >
              {SEVERITY_LABELS[sv]}
            </button>
          ))}
        </div>
      </Section>

      {/* Cluster routing */}
      <Section label="Route to clusters">
        <div className="flex flex-wrap gap-1.5">
          {ALL_CLUSTERS.map((c) => {
            const on = report.clusters.includes(c);
            return (
              <button
                key={c}
                disabled={busy || !canMutate}
                onClick={() =>
                  run(() =>
                    api.patchTask(report.id, {
                      clusters: on ? report.clusters.filter((x) => x !== c) : [...report.clusters, c],
                    }),
                  )
                }
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${
                  on ? "border-primary bg-primary-soft text-primary-ink" : "border-line text-ink2 hover:bg-surface2"
                }`}
              >
                {CLUSTER_LABELS[c] ?? c}
              </button>
            );
          })}
        </div>
      </Section>

      {/* Close with disposition */}
      <Section label="Close with disposition">
        <div className="flex gap-2">
          <select
            value={disposition}
            onChange={(e) => setDisposition(e.target.value as Disposition)}
            className="flex-1 rounded-lg border border-line bg-surface px-2 py-1.5 text-[13px] outline-none focus:border-primary"
          >
            {Object.entries(DISPOSITION_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <button
            disabled={busy || !canMutate}
            onClick={() => run(() => api.patchTask(report.id, { taskStatus: "closed", disposition }))}
            className="inline-flex items-center gap-1 rounded-lg bg-ok px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-90"
          >
            <ShieldCheck size={13} /> Close
          </button>
        </div>
      </Section>

      <Link
        href={`/reports/${report.id}`}
        className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-line py-2 text-[13px] font-semibold text-ink2 hover:bg-surface2"
      >
        Full report <ArrowRight size={14} />
      </Link>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <dt className="text-ink3">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-4">
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink3">{label}</div>
      {children}
    </div>
  );
}
