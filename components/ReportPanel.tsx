"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X, Building2, Sparkles, Languages, CheckCircle2, Flag, Clock,
  MapPin, ShieldCheck, History, ListChecks, ExternalLink, Copy, Landmark, AlertTriangle,
} from "lucide-react";
import { Card, SectionTitle, DamageBadge, VerificationBadge } from "@/components/ui";
import { AuthImage } from "@/components/AuthImage";
import { ExportButtons } from "@/components/ExportButtons";
import { VerifyConfirm } from "@/components/VerifyConfirm";
import { api, ApiError, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { relativeTime, locationLabel, areaLabel, coordsLabel } from "@/lib/format";
import {
  DAMAGE_TIER_LABELS, CLUSTER_LABELS,
  ELECTRICITY_LABELS, HEALTH_SERVICES_LABELS, PRESSING_NEED_LABELS, hasModular,
  damageLabel, damageColor,
  type DamageLevel, type Report, type Verification,
} from "@/lib/types";

interface TimelineVersion {
  reportId: string; v: number; damage: DamageLevel; at: string; ageMin: number; isCurrent: boolean; by: string; note: string;
}

/**
 * Right-side detail drawer for the Reports list. No blocking backdrop — the table
 * stays clickable so an analyst can jump between reports without going back. Verify
 * actions live in the panel and bubble the updated report up via [onChanged] so the
 * row badge updates in place.
 */
export function ReportPanel({
  id,
  onClose,
  onChanged,
}: {
  id: string;
  onClose: () => void;
  onChanged?: (r: Report) => void;
}) {
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [timeline, setTimeline] = useState<TimelineVersion[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [verifyNote, setVerifyNote] = useState("");
  const [needsForce, setNeedsForce] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const { canMutate } = useAuth();

  // Panel remounts per id (key at the call site), so every useState is already
  // fresh on a new selection — just fetch on mount. No synchronous reset needed.
  useEffect(() => {
    let cancel = false;
    api.report(id).then((r) => { if (!cancel) setReport(r); }).catch(() => { if (!cancel) setReport(null); });
    return () => { cancel = true; };
  }, [id]);

  useEffect(() => {
    let cancel = false;
    if (report?.buildingId) {
      api.buildingTimeline(report.buildingId)
        .then((t) => { if (!cancel) setTimeline(t.versions as TimelineVersion[]); })
        .catch(() => { if (!cancel) setTimeline([]); });
    }
    return () => { cancel = true; };
  }, [report?.buildingId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Setting "verified" on a photo-less report answers 409 photo_required —
  // surface the confirm box (force=true + mandatory note) instead of failing.
  const verify = async (v: Verification, force = false) => {
    if (!canMutate || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      const updated = await api.patchVerification(id, v, { note: verifyNote, force });
      setReport(updated);
      onChanged?.(updated);
      setVerifyNote("");
      setNeedsForce(false);
    } catch (e) {
      if (v === "verified" && e instanceof ApiError && e.code === "photo_required") setNeedsForce(true);
      // 403 / 5xx / network — say so instead of swallowing the failure.
      else setActionError(e instanceof Error ? e.message : "network error");
    } finally {
      setBusy(false);
    }
  };

  const code = report?.plusCode || report?.what3words;
  const copyCode = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }).catch(() => {});
  };

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-screen w-full max-w-[480px] flex-col border-l border-line bg-bg shadow-2xl">
      {/* sticky header */}
      <div className="flex items-start gap-3 border-b border-line bg-surface px-5 py-4">
        <MapPin size={18} className="mt-0.5 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[17px] font-bold tracking-tight text-ink">
            {report ? locationLabel(report) : "Loading…"}
          </h2>
          {report && (
            <p className="mt-0.5 truncate text-[12px] text-ink3">
              <span className="font-mono">{report.id}</span> · {relativeTime(report.ageMin)}
              {areaLabel(report) !== "—" && <> · {areaLabel(report)}</>}
            </p>
          )}
        </div>
        {report && (
          <Link
            href={`/reports/${report.id}`}
            className="grid h-8 w-8 place-items-center rounded-lg text-ink3 hover:bg-surface2 hover:text-ink"
            title="Open full page"
          >
            <ExternalLink size={15} />
          </Link>
        )}
        <button
          onClick={onClose}
          className="grid h-8 w-8 place-items-center rounded-lg text-ink3 hover:bg-surface2 hover:text-ink"
          title="Close (Esc)"
        >
          <X size={17} />
        </button>
      </div>

      {/* scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {report === undefined && <p className="py-10 text-center text-[14px] text-ink3">Loading…</p>}
        {report === null && <p className="py-10 text-center text-[14px] text-ink3">Report not found.</p>}
        {report && (
          <div className="space-y-4">
            {/* status badges */}
            <div className="flex flex-wrap items-center gap-2">
              <DamageBadge level={report.damage} />
              {report.possiblyDamaged && (
                <span className="rounded-full bg-surface2 px-2.5 py-1 text-[12px] font-medium text-ink2">possibly damaged</span>
              )}
              {report.buildingSource === "footprint" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-1 text-[12px] font-semibold text-primary-ink"
                  title="Pinned to a real building footprint on the map"
                >
                  <Landmark size={12} /> Footprint-matched
                </span>
              )}
              <VerificationBadge status={report.verification} />
            </div>

            {/* verify actions — front and centre for fast triage */}
            <div className="grid grid-cols-3 gap-2">
              <PanelAction active={report.verification === "verified"} color="var(--color-ok)" bg="var(--color-ok-soft)" icon={<CheckCircle2 size={15} />} disabled={busy || !canMutate} onClick={() => verify("verified")}>Verify</PanelAction>
              <PanelAction active={report.verification === "pending"} color="var(--color-warn)" bg="var(--color-warn-soft)" icon={<Clock size={15} />} disabled={busy || !canMutate} onClick={() => verify("pending")}>Pending</PanelAction>
              <PanelAction active={report.verification === "flagged"} color="var(--color-complete)" bg="var(--color-complete-soft)" icon={<Flag size={15} />} disabled={busy || !canMutate} onClick={() => verify("flagged")}>Flag</PanelAction>
            </div>
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
                disabled={!canMutate}
                className="w-full rounded-lg border border-line bg-surface px-2.5 py-1.5 text-[13px] outline-none placeholder:text-ink3 focus:border-primary disabled:opacity-50"
              />
            )}
            {!canMutate && <p className="-mt-1 text-[12px] text-ink3">Read-only role — verification is disabled.</p>}
            {actionError && (
              <div className="flex items-start gap-2 rounded-lg border border-warn/40 bg-warn-soft/60 px-3 py-2 text-[12px] text-ink2">
                <AlertTriangle size={13} className="mt-0.5 shrink-0 text-warn" />
                <span>Action failed — {actionError}</span>
              </div>
            )}

            {/* photo */}
            {report.photoUrl ? (
              <AuthImage key={`${API_BASE}${report.photoUrl}`} src={`${API_BASE}${report.photoUrl}`} alt="Reported damage" className="aspect-[4/3] w-full rounded-xl border border-line object-cover" />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-line" style={{ backgroundColor: `${damageColor(report.damage)}14` }}>
                <Building2 size={26} style={{ color: damageColor(report.damage) }} />
              </div>
            )}
            <div className="flex items-center gap-1.5 text-[12px] text-ink3">
              <ShieldCheck size={13} className="text-ok" /> EXIF metadata stripped on device
            </div>

            {/* assessment */}
            <Card>
              <SectionTitle>Assessment</SectionTitle>
              <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-[13px]">
                <Field label="Damage (3-tier)">{DAMAGE_TIER_LABELS[report.damageTier]}</Field>
                <Field label="Grade detail">{damageLabel(report.damage)}</Field>
                <Field label="Infrastructure"><span className="capitalize">{report.infraTypes.join(", ") || "—"}</span></Field>
                {report.infraName && <Field label="Infrastructure name">{report.infraName}</Field>}
                <Field label="Crisis type"><span className="capitalize">{report.crisisNature.join(", ") || "—"}</span></Field>
                <Field label="Debris on road"><span className="capitalize">{report.debris}</span></Field>
              </dl>
              {report.aiLevel && (
                <div className="mt-3 flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3">
                  <Sparkles size={15} className="mt-0.5 text-primary-ink" />
                  <div className="text-[13px]">
                    <span className="font-semibold text-primary-ink">AI vision suggestion: </span>
                    <span className="text-ink2">{damageLabel(report.aiLevel)} ({report.aiConfidence}%){report.aiLevel === report.damage ? " — matches reporter." : " — differs, worth a look."}</span>
                  </div>
                </div>
              )}
            </Card>

            {/* field note */}
            {report.description && (
              <Card>
                <SectionTitle
                  action={
                    <button onClick={() => setShowOriginal((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-ink">
                      <Languages size={14} />
                      {showOriginal ? "Translation" : `Original (${report.description.originalLang})`}
                    </button>
                  }
                >
                  Field note
                </SectionTitle>
                <p className="text-[14px] leading-relaxed text-ink">
                  {showOriginal ? report.description.original : report.description.translated}
                </p>
                <p className="mt-2 text-[12px] text-ink3">
                  {showOriginal ? `Original · ${report.description.originalLang}` : "Auto-translated to English · original preserved"}
                </p>
              </Card>
            )}

            {/* secondary impacts (modular Appendix-1 sections) */}
            {hasModular(report.modular) && (
              <Card>
                <SectionTitle>Secondary impacts</SectionTitle>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-[13px]">
                  {report.modular?.electricity && (
                    <Field label="Electricity">{ELECTRICITY_LABELS[report.modular.electricity] ?? report.modular.electricity}</Field>
                  )}
                  {report.modular?.healthServices && (
                    <Field label="Health services">{HEALTH_SERVICES_LABELS[report.modular.healthServices] ?? report.modular.healthServices}</Field>
                  )}
                </dl>
                {(report.modular?.pressingNeeds?.length ?? 0) > 0 && (
                  <div className="mt-3">
                    <dt className="text-[11px] uppercase tracking-wide text-ink3">Pressing needs</dt>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {(report.modular?.pressingNeeds ?? []).map((n) => (
                        <span key={n} className="rounded-full bg-surface2 px-2.5 py-1 text-[12px] font-medium text-ink2">{PRESSING_NEED_LABELS[n] ?? n}</span>
                      ))}
                    </div>
                  </div>
                )}
                {report.modular?.pressingNeedsOther && (
                  <p className="mt-2 text-[13px] text-ink2">Other: “{report.modular.pressingNeedsOther}”</p>
                )}
              </Card>
            )}

            {/* affected sectors */}
            <Card>
              <SectionTitle>Affected sectors</SectionTitle>
              <dl className="space-y-2 text-[13px]">
                <Meta label="Clusters">{report.clusters.map((c) => CLUSTER_LABELS[c] ?? c).join(", ") || "—"}</Meta>
              </dl>
              <Link href="/dispatch" className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-[13px] font-semibold text-white hover:bg-primary-ink">
                <ListChecks size={14} /> Open verification & triage
              </Link>
            </Card>

            {/* building history */}
            {timeline.length > 0 && (
              <Card>
                <SectionTitle>Building history</SectionTitle>
                {report.buildingId && <p className="mb-3 text-[12px] text-ink3">Building <span className="font-mono">{report.buildingId}</span></p>}
                <ol className="relative ml-1 border-l border-line">
                  {[...timeline].reverse().map((t) => (
                    <li key={t.v} className="mb-4 ml-4 last:mb-0">
                      <span className="absolute -left-[7px] mt-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-surface" style={{ backgroundColor: damageColor(t.damage) }} />
                      <div className="flex items-center gap-2">
                        <span className="text-[13px] font-semibold text-ink">v{t.v}</span>
                        {t.isCurrent && <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-ink">Current</span>}
                      </div>
                      <div className="text-[13px] text-ink2">{damageLabel(t.damage)} · {relativeTime(t.ageMin)}</div>
                    </li>
                  ))}
                </ol>
                {timeline.length > 1 && (
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink3"><History size={12} /> Damage changed across assessments.</div>
                )}
              </Card>
            )}

            {/* metadata */}
            <Card>
              <SectionTitle>Location & metadata</SectionTitle>
              <dl className="space-y-2.5 text-[13px]">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-ink3">Plus Code</dt>
                  <dd className="flex items-center gap-1.5 text-right font-mono text-[12px] text-ink2">
                    {code ?? "—"}
                    {code && (
                      <button onClick={copyCode} className="text-ink3 hover:text-primary" title="Copy">
                        <Copy size={12} />
                      </button>
                    )}
                  </dd>
                </div>
                {copied && <p className="-mt-1 text-right text-[11px] text-ok">copied</p>}
                <Meta label="Coordinates" mono>{coordsLabel(report, 5)}</Meta>
                {areaLabel(report) !== "—" && <Meta label="Area">{areaLabel(report)}</Meta>}
                <Meta label="Payload" mono>{report.sizeMb} MB</Meta>
              </dl>
              <div className="mt-4">
                <ExportButtons filters={{ q: report.id }} compact />
              </div>
            </Card>
          </div>
        )}
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wide text-ink3">{label}</dt>
      <dd className="mt-0.5 font-medium text-ink">{children}</dd>
    </div>
  );
}
function Meta({ label, mono = false, children }: { label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-ink3">{label}</dt>
      <dd className={`text-right text-ink2 ${mono ? "font-mono text-[12px]" : ""}`}>{children}</dd>
    </div>
  );
}
function PanelAction({ active, color, bg, icon, children, onClick, disabled }: { active: boolean; color: string; bg: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2.5 text-[13px] font-semibold transition-colors disabled:opacity-50"
      style={{ borderColor: active ? color : "var(--color-line)", backgroundColor: active ? bg : "transparent", color: active ? color : "var(--color-ink2)" }}
    >
      <span style={{ color }}>{icon}</span>
      {children}
    </button>
  );
}
