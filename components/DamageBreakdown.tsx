import { DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER } from "@/lib/types";

// The challenge's required core indicator is the 3-tier classification — every
// report rolls into exactly one tier (minimal/partial/complete).
export function DamageBreakdown({
  tierCounts,
}: {
  tierCounts: Record<string, number>;
}) {
  const total = DAMAGE_TIER_ORDER.reduce((s, k) => s + (tierCounts[k] ?? 0), 0) || 1;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 w-full overflow-hidden rounded-full bg-surface2">
        {DAMAGE_TIER_ORDER.map((k) => (
          <div key={k} style={{ width: `${((tierCounts[k] ?? 0) / total) * 100}%`, backgroundColor: DAMAGE_TIER_COLORS[k] }} />
        ))}
      </div>
      <div className="flex flex-col gap-2.5">
        {DAMAGE_TIER_ORDER.map((k) => {
          const pct = Math.round(((tierCounts[k] ?? 0) / total) * 100);
          return (
            <div key={k} className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: DAMAGE_TIER_COLORS[k] }} />
              <span className="text-[13px] font-medium text-ink">{DAMAGE_TIER_LABELS[k]}</span>
              <span className="ml-auto text-[13px] font-semibold tabular-nums text-ink">{tierCounts[k] ?? 0}</span>
              <span className="w-9 text-right text-[12px] tabular-nums text-ink3">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
