import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  // print:hidden — page headers are app chrome; printing renders only
  // print-designated content (e.g. the Overview's PrintBrief).
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-line bg-bg/80 px-8 py-6 backdrop-blur print:hidden">
      <div>
        <h1 className="text-[24px] font-bold tracking-tight text-ink">{title}</h1>
        {subtitle && <p className="mt-0.5 text-[14px] text-ink2">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}
