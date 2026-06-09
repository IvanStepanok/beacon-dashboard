import {
  DAMAGE_COLORS, DAMAGE_LABELS, DAMAGE_ORDER,
  DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER,
} from "@/lib/types";
import type { DamageLevel, DamageTier } from "@/lib/types";

const ORDER = DAMAGE_ORDER;

// The challenge's required core indicator is the 3-tier rollup; we show it as the
// primary breakdown and keep the richer EMS-98 grade as collapsible detail.
function toTiers(counts: Record<DamageLevel, number>): Record<DamageTier, number> {
  return {
    minimal: (counts.none ?? 0) + (counts.slight ?? 0),
    partial: (counts.moderate ?? 0) + (counts.severe ?? 0),
    complete: counts.destroyed ?? 0,
  };
}

export function DamageBreakdown({
  counts,
  tierCounts,
}: {
  counts: Record<DamageLevel, number>;
  // When the server provides the 3-tier rollup, use it — it correctly counts tier3
  // reports (minimal/partial/complete) that never appear in the 5-level damageCounts.
  // Falls back to a client-side rollup for legacy 5-level-only data.
  tierCounts?: Record<DamageTier, number>;
}) {
  const tiers = tierCounts ?? toTiers(counts);
  const tierTotal = DAMAGE_TIER_ORDER.reduce((s, k) => s + tiers[k], 0) || 1;
  const total = ORDER.reduce((s, k) => s + (counts[k] ?? 0), 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      {/* Required 3-tier rollup (primary) */}
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface2">
        {DAMAGE_TIER_ORDER.map((k) => (
          <div key={k} style={{ width: `${(tiers[k] / tierTotal) * 100}%`, backgroundColor: DAMAGE_TIER_COLORS[k] }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {DAMAGE_TIER_ORDER.map((k) => {
          const pct = Math.round((tiers[k] / tierTotal) * 100);
          return (
            <div key={k} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DAMAGE_TIER_COLORS[k] }} />
              <span className="text-[13px] font-medium text-ink">{DAMAGE_TIER_LABELS[k]}</span>
              <span className="ml-auto text-[13px] font-semibold tabular-nums text-ink">{tiers[k]}</span>
              <span className="w-9 text-right text-[12px] tabular-nums text-ink3">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* EMS-98 detail (secondary) */}
      <details className="group rounded-xl border border-line bg-surface2/40 px-3 py-2">
        <summary className="cursor-pointer list-none text-[12px] font-semibold text-ink2 marker:hidden">
          EMS-98 detail (5-level)
          <span className="ml-1 text-ink3 group-open:hidden">▸</span>
          <span className="ml-1 hidden text-ink3 group-open:inline">▾</span>
        </summary>
        <div className="mt-2 flex flex-col gap-1.5">
          {ORDER.map((k) => {
            const pct = Math.round(((counts[k] ?? 0) / total) * 100);
            return (
              <div key={k} className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: DAMAGE_COLORS[k] }} />
                <span className="text-[12px] text-ink2">{DAMAGE_LABELS[k]}</span>
                <span className="ml-auto text-[12px] tabular-nums text-ink2">{counts[k] ?? 0}</span>
                <span className="w-8 text-right text-[11px] tabular-nums text-ink3">{pct}%</span>
              </div>
            );
          })}
        </div>
      </details>
    </div>
  );
}
