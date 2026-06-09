"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Building2, Sparkles, Languages, CheckCircle2, Flag, Clock,
  MapPin, ShieldCheck, History, Radio, Siren,
} from "lucide-react";
import { Card, SectionTitle, DamageBadge, VerificationBadge } from "@/components/ui";
import { AuthImage } from "@/components/AuthImage";
import { ExportButtons } from "@/components/ExportButtons";
import { api, API_BASE } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { relativeTime, locationLabel, areaLabel, coordsLabel } from "@/lib/format";
import {
  DAMAGE_TIER_LABELS, SEVERITY_LABELS, TASK_STATUS_LABELS, CLUSTER_LABELS,
  ELECTRICITY_LABELS, HEALTH_SERVICES_LABELS, PRESSING_NEED_LABELS, hasModular,
  damageLabel, damageColor,
  type DamageLevel, type Report, type Verification,
} from "@/lib/types";

interface TimelineVersion {
  reportId: string; v: number; damage: DamageLevel; at: string; ageMin: number; isCurrent: boolean; by: string; note: string;
}

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [report, setReport] = useState<Report | null | undefined>(undefined);
  const [timeline, setTimeline] = useState<TimelineVersion[]>([]);
  const [showOriginal, setShowOriginal] = useState(false);
  const [busy, setBusy] = useState(false);
  const { canMutate } = useAuth();

  useEffect(() => {
    api.report(id).then(setReport).catch(() => setReport(null));
  }, [id]);
  useEffect(() => {
    if (report?.buildingId) {
      api.buildingTimeline(report.buildingId).then((t) => setTimeline(t.versions as TimelineVersion[])).catch(() => setTimeline([]));
    }
  }, [report?.buildingId]);

  const verify = async (v: Verification) => {
    if (!canMutate) return;
    setBusy(true);
    try { setReport(await api.patchVerification(id, v)); } finally { setBusy(false); }
  };

  if (report === undefined) return <div className="grid h-screen place-items-center text-ink3">Loading…</div>;
  if (report === null) {
    return (
      <div className="grid h-screen place-items-center">
        <div className="text-center">
          <p className="text-[15px] text-ink2">Report #{id} not found.</p>
          <Link href="/reports" className="mt-2 inline-block text-[14px] font-semibold text-primary">← Back to reports</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-8 py-6">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-ink2 hover:text-ink">
        <ArrowLeft size={15} /> Reports
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-[24px] font-bold tracking-tight text-ink">
            <MapPin size={20} className="text-primary" />
            {locationLabel(report)}
          </h1>
          <p className="mt-0.5 text-[13px] text-ink3">
            <span className="font-mono">{report.taskRef}</span> · submitted {relativeTime(report.ageMin)} · v{timeline.length || report.version}
            {areaLabel(report) !== "—" && <> · {areaLabel(report)}{report.adm3Pcode && <span className="font-mono" title={report.adm3Pcode.startsWith("GB:") ? "Admin area ID (geoBoundaries shapeID)" : "Admin area ID"}> {report.adm3Pcode}</span>}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {report.lifeSafety && (
            <span className="inline-flex items-center gap-1 rounded-full bg-complete px-2.5 py-1 text-[12px] font-bold text-white"><Siren size={12} /> Life-safety</span>
          )}
          <DamageBadge level={report.damage} />
          {report.possiblyDamaged && (
            <span className="rounded-full bg-surface2 px-2.5 py-1 text-[12px] font-medium text-ink2">possibly damaged</span>
          )}
          <VerificationBadge status={report.verification} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <SectionTitle>Submitted photo</SectionTitle>
            {report.photoUrl ? (
              <AuthImage
                key={`${API_BASE}${report.photoUrl}`}
                src={`${API_BASE}${report.photoUrl}`}
                alt="Reported damage"
                className="aspect-[4/3] w-full rounded-xl border border-line object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-line" style={{ backgroundColor: `${damageColor(report.damage)}14` }}>
                <Building2 size={26} style={{ color: damageColor(report.damage) }} />
              </div>
            )}
            <div className="mt-3 flex items-center gap-1.5 text-[12px] text-ink3">
              <ShieldCheck size={13} className="text-ok" /> Location metadata (EXIF) stripped on device
            </div>
          </Card>

          <Card>
            <SectionTitle>Assessment</SectionTitle>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <Field label="Damage (required 3-tier)">{DAMAGE_TIER_LABELS[report.damageTier]}</Field>
              <Field label="Grade detail">{damageLabel(report.damage)}</Field>
              <Field label="Infrastructure"><span className="capitalize">{report.infraTypes.join(", ")}</span></Field>
              <Field label="Crisis type"><span className="capitalize">{report.crisisNature.join(", ")}</span></Field>
              <Field label="Debris on road"><span className="capitalize">{report.debris}</span></Field>
            </dl>
            {report.aiLevel && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary-soft/60 p-3">
                <Sparkles size={15} className="mt-0.5 text-primary-ink" />
                <div className="text-[13px]">
                  <span className="font-semibold text-primary-ink">AI vision suggestion: </span>
                  <span className="text-ink2">
                    {damageLabel(report.aiLevel)} ({report.aiConfidence}%)
                    {report.aiLevel === report.damage ? " — matches reporter." : " — differs, worth a look."}
                  </span>
                </div>
              </div>
            )}
          </Card>

          {report.description && (
            <Card>
              <SectionTitle
                action={
                  <button onClick={() => setShowOriginal((v) => !v)} className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-ink">
                    <Languages size={14} />
                    {showOriginal ? "Show translation" : `Show original (${report.description.originalLang})`}
                  </button>
                }
              >
                Field note
              </SectionTitle>
              <p className="text-[15px] leading-relaxed text-ink">
                {showOriginal ? report.description.original : report.description.translated}
              </p>
              <p className="mt-2 text-[12px] text-ink3">
                {showOriginal ? `Original · ${report.description.originalLang}` : "Auto-translated to English · original preserved"}
              </p>
            </Card>
          )}

          {hasModular(report.modular) && (
            <Card>
              <SectionTitle>Secondary impacts</SectionTitle>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
                {report.modular?.electricity && (
                  <Field label="Electricity">{ELECTRICITY_LABELS[report.modular.electricity] ?? report.modular.electricity}</Field>
                )}
                {report.modular?.healthServices && (
                  <Field label="Health services">{HEALTH_SERVICES_LABELS[report.modular.healthServices] ?? report.modular.healthServices}</Field>
                )}
              </dl>
              {(report.modular?.pressingNeeds?.length ?? 0) > 0 && (
                <div className="mt-3">
                  <dt className="text-[12px] uppercase tracking-wide text-ink3">Pressing needs</dt>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(report.modular?.pressingNeeds ?? []).map((n) => (
                      <span key={n} className="rounded-full bg-surface2 px-2.5 py-1 text-[13px] font-medium text-ink2">{PRESSING_NEED_LABELS[n] ?? n}</span>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Verification</SectionTitle>
            <div className="flex flex-col gap-2">
              <ActionBtn active={report.verification === "verified"} color="var(--color-ok)" bg="var(--color-ok-soft)" icon={<CheckCircle2 size={16} />} disabled={busy || !canMutate} onClick={() => verify("verified")}>Verify report</ActionBtn>
              <ActionBtn active={report.verification === "pending"} color="var(--color-warn)" bg="var(--color-warn-soft)" icon={<Clock size={16} />} disabled={busy || !canMutate} onClick={() => verify("pending")}>Mark pending</ActionBtn>
              <ActionBtn active={report.verification === "flagged"} color="var(--color-complete)" bg="var(--color-complete-soft)" icon={<Flag size={16} />} disabled={busy || !canMutate} onClick={() => verify("flagged")}>Flag for review</ActionBtn>
            </div>
          </Card>

          <Card>
            <SectionTitle>Dispatch</SectionTitle>
            <dl className="space-y-2 text-[13px]">
              <Meta label="Task status">{TASK_STATUS_LABELS[report.taskStatus]}</Meta>
              <Meta label="Severity">{SEVERITY_LABELS[report.severity]}</Meta>
              <Meta label="Assignee">{report.assignee ?? "—"}</Meta>
              <Meta label="Clusters">{report.clusters.map((c) => CLUSTER_LABELS[c] ?? c).join(", ") || "—"}</Meta>
            </dl>
            <Link href="/dispatch" className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary py-2 text-[13px] font-semibold text-white hover:bg-primary-ink">
              <Radio size={14} /> Manage in Dispatch
            </Link>
          </Card>

          <Card>
            <SectionTitle>Building history</SectionTitle>
            {report.buildingId && <p className="mb-3 text-[12px] text-ink3">Building <span className="font-mono">{report.buildingId}</span></p>}
            {timeline.length === 0 ? (
              <p className="text-[13px] text-ink3">No prior versions.</p>
            ) : (
              <ol className="relative ml-1 border-l border-line">
                {[...timeline].reverse().map((t) => (
                  <li key={t.v} className="mb-4 ml-4 last:mb-0">
                    <span className="absolute -left-[7px] mt-1 grid h-3.5 w-3.5 place-items-center rounded-full border-2 border-surface" style={{ backgroundColor: damageColor(t.damage) }} />
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold text-ink">v{t.v}</span>
                      {t.isCurrent && <span className="rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold uppercase text-primary-ink">Current</span>}
                    </div>
                    <div className="text-[13px] text-ink2">{damageLabel(t.damage)} · {relativeTime(t.ageMin)}</div>
                    <div className="text-[11px] text-ink3">by reporter {t.by}</div>
                  </li>
                ))}
              </ol>
            )}
            {timeline.length > 1 && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-ink3"><History size={12} /> Damage changed across assessments.</div>
            )}
          </Card>

          <Card>
            <SectionTitle>Metadata</SectionTitle>
            <dl className="space-y-2.5 text-[13px]">
              <Meta label="Plus Code" mono>{report.plusCode || report.what3words || "—"}</Meta>
              <Meta label="Coordinates" mono>{coordsLabel(report)}</Meta>
              <Meta label="Payload" mono>{report.sizeMb} MB</Meta>
            </dl>
            <div className="mt-4">
              <ExportButtons filters={{ q: report.id }} compact />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[12px] uppercase tracking-wide text-ink3">{label}</dt>
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
function ActionBtn({ active, color, bg, icon, children, onClick, disabled }: { active: boolean; color: string; bg: string; icon: React.ReactNode; children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[14px] font-semibold transition-colors disabled:opacity-60"
      style={{ borderColor: active ? color : "var(--color-line)", backgroundColor: active ? bg : "transparent", color: active ? color : "var(--color-ink2)" }}
    >
      <span style={{ color }}>{icon}</span>
      {children}
    </button>
  );
}
