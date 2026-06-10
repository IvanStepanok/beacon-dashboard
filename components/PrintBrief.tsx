import type { StatsOverview } from "@/lib/api";
import { crisisTitle } from "@/lib/format";
import { DAMAGE_TIER_LABELS, DAMAGE_TIER_ORDER, VERIFICATION_LABELS, damageLabel } from "@/lib/types";
import type { Crisis, DamageTier, Verification } from "@/lib/types";

// Client-side rollup fallback for legacy 5-level-only data (same rule as
// DamageBreakdown) — used only when the server omits damageTierCounts.
function toTiers(counts: Record<string, number>): Record<DamageTier, number> {
  return {
    minimal: (counts.none ?? 0) + (counts.slight ?? 0),
    partial: (counts.moderate ?? 0) + (counts.severe ?? 0),
    complete: counts.destroyed ?? 0,
  };
}

const VERIFS: Verification[] = ["verified", "pending", "flagged"];

const cell = "border border-black/30 px-2 py-1 text-left";

/**
 * Print-only situation brief for decision-makers: hidden on screen, the ONLY
 * thing rendered under @media print (the app chrome is print:hidden). Browser
 * Save-as-PDF is the deliverable — no PDF library, no extra route. Data is the
 * Overview's own crisis-scoped stats, so what prints is what the analyst sees.
 */
export function PrintBrief({
  crisis,
  stats,
  generatedAt,
}: {
  crisis: Crisis | null;
  stats: StatsOverview;
  // Stamped by the caller when the stats land (the Overview's fetch .then), so
  // the timestamp states the data's freshness, not the moment Ctrl+P was pressed.
  generatedAt: string;
}) {
  const tiers = stats.damageTierCounts ?? toTiers(stats.damageCounts);

  return (
    <section className="hidden px-2 font-sans text-[13px] leading-relaxed text-black print:block">
      <h1 className="text-[22px] font-bold">Beacon — Situation brief</h1>
      <p className="mt-1">
        <strong>{crisis ? crisisTitle(crisis) : "Active crisis (unscoped)"}</strong>
        {crisis && (
          <>
            {" "}· {crisis.area}
            {crisis.glide ? ` · GLIDE ${crisis.glide}` : ""}
            {crisis.responseLevel ? ` · L${crisis.responseLevel}` : ""}
            <br />
            Onset {new Date(crisis.startedAt).toUTCString()} ({crisis.startedAgoHrs}h ago)
          </>
        )}
      </p>

      <h2 className="mt-5 text-[15px] font-bold">Damage totals (3-tier core indicator)</h2>
      <table className="mt-1.5 w-full border-collapse">
        <thead>
          <tr>
            <th className={cell}>Tier</th>
            <th className={cell}>Reports</th>
          </tr>
        </thead>
        <tbody>
          {DAMAGE_TIER_ORDER.map((k) => (
            <tr key={k}>
              <td className={cell}>{DAMAGE_TIER_LABELS[k]}</td>
              <td className={`${cell} tabular-nums`}>{tiers[k] ?? 0}</td>
            </tr>
          ))}
          <tr>
            <td className={`${cell} font-bold`}>Total reports</td>
            <td className={`${cell} font-bold tabular-nums`}>{stats.totalReports}</td>
          </tr>
        </tbody>
      </table>

      <h2 className="mt-5 text-[15px] font-bold">Verification</h2>
      <table className="mt-1.5 w-full border-collapse">
        <tbody>
          {VERIFS.map((v) => (
            <tr key={v}>
              <td className={cell}>{VERIFICATION_LABELS[v]}</td>
              <td className={`${cell} tabular-nums`}>{stats.verificationCounts[v] ?? 0}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="mt-5 text-[15px] font-bold">Most-affected areas</h2>
      <table className="mt-1.5 w-full border-collapse">
        <thead>
          <tr>
            <th className={cell}>Area</th>
            <th className={cell}>Reports</th>
            <th className={cell}>Worst damage</th>
          </tr>
        </thead>
        <tbody>
          {stats.areas.slice(0, 10).map((a) => (
            <tr key={a.area}>
              <td className={cell}>{a.area}</td>
              <td className={`${cell} tabular-nums`}>{a.count}</td>
              <td className={cell}>{damageLabel(a.worst)}</td>
            </tr>
          ))}
          {stats.areas.length === 0 && (
            <tr>
              <td className={cell} colSpan={3}>No area-level data yet.</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="mt-6 border-t border-black/30 pt-2 text-[11px]">
        Generated {generatedAt} · Source: Beacon community damage reports (live API),
        verification states as labelled above. Counts reflect the analyst console&apos;s
        crisis scope at the moment the page loaded.
      </p>
    </section>
  );
}
