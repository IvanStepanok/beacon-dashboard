"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Subtle "Updated Ns ago" freshness stamp for polled views (M3 near-real-time).
 * Ticks once a second; renders nothing until the first fetch lands.
 */
export function UpdatedAgo({ at }: { at: number | null }) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    if (!at) return;
    const fmt = () => {
      const s = Math.max(0, Math.round((Date.now() - at) / 1000));
      setLabel(s < 60 ? `${s}s` : `${Math.floor(s / 60)}m`);
    };
    // Paint immediately, then tick; setState here is the point of this effect.
    fmt();
    const t = setInterval(fmt, 1000);
    return () => clearInterval(t);
  }, [at]);
  if (!at || label === null) return null;
  return <span className="text-[12px] tabular-nums text-ink3">Updated {label} ago</span>;
}

/**
 * Honesty banner for capped fetches: listAllReports stops at maxPages, so when
 * fetched < total the view is showing a truncated slice — say so instead of
 * silently pretending the map/board is complete.
 */
export function TruncationBanner({
  shown,
  total,
  className = "",
}: {
  shown: number;
  total: number;
  className?: string;
}) {
  if (total <= shown) return null;
  return (
    <div
      className={`flex items-center gap-2 rounded-xl border border-warn/40 bg-warn-soft px-3 py-2 text-[13px] font-medium text-ink2 ${className}`}
    >
      <AlertTriangle size={14} className="shrink-0 text-warn" />
      <span>
        Showing {shown.toLocaleString()} of {total.toLocaleString()} reports — refine filters
      </span>
    </div>
  );
}
