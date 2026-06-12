/* Analyst-console mock — the web side of Beacon, drawn in a browser-window
   frame. Stylized but honest: same UNDP palette and tier semantics as the
   phone (via screens.tsx C), real benchmark numbers (502,064-report dataset,
   exports streaming at p95 215 ms). Fixed 1280×800 — the parent scales it,
   never this component.

   GSAP hooks the page targets: dm-live (live chip), dm-kpi[data-target]
   (counter roll-up, rendered as 0), dm-pin / dm-cluster (map drop-in),
   dm-row (queue rows), dm-stamp (the VERIFIED stamp, opacity 0 here),
   dm-export (format chips). */

import {
  FileDown, House, List, Lock, Map as MapIcon, Radar, Send, ShieldCheck, User,
} from "lucide-react";
import { C, Basemap, TIER_COLOR, TIER_SOFT, TIER_LABEL, type Tier } from "../screens";

/* Left-rail navigation — Overview is the active view. */
const NAV: { label: string; Icon: typeof MapIcon; active?: boolean }[] = [
  { label: "Overview", Icon: House, active: true },
  { label: "Map", Icon: MapIcon },
  { label: "Reports", Icon: List },
  { label: "Verification", Icon: ShieldCheck },
  { label: "Dispatch", Icon: Send },
  { label: "Exports", Icon: FileDown },
];

/* KPI row — values render as 0; the page rolls them up to data-target. */
const KPIS: { label: string; target: number; sub: string }[] = [
  { label: "Reports", target: 502064, sub: "last 24 h +3,128" },
  { label: "Verified", target: 41208, sub: "last 24 h +1,412" },
  { label: "Buildings affected", target: 18342, sub: "across 14 districts" },
  { label: "Active validators", target: 116, sub: "median review 41 s" },
];

/* Map pins in panel-relative coordinates (the panel flexes; % survives). */
const DM_PINS: { left: string; top: string; tier: Tier }[] = [
  { left: "16%", top: "24%", tier: "complete" },
  { left: "27%", top: "47%", tier: "partial" },
  { left: "38%", top: "30%", tier: "complete" },
  { left: "47%", top: "58%", tier: "minimal" },
  { left: "58%", top: "36%", tier: "partial" },
  { left: "66%", top: "63%", tier: "minimal" },
  { left: "74%", top: "27%", tier: "complete" },
  { left: "84%", top: "50%", tier: "partial" },
];
const DM_CLUSTERS: { left: string; top: string; n: number }[] = [
  { left: "33%", top: "68%", n: 126 },
  { left: "70%", top: "44%", n: 48 },
];

/* Verification queue — the phone's just-synced reports surface here. */
const QUEUE: { id: string; tier: Tier; photo: string }[] = [
  { id: "b781ccbf", tier: "partial", photo: "/landing/damage-street.jpg" },
  { id: "7900a404", tier: "complete", photo: "/landing/damage-houses.jpg" },
  { id: "6f2d7988", tier: "minimal", photo: "/landing/street-antakya.jpg" },
  { id: "e3a91c40", tier: "partial", photo: "/landing/damage-street.jpg" },
];

const EXPORTS = ["GeoJSON", "CSV · HXL", "KML", "GeoPackage", "Shapefile"];

export function DashboardMock() {
  return (
    <div
      className="overflow-hidden rounded-[12px]"
      style={{
        width: 1280, height: 800, background: C.surface,
        border: `1px solid ${C.line}`, boxShadow: "0 60px 120px -40px rgba(0,40,80,0.35)",
      }}
      aria-hidden
    >
      {/* browser chrome — neutral dots, mono URL pill */}
      <div className="relative flex h-[44px] items-center px-[16px]" style={{ background: C.surface2, borderBottom: `1px solid ${C.line}` }}>
        <span className="flex" style={{ gap: 8 }}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[12px] w-[12px] rounded-full" style={{ background: C.line }} />
          ))}
        </span>
        <span
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full px-[14px] py-[5px]"
          style={{ gap: 6, background: C.surface, border: `1px solid ${C.line}` }}
        >
          <Lock size={11} color={C.ink3} />
          <span className="font-mono text-[12px]" style={{ color: C.ink2 }}>beacon.undp.org/overview</span>
        </span>
      </div>

      {/* app header */}
      <div className="flex h-[52px] items-center justify-between px-[20px]" style={{ background: C.surface, borderBottom: `1px solid ${C.line}` }}>
        <span className="flex items-center" style={{ gap: 10 }}>
          <span className="grid h-[28px] w-[28px] place-items-center rounded-[8px]" style={{ background: C.primary }}>
            <Radar size={16} color="#fff" />
          </span>
          <span className="text-[14px] font-bold" style={{ color: C.ink }}>Beacon · Analyst console</span>
        </span>
        <span className="flex items-center" style={{ gap: 12 }}>
          <span className="dm-live flex items-center rounded-full px-[10px] py-[4px]" style={{ gap: 6, border: `1px solid ${C.line}` }}>
            <span className="lp-blink h-[8px] w-[8px] rounded-full" style={{ background: C.ok }} />
            <span className="font-mono text-[12px] font-medium" style={{ color: C.ink }}>LIVE</span>
          </span>
          <span className="flex items-center" style={{ gap: 8 }}>
            <span className="grid h-[24px] w-[24px] place-items-center rounded-full" style={{ background: C.surface3 }}>
              <User size={13} color={C.ink2} />
            </span>
            <span className="text-[12px] font-medium" style={{ color: C.ink2 }}>Situation room · Hatay</span>
          </span>
        </span>
      </div>

      {/* body: rail + main */}
      <div className="grid h-[704px] grid-cols-[220px_1fr]">
        {/* left rail */}
        <div className="flex flex-col p-[12px]" style={{ background: C.surface, borderRight: `1px solid ${C.line}` }}>
          {NAV.map(({ label, Icon, active }) => (
            <span
              key={label}
              className="flex items-center rounded-[6px] px-[12px] py-[8px] text-[13px]"
              style={{
                gap: 10,
                background: active ? C.primarySoft : "transparent",
                color: active ? C.primary : C.ink2,
                fontWeight: active ? 600 : 500,
              }}
            >
              <Icon size={16} color={active ? C.primary : C.ink3} />
              {label}
            </span>
          ))}
          <div className="my-[12px] h-[1px]" style={{ background: C.line }} />
          <div className="rounded-[8px] p-[12px]" style={{ border: `1px solid ${C.line}` }}>
            <span className="block text-[11px] font-bold uppercase" style={{ color: C.ink3, letterSpacing: "0.1em" }}>Active crisis</span>
            <span className="mt-[6px] flex items-center" style={{ gap: 6 }}>
              <span className="h-[8px] w-[8px] rounded-full" style={{ background: C.complete }} />
              <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Earthquake M 6.4</span>
            </span>
            <span className="block text-[12px] font-medium" style={{ color: C.ink2 }}>Antakya, Hatay</span>
          </div>
        </div>

        {/* main column */}
        <div className="flex min-h-0 flex-col gap-[16px] overflow-hidden p-[20px]" style={{ background: C.bg }}>
          {/* KPI row */}
          <div className="grid grid-cols-4 gap-[16px]">
            {KPIS.map(({ label, target, sub }) => (
              <div key={label} className="rounded-[8px] p-[16px]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
                <span className="block text-[11px] font-bold uppercase" style={{ color: C.ink3, letterSpacing: "0.1em" }}>{label}</span>
                <span
                  className="dm-kpi mt-[4px] block font-mono text-[26px] font-bold leading-none"
                  data-target={target}
                  style={{ color: C.ink, fontVariantNumeric: "tabular-nums" }}
                >
                  —
                </span>
                <span className="dm-kpi-sub mt-[6px] block font-mono text-[12px]" style={{ color: C.ink2 }}>{sub}</span>
              </div>
            ))}
          </div>

          {/* map + verification queue */}
          <div className="grid min-h-0 flex-1 grid-cols-[2fr_1fr] gap-[16px]">
            {/* damage map panel */}
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[8px]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <div className="flex items-center justify-between px-[14px] py-[10px]" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Damage map — Antakya</span>
                <span className="flex" style={{ gap: 6 }}>
                  {["All tiers", "24 h", "Verified only"].map((chip, i) => (
                    <span
                      key={chip}
                      className="rounded-full px-[8px] py-[3px] text-[11px] font-medium"
                      style={i === 0
                        ? { background: C.primary, color: C.onPrimary }
                        : { color: C.ink2, border: `1px solid ${C.line}` }}
                    >
                      {chip}
                    </span>
                  ))}
                </span>
              </div>
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {/* the 360-wide phone basemap, scaled out to console width */}
                <div className="absolute left-1/2 top-1/2" style={{ width: 360, height: 520, transform: "translate(-50%, -50%) scale(2)" }}>
                  <Basemap height={520} />
                </div>
                {DM_PINS.map((p) => (
                  <span
                    key={`${p.left}-${p.top}`}
                    className="dm-pin absolute z-10 rounded-full"
                    style={{
                      left: p.left, top: p.top, width: 14, height: 14, background: TIER_COLOR[p.tier],
                      border: "2.5px solid #fff", boxShadow: "0 1px 3px rgba(35,46,61,.35)",
                    }}
                  />
                ))}
                {DM_CLUSTERS.map((c) => (
                  <span
                    key={c.n}
                    className="dm-cluster absolute z-10 grid h-[36px] w-[36px] place-items-center rounded-full font-mono text-[13px] font-medium text-white"
                    style={{ left: c.left, top: c.top, background: C.primary, border: "2px solid #fff" }}
                  >
                    {c.n}
                  </span>
                ))}
              </div>
              <div className="flex items-center px-[14px] py-[8px]" style={{ gap: 16, borderTop: `1px solid ${C.line}` }}>
                {(["minimal", "partial", "complete"] as Tier[]).map((tier) => (
                  <span key={tier} className="flex items-center" style={{ gap: 6 }}>
                    <span className="h-[8px] w-[8px] rounded-full" style={{ background: TIER_COLOR[tier] }} />
                    <span className="text-[11px] font-medium" style={{ color: C.ink2 }}>{TIER_LABEL[tier]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* verification queue panel */}
            <div className="flex min-h-0 flex-col overflow-hidden rounded-[8px]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
              <div className="px-[14px] py-[10px]" style={{ borderBottom: `1px solid ${C.line}` }}>
                <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Verification queue · 7</span>
              </div>
              <div className="flex min-h-0 flex-1 flex-col">
                {QUEUE.map((q, i) => (
                  <div
                    key={q.id}
                    className="dm-row relative flex flex-1 items-center px-[14px]"
                    style={{ gap: 10, borderBottom: i < QUEUE.length - 1 ? `1px solid ${C.line}` : "none" }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={q.photo} alt="" className="h-[40px] w-[40px] shrink-0 rounded-[6px] object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-mono text-[12px] font-medium" style={{ color: C.ink }}>#{q.id}</span>
                      <span className="mt-[4px] inline-flex w-fit max-w-full items-center rounded-full px-[8px] py-[3px]" style={{ gap: 6, background: TIER_SOFT[q.tier] }}>
                        <span className="h-[8px] w-[8px] shrink-0 rounded-full" style={{ background: TIER_COLOR[q.tier] }} />
                        <span className="truncate text-[11px] font-semibold" style={{ color: C.ink }}>{TIER_LABEL[q.tier]}</span>
                      </span>
                    </span>
                    <span
                      className="shrink-0 rounded-[6px] px-[10px] py-[5px] text-[12px] font-semibold"
                      style={{ border: `1px solid ${C.primary}`, color: C.primary }}
                    >
                      Verify
                    </span>
                    {/* stamp transform is owned entirely by the page's GSAP
                        set (yPercent/rotate) — an inline transform would
                        double the translateY */}
                    {i === 0 && (
                      <span
                        className="dm-stamp absolute right-[70px] top-1/2 z-10 rounded-[4px] px-[8px] py-[2px] text-[14px] font-bold uppercase"
                        style={{
                          opacity: 0,
                          border: `2px solid ${C.ok}`, color: C.ok, letterSpacing: "0.12em",
                        }}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* exports bar */}
          <div className="flex items-center rounded-[8px] p-[14px]" style={{ gap: 12, background: C.surface, border: `1px solid ${C.line}` }}>
            <span className="text-[13px] font-semibold" style={{ color: C.ink }}>Situation brief →</span>
            <span className="flex" style={{ gap: 8 }}>
              {EXPORTS.map((fmt) => (
                <span
                  key={fmt}
                  className="dm-export rounded-[6px] font-mono text-[12px]"
                  style={{ padding: "6px 10px", border: `1px solid ${C.line}`, color: C.ink2 }}
                >
                  {fmt}
                </span>
              ))}
            </span>
            <span className="ml-auto font-mono text-[12px]" style={{ color: C.ink2 }}>
              all five stream at 500k · p95 215 ms
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
