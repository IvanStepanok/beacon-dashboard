"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, ShieldAlert, BadgeCheck, ArrowRight, Siren, Printer } from "lucide-react";
import { Card, SectionTitle, StatCard, DamageBadge, VerificationBadge } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { ExportButtons } from "@/components/ExportButtons";
import { PrintBrief } from "@/components/PrintBrief";
import { TimeSeriesChart } from "@/components/TimeSeriesChart";
import { DamageBreakdown } from "@/components/DamageBreakdown";
import { api, type StatsOverview } from "@/lib/api";
import { relativeTime, crisisTitle, crisisArea } from "@/lib/format";
import { DAMAGE_COLORS, damageColor } from "@/lib/types";
import type { Crisis, DamageLevel } from "@/lib/types";

export default function OverviewPage() {
  const [s, setS] = useState<StatsOverview | null>(null);
  const [statsAt, setStatsAt] = useState("");
  const [crisis, setCrisis] = useState<Crisis | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .activeCrisis()
      .then((active) => {
        if (cancelled) return;
        setCrisis(active);
        // Scope stats to the SAME crisis as the header subtitle so the numbers
        // and the crisis name always describe one crisis.
        return api.statsOverview(active.id);
      })
      .catch(() => {
        if (cancelled) return;
        setCrisis(null);
        // No active crisis resolved → fall back to unscoped stats; the backend
        // (C3 backend half) resolves omitted scope to the newest active crisis,
        // keeping stats coherent with /crises/active.
        return api.statsOverview();
      })
      .then((stats) => {
        if (!cancelled && stats) {
          setS(stats);
          // Stamp the moment the stats actually landed — PrintBrief prints this
          // as the data's freshness time, not the moment Ctrl+P was pressed.
          setStatsAt(new Date().toUTCString());
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!s) return <div className="grid h-screen place-items-center text-ink3">Loading overview…</div>;
  const dmg = s.damageCounts as Record<DamageLevel, number>;

  return (
    <>
      {/* Exports inherit the page's crisis scope so downloads match the on-screen stats. */}
      <PageHeader
        title="Overview"
        subtitle={crisis ? `${crisisTitle(crisis)} · ${crisisArea(crisis)}${crisis.glide ? ` · ${crisis.glide}` : ""}` : "Crisis overview"}
        action={
          <div className="flex flex-wrap items-start gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-surface px-3.5 py-2 text-[13px] font-semibold text-ink2 transition-colors hover:bg-surface2"
            >
              <Printer size={15} /> Print situation brief
            </button>
            <ExportButtons filters={crisis ? { crisisId: crisis.id } : {}} />
          </div>
        }
      />

      {/* print:hidden (with the header chrome) so that under @media print only
          the PrintBrief below renders — browser Save-as-PDF = the decision-maker
          summary (see components/PrintBrief.tsx). */}
      <div className="space-y-6 px-8 py-6 print:hidden">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Reports" value={s.totalReports} sub="from the field" icon={<Building2 size={16} />} />
          <StatCard
            label="Pending review"
            value={s.verificationCounts.pending ?? 0}
            sub="reports awaiting verification"
            icon={<Siren size={16} />}
            accent="var(--color-warn)"
          />
          <StatCard
            label="Heavy damage"
            value={`${s.severePlusPct}%`}
            sub={`${(s.damageTierCounts?.partial ?? 0) + (s.damageTierCounts?.complete ?? 0)} partial + complete`}
            icon={<ShieldAlert size={16} />}
            accent={DAMAGE_COLORS.severe}
          />
          <StatCard
            label="Verified"
            value={`${Math.round(((s.verificationCounts.verified ?? 0) / Math.max(1, s.totalReports)) * 100)}%`}
            sub={`${s.verificationCounts.pending ?? 0} pending review`}
            icon={<BadgeCheck size={16} />}
            accent="var(--color-ok)"
          />
        </div>

        <Card>
          <SectionTitle
            action={
              <Link href="/dispatch" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-ink">
                Open board <ArrowRight size={14} />
              </Link>
            }
          >
            Verification & triage
          </SectionTitle>
          <div className="grid grid-cols-3 gap-3">
            {([
              ["Verified", s.verificationCounts.verified ?? 0],
              ["Pending review", s.verificationCounts.pending ?? 0],
              ["Flagged", s.verificationCounts.flagged ?? 0],
            ] as const).map(([label, value]) => (
              <div key={label} className="rounded-xl border border-line bg-surface2/40 px-3 py-2.5">
                <div className="text-[22px] font-bold tabular-nums text-ink">{value}</div>
                <div className="text-[11px] font-medium text-ink3">{label}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <SectionTitle>Reporting activity</SectionTitle>
            <TimeSeriesChart data={s.timeSeries} unit={s.timeSeriesUnit} />
          </Card>
          <Card>
            <SectionTitle>Damage breakdown</SectionTitle>
            <DamageBreakdown counts={dmg} tierCounts={s.damageTierCounts} />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card>
            <SectionTitle
              action={
                <Link href="/map" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-ink">
                  View map <ArrowRight size={14} />
                </Link>
              }
            >
              Most affected areas
            </SectionTitle>
            <div className="flex flex-col">
              {s.areas.slice(0, 6).map((a) => (
                <div key={a.area} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: damageColor(a.worst) }} />
                  <span className="text-[14px] font-medium text-ink">{a.area}</span>
                  <span className="ml-auto text-[13px] font-semibold tabular-nums text-ink2">
                    {a.count} {a.count === 1 ? "report" : "reports"}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionTitle
              action={
                <Link href="/reports" className="inline-flex items-center gap-1 text-[13px] font-semibold text-primary hover:text-primary-ink">
                  All reports <ArrowRight size={14} />
                </Link>
              }
            >
              Recent reports
            </SectionTitle>
            <div className="flex flex-col">
              {s.recent.map((r) => (
                <Link key={r.id} href={`/reports/${r.id}`} className="flex items-center gap-3 border-b border-line py-2.5 last:border-0 hover:opacity-80">
                  <DamageBadge level={r.damage} />
                  <span className="truncate text-[14px] text-ink">{r.place}</span>
                  <span className="ml-auto shrink-0 text-[12px] text-ink3">{relativeTime(r.ageMin)}</span>
                  <VerificationBadge status={r.verification} />
                </Link>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Print-only: the situation brief is the sole printed artifact. */}
      <PrintBrief crisis={crisis} stats={s} generatedAt={statsAt} />
    </>
  );
}
