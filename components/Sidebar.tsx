"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Radar,
  LayoutDashboard,
  Map as MapIcon,
  ClipboardList,
  Siren,
  ShieldCheck,
  ListChecks,
  AlertTriangle,
  Settings as SettingsIcon,
  Globe,
  ExternalLink,
} from "lucide-react";
import { LogOut } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth, ROLE_LABELS } from "@/lib/auth";
import { crisisTitle } from "@/lib/format";
import type { Crisis } from "@/lib/types";

const NAV = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/crises", label: "Crises", icon: AlertTriangle },
  // Route path stays /dispatch (links in the wild) — only the label changed.
  { href: "/dispatch", label: "Verification & triage", icon: ListChecks },
  { href: "/map", label: "Live map", icon: MapIcon },
  { href: "/reports", label: "Reports", icon: ClipboardList },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [crisis, setCrisis] = useState<Crisis | null>(null);

  useEffect(() => {
    api.activeCrisis().then(setCrisis).catch(() => setCrisis(null));
  }, []);

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-line bg-surface print:hidden">
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-sm shadow-primary/30">
          <Radar size={22} strokeWidth={2.2} />
        </div>
        <div className="leading-tight">
          <div className="text-[17px] font-bold tracking-tight text-ink">Beacon</div>
          <div className="text-[11px] font-medium uppercase tracking-wider text-ink3">
            Analyst Console
          </div>
        </div>
      </div>

      {/* Active crisis */}
      <div className="mx-3 mb-5 rounded-2xl border border-complete/20 bg-complete-soft/60 p-3">
        <div className="flex items-center gap-2">
          <Siren size={15} className="text-complete" />
          <span className="text-[11px] font-bold uppercase tracking-wide text-complete">
            Active crisis
          </span>
          <span className="relative ml-auto flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-complete opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-complete" />
          </span>
        </div>
        <div className="mt-1.5 text-[13px] font-semibold text-ink">
          {crisis ? crisisTitle(crisis) : "—"}
        </div>
        <div className="text-[12px] text-ink2">
          {crisis ? `${crisis.area} · ${crisis.startedAgoHrs}h ago` : "loading…"}
        </div>
        {crisis?.glide && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="rounded-md bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink2">
              {crisis.glide}
            </span>
            {crisis.responseLevel && (
              <span className="rounded-md bg-complete/15 px-1.5 py-0.5 text-[10px] font-bold text-complete">
                L{crisis.responseLevel}
              </span>
            )}
          </div>
        )}
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors ${
                active
                  ? "bg-primary-soft text-primary-ink"
                  : "text-ink2 hover:bg-surface2 hover:text-ink"
              }`}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 2} />
              {label}
            </Link>
          );
        })}
        {/* Citizen-facing aggregated view (no login). Opens in a new tab so the
            analyst keeps their console context; outside NAV — never "active". */}
        <Link
          href="/public"
          target="_blank"
          rel="noopener"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium text-ink2 hover:bg-surface2 hover:text-ink"
        >
          <Globe size={18} strokeWidth={2} />
          Public view
          <ExternalLink size={13} className="ml-auto text-ink3" />
        </Link>
      </nav>

      <div className="mt-auto border-t border-line px-4 py-4">
        {user && (
          <div className="mb-2 flex items-center gap-2.5 rounded-xl bg-surface2/50 px-3 py-2">
            <div className="grid h-8 w-8 place-items-center rounded-full bg-primary-soft text-[12px] font-bold text-primary-ink">
              {user.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <div className="truncate text-[13px] font-semibold text-ink">{user.name}</div>
              <div className="truncate text-[11px] text-ink3">{ROLE_LABELS[user.role] ?? user.role}</div>
            </div>
            <button onClick={logout} title="Sign out" className="grid h-7 w-7 place-items-center rounded-lg text-ink3 hover:bg-surface hover:text-complete">
              <LogOut size={15} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 px-1 text-[12px] text-ink2">
          <ShieldCheck size={14} className="text-ok" />
          <span>Live · Go + PostGIS</span>
        </div>
      </div>
    </aside>
  );
}
