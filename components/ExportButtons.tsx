"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { api, type ReportFilters } from "@/lib/api";

// Authenticated download of the backend's server-side export
// (GeoJSON, HXL-CSV, GeoPackage). A plain <a href> navigation
// carries no Authorization header → 401, so we fetch with the analyst JWT,
// read the response as a Blob, and trigger a client-side download.
export function ExportButtons({
  filters = {},
  compact = false,
}: {
  filters?: ReportFilters;
  compact?: boolean;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pad = compact ? "px-3 py-1.5 text-[12px]" : "px-3.5 py-2 text-[13px]";
  const formats: { fmt: "geojson" | "csv" | "gpkg" | "kml" | "shapefile"; label: string; primary?: boolean }[] = [
    { fmt: "geojson", label: "GeoJSON", primary: true },
    { fmt: "csv", label: "CSV·HXL" },
    { fmt: "gpkg", label: "GeoPackage" },
    { fmt: "kml", label: "KML" },
    { fmt: "shapefile", label: "Shapefile" },
  ];

  async function download(fmt: "geojson" | "csv" | "gpkg" | "kml" | "shapefile") {
    if (busy) return;
    setBusy(fmt);
    setError(null);
    try {
      const { blob, filename } = await api.exportBlob(fmt, filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      // on401() already redirects to /login; only surface other failures.
      if (e instanceof Error && e.message !== "unauthorized") {
        setError("Export failed. Please try again.");
      }
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2">
        {formats.map((f) => (
          <button
            key={f.fmt}
            type="button"
            disabled={busy !== null}
            onClick={() => download(f.fmt)}
            className={`inline-flex items-center gap-1.5 rounded-xl font-semibold transition-colors disabled:opacity-60 ${pad} ${
              f.primary
                ? "bg-primary text-white hover:bg-primary-ink"
                : "border border-line bg-surface text-ink2 hover:bg-surface2"
            }`}
          >
            {busy === f.fmt ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />} {f.label}
          </button>
        ))}
      </div>
      {error && <p className="text-[12px] font-medium text-complete">{error}</p>}
    </div>
  );
}
