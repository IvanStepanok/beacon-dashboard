import type { ReactNode } from "react";
import { DAMAGE_COLORS, DAMAGE_LABELS, DAMAGE_TIER_COLORS, DAMAGE_TIER_LABELS, VERIFICATION_LABELS } from "@/lib/types";
import type { DamageLevel, DamageTier, Verification } from "@/lib/types";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-primary/[0.03] ${className}`}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-[15px] font-bold text-ink">{children}</h2>
      {action}
    </div>
  );
}

// Vocabulary-agnostic: renders either a 5-level EMS-98 grade OR a 3-tier value.
export function DamageBadge({ level }: { level: string }) {
  const isTier = level === "minimal" || level === "partial" || level === "complete";
  const color = isTier ? DAMAGE_TIER_COLORS[level as DamageTier] : DAMAGE_COLORS[level as DamageLevel];
  const label = isTier ? DAMAGE_TIER_LABELS[level as DamageTier] : DAMAGE_LABELS[level as DamageLevel];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ color, backgroundColor: `${color}1f` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const VERIF_STYLE: Record<Verification, { fg: string; bg: string }> = {
  verified: { fg: "var(--color-ok)", bg: "var(--color-ok-soft)" },
  pending: { fg: "var(--color-warn)", bg: "var(--color-warn-soft)" },
  flagged: { fg: "var(--color-complete)", bg: "var(--color-complete-soft)" },
};

export function VerificationBadge({ status }: { status: Verification }) {
  const s = VERIF_STYLE[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-semibold"
      style={{ color: s.fg, backgroundColor: s.bg }}
    >
      {VERIFICATION_LABELS[status]}
    </span>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  accent = "var(--color-primary)",
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  accent?: string;
}) {
  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-[12px] font-medium uppercase tracking-wide text-ink3">
          {label}
        </span>
        {icon && (
          <span
            className="grid h-8 w-8 place-items-center rounded-xl"
            style={{ color: accent, backgroundColor: `${accent}1a` }}
          >
            {icon}
          </span>
        )}
      </div>
      <div className="text-[30px] font-bold leading-none text-ink">{value}</div>
      {sub && <div className="text-[12px] text-ink2">{sub}</div>}
    </Card>
  );
}
