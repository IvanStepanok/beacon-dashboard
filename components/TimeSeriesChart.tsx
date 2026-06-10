export function TimeSeriesChart({
  data,
  unit = "hour",
}: {
  // `hour` is the bucket index in `unit` steps ago (0 = now); the backend flips
  // the unit to "day" once the crisis is older than 48h so the chart keeps
  // showing real activity months after onset instead of a dead 12h window.
  data: { hour: number; count: number }[];
  unit?: "hour" | "day";
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  // Daily series can span a month — label every nth bucket so the axis stays
  // readable (the empty spans keep the column widths aligned).
  const labelEvery = Math.max(1, Math.ceil(data.length / 12));
  const suffix = unit === "day" ? "d" : "h";
  return (
    <div className="flex h-44 items-stretch gap-1.5">
      {data.map((d) => (
        <div key={d.hour} className="group flex flex-1 flex-col items-center gap-1.5">
          <div className="flex w-full flex-1 items-end">
            <div
              className="w-full rounded-md bg-primary/80 transition-colors group-hover:bg-primary"
              style={{ height: `${(d.count / max) * 100}%` }}
              title={`${d.count} reports`}
            />
          </div>
          <span className="text-[10px] tabular-nums text-ink3">
            {d.hour % labelEvery !== 0 ? " " : d.hour === 0 ? (unit === "day" ? "today" : "now") : `-${d.hour}${suffix}`}
          </span>
        </div>
      ))}
    </div>
  );
}
