export function TimeSeriesChart({
  data,
}: {
  data: { hour: number; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
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
            {d.hour === 0 ? "now" : `-${d.hour}h`}
          </span>
        </div>
      ))}
    </div>
  );
}
