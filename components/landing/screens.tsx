/* 1:1 HTML recreations of the real mobile app screens, transcribed from the
   Compose source (designsystem/theme/BeaconColors.kt, feature/map/MapScreen.kt,
   feature/capture StepShell+DamageStep, feature/reports/ReportsScreen.kt,
   feature/reportdetail/ReportDetailScreen.kt). Every dp, color, string and
   Lucide icon below comes from that source — if the app changes, change this
   the same way. The stage is 360×800dp (the app's logical resolution), so
   dp values map 1:1 to px here.

   The only motion added on top of the real UI: pins drop in and the syncing
   progress bar animates — both states the real app animates too. */

import {
  ArrowLeft, ArrowRight, Check, ChevronRight, CloudOff, CloudUpload, Download,
  House, List, LocateFixed, Map as MapIcon, MapPin, Plus, Search,
  SlidersHorizontal, TriangleAlert, User, X, Zap,
} from "lucide-react";

/* BeaconColors — light theme, resolved hex (BeaconColors.kt). */
export const C = {
  primary: "#006EB5", primarySoft: "#D7E9F9", primaryInk: "#1F5A95", onPrimary: "#FFFFFF",
  bg: "#FAFAFA", surface: "#FFFFFF", surface2: "#F7F7F7", surface3: "#EDEFF0",
  ink: "#232E3D", ink2: "#55606E", ink3: "#84929D", line: "#D4D6D8",
  ok: "#59BA47", okSoft: "#E7F6E4", warn: "#FBC412", warnSoft: "#FFF4D1",
  complete: "#D12800", completeSoft: "#FFE3DD",
};
export type Tier = "minimal" | "partial" | "complete";
export const TIER_COLOR: Record<Tier, string> = { minimal: C.ok, partial: C.warn, complete: C.complete };
export const TIER_SOFT: Record<Tier, string> = { minimal: C.okSoft, partial: C.warnSoft, complete: C.completeSoft };
export const TIER_LABEL: Record<Tier, string> = {
  minimal: "Minimal / no damage", partial: "Partially damaged", complete: "Completely destroyed",
};

/* Android status bar (28dp) — time left, signal/wifi/battery right.
   `signal` lets the story kill connectivity: 3 = normal, 0 = blackout, 1 = first
   bar back. With 0 bars the wifi glyph hides and a slash crosses the bars —
   the blackout must read at a glance or the whole offline act lies. */
export function StatusBar({ signal = 3, time = "11:25", light = false }: { signal?: 0 | 1 | 2 | 3; time?: string; light?: boolean }) {
  return (
    <div className="relative z-20 flex h-[28px] items-center justify-between px-[24px]" style={{ color: light ? "#FFFFFF" : C.ink }}>
      <span className="text-[13px] font-medium tracking-wide">{time}</span>
      <span className="flex items-center gap-[5px]">
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <rect x="0" y="7" width="2.6" height="4" rx="0.7" opacity={signal >= 1 ? 1 : 0.18} />
          <rect x="4" y="4.5" width="2.6" height="6.5" rx="0.7" opacity={signal >= 2 ? 1 : 0.18} />
          <rect x="8" y="2" width="2.6" height="9" rx="0.7" opacity={signal >= 3 ? 1 : 0.18} />
          <rect x="12" y="0" width="2.6" height="11" rx="0.7" opacity="0.18" />
          {signal === 0 && (
            <path d="M 0.5 0.5 L 14.5 10.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        {signal >= 2 && (
          <svg width="15" height="11" viewBox="0 0 16 12" fill="currentColor" aria-hidden>
            <path d="M8 9.5a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2ZM4.9 7.6a4.6 4.6 0 0 1 6.2 0l-1.3 1.4a2.8 2.8 0 0 0-3.6 0L4.9 7.6ZM2.2 4.9a8.6 8.6 0 0 1 11.6 0l-1.3 1.3a6.8 6.8 0 0 0-9 0L2.2 4.9Z" />
          </svg>
        )}
        <svg width="22" height="11" viewBox="0 0 22 11" aria-hidden>
          <rect x="0.5" y="0.5" width="18" height="10" rx="2.5" fill="none" stroke="currentColor" opacity="0.5" />
          <rect x="2" y="2" width="13" height="7" rx="1.4" fill="currentColor" />
          <rect x="19.8" y="3.4" width="2" height="4.2" rx="1" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

/* BeaconBottomBar — Map · Reports · [+] · Profile, FAB raised 16dp. */
export function BottomNav({ active }: { active: "map" | "reports" | "profile" }) {
  const tab = (key: "map" | "reports" | "profile", label: string, Icon: typeof MapIcon) => {
    const on = active === key;
    return (
      <div className="flex flex-col items-center gap-[4px] py-[4px]">
        <span
          className="rounded-full px-[14px] py-[4px]"
          style={{ background: on ? C.primarySoft : "transparent" }}
        >
          <Icon size={20} color={on ? C.primary : C.ink3} strokeWidth={2} />
        </span>
        <span className="text-[12px]" style={{ color: on ? C.primary : C.ink3, fontWeight: on ? 700 : 500 }}>
          {label}
        </span>
      </div>
    );
  };
  return (
    <div className="absolute inset-x-0 bottom-0 z-20">
      <div style={{ height: 1, background: C.line }} />
      <div className="flex items-center justify-around bg-white pb-[18px] pt-[6px]">
        {tab("map", "Map", MapIcon)}
        {tab("reports", "Reports", List)}
        <div
          className="grid h-[56px] w-[56px] -translate-y-[16px] place-items-center rounded-[18px]"
          style={{ background: C.primary, boxShadow: "0 10px 22px rgba(0,110,181,0.35)" }}
        >
          <Plus size={26} color="#fff" strokeWidth={2.4} />
        </div>
        {tab("profile", "Profile", User)}
      </div>
    </div>
  );
}

/* OpenFreeMap Liberty-look basemap of the demo city (fictional): warm land, the
   Sera river, white roads with warm casings, building blocks, park blobs. */
export function Basemap({ height = 800 }: { height?: number }) {
  return (
    <svg
      viewBox={`0 0 360 ${height}`} width="360" height={height} aria-hidden
      className="absolute left-0 top-0" preserveAspectRatio="xMidYMid slice"
    >
      <rect width="360" height={height} fill="#F4F1EA" />
      {/* Sera river */}
      <path d={`M -20 ${height * 0.72} C 80 ${height * 0.66}, 120 ${height * 0.78}, 200 ${height * 0.74} S 340 ${height * 0.62}, 390 ${height * 0.68} L 390 ${height} L -20 ${height} Z`} fill="#AFCFE3" opacity="0.55" />
      <path d={`M -20 ${height * 0.75} C 80 ${height * 0.69}, 120 ${height * 0.8}, 200 ${height * 0.76} S 340 ${height * 0.65}, 390 ${height * 0.71}`} fill="none" stroke="#9FC4DC" strokeWidth="26" strokeLinecap="round" />
      {/* parks */}
      <ellipse cx="84" cy={height * 0.30} rx="46" ry="30" fill="#D5E8C0" />
      <ellipse cx="296" cy={height * 0.52} rx="38" ry="26" fill="#D5E8C0" />
      <ellipse cx="210" cy={height * 0.18} rx="30" ry="20" fill="#DFEDCE" />
      {/* road casings then fills */}
      {[
        `M -10 ${height * 0.42} C 90 ${height * 0.40}, 200 ${height * 0.46}, 370 ${height * 0.40}`,
        `M 150 -10 C 160 ${height * 0.25}, 140 ${height * 0.55}, 180 ${height + 10}`,
        `M 260 -10 C 250 ${height * 0.3}, 290 ${height * 0.6}, 270 ${height + 10}`,
      ].map((d, i) => <path key={`c${i}`} d={d} fill="none" stroke="#E6E0D4" strokeWidth="11" />)}
      {[
        `M -10 ${height * 0.42} C 90 ${height * 0.40}, 200 ${height * 0.46}, 370 ${height * 0.40}`,
        `M 150 -10 C 160 ${height * 0.25}, 140 ${height * 0.55}, 180 ${height + 10}`,
        `M 260 -10 C 250 ${height * 0.3}, 290 ${height * 0.6}, 270 ${height + 10}`,
      ].map((d, i) => <path key={`f${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth="7" />)}
      {[
        `M -10 ${height * 0.26} L 370 ${height * 0.22}`,
        `M -10 ${height * 0.58} C 120 ${height * 0.55}, 240 ${height * 0.62}, 370 ${height * 0.56}`,
        `M 60 -10 L 80 ${height + 10}`,
        `M 320 -10 L 330 ${height * 0.5}`,
      ].map((d, i) => <path key={`m${i}`} d={d} fill="none" stroke="#FFFFFF" strokeWidth="4" />)}
      {/* buildings */}
      {[
        [22, 0.31, 16, 12], [44, 0.34, 13, 10], [108, 0.45, 18, 13], [132, 0.48, 12, 10],
        [196, 0.30, 16, 12], [222, 0.33, 12, 9], [292, 0.27, 18, 12], [310, 0.44, 13, 10],
        [60, 0.50, 15, 11], [240, 0.50, 16, 11], [180, 0.62, 14, 10], [96, 0.62, 16, 11],
      ].map(([x, fy, w, h], i) => (
        <rect key={`b${i}`} x={x as number} y={height * (fy as number)} width={w as number} height={h as number} rx="1.5" fill="#E7E2D7" transform={`rotate(${(i % 3) * 4 - 4} ${(x as number) + (w as number) / 2} ${height * (fy as number) + (h as number) / 2})`} />
      ))}
      <text x="186" y={height * 0.37} fontSize="13" fontWeight="500" fill="#8A909B" letterSpacing="0.4">City center</text>
      <text x="40" y={height * 0.81} fontSize="11" fontStyle="italic" fill="#7BA6C2">Sera</text>
    </svg>
  );
}

/* Map pin (7dp radius, 2.5dp white stroke) — drops in like the live map. */
function Pin({ left, top, tier, delay = 0 }: { left: number; top: number; tier: Tier; delay?: number }) {
  return (
    <span
      className="lp-drop absolute z-10 rounded-full"
      style={{
        left, top, width: 14, height: 14, background: TIER_COLOR[tier],
        border: "2.5px solid #fff", boxShadow: "0 1px 3px rgba(35,46,61,.35)", animationDelay: `${delay}ms`,
      }}
    />
  );
}

/* DamageChip — soft tier container, 8dp dot, ink text (BeaconChip Sm/Md). */
function DamageChip({ tier, md = false }: { tier: Tier; md?: boolean }) {
  return (
    <span
      className="inline-flex w-fit items-center rounded-full"
      style={{
        background: TIER_SOFT[tier], gap: 6,
        padding: md ? "6px 12px" : "4px 8px",
      }}
    >
      <span className="rounded-full" style={{ width: 8, height: 8, background: TIER_COLOR[tier] }} />
      <span style={{ fontSize: md ? 12 : 11, fontWeight: 600, color: C.ink }}>{TIER_LABEL[tier]}</span>
    </span>
  );
}

/* ─────────────────────────── 1 · Map home ─────────────────────────── */
export function MapHomeScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#F4F1EA" }}>
      <Basemap />
      {/* pins + cluster (live data look: 11 / 6 / 5) */}
      <Pin left={92} top={332} tier="complete" delay={150} />
      <Pin left={150} top={300} tier="partial" delay={350} />
      <Pin left={208} top={355} tier="minimal" delay={550} />
      <Pin left={252} top={300} tier="complete" delay={750} />
      <Pin left={120} top={420} tier="minimal" delay={950} />
      <Pin left={236} top={440} tier="partial" delay={1150} />
      <Pin left={70} top={470} tier="minimal" delay={1350} />
      <span
        className="lp-drop absolute z-10 grid place-items-center rounded-full text-[13px] font-medium text-white"
        style={{ left: 168, top: 470, width: 40, height: 40, background: C.primary, border: "2px solid #fff", animationDelay: "1500ms" }}
      >
        12
      </span>

      <StatusBar />
      {/* top overlays: search + filter, crisis banner (14dp pad, 10dp gap) */}
      <div className="absolute inset-x-0 top-[28px] z-10 flex flex-col gap-[10px] p-[14px]">
        <div className="flex gap-[8px]">
          <div
            className="flex h-[48px] flex-1 items-center gap-[10px] rounded-[16px] px-[14px]"
            style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${C.line}` }}
          >
            <Search size={18} color={C.ink3} />
            <span className="text-[14px]" style={{ color: C.ink3 }}>Search area or address</span>
          </div>
          <div
            className="grid h-[48px] w-[48px] place-items-center rounded-[16px]"
            style={{ background: "rgba(255,255,255,0.96)", border: `1px solid ${C.line}` }}
          >
            <SlidersHorizontal size={20} color={C.ink2} />
          </div>
        </div>
        <div
          className="flex items-center gap-[10px] rounded-[14px] p-[10px]"
          style={{ background: C.completeSoft, border: "1px solid rgba(209,40,0,0.4)" }}
        >
          <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[10px]" style={{ background: C.complete }}>
            <TriangleAlert size={18} color="#fff" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold" style={{ color: C.complete }}>
              Active crisis · Earthquake M 6.4
            </span>
            <span className="block truncate text-[12px] font-medium" style={{ color: C.ink2 }}>
              Affected district · 4 d ago · UNDP RAPIDA
            </span>
          </span>
          <span className="grid h-[28px] w-[28px] shrink-0 place-items-center rounded-full">
            <X size={16} color={C.ink3} />
          </span>
        </div>
      </div>

      {/* bottom overlays: recenter + damage stats (12dp pad, 8dp gap) */}
      <div className="absolute inset-x-0 bottom-[88px] z-10 flex flex-col items-end gap-[8px] p-[12px]">
        <div
          className="grid h-[44px] w-[44px] place-items-center rounded-[14px]"
          style={{ background: C.surface, boxShadow: "0 4px 14px rgba(46,40,24,0.18)" }}
        >
          <LocateFixed size={20} color={C.ink2} />
        </div>
        <div
          className="flex w-full rounded-[18px] p-[10px]"
          style={{ background: C.surface, border: `1px solid ${C.line}`, boxShadow: "0 4px 14px rgba(46,40,24,0.12)", gap: 6 }}
        >
          {([["minimal", 11], ["partial", 6], ["complete", 5]] as [Tier, number][]).map(([tier, n]) => (
            <span key={tier} className="flex min-w-0 flex-1 flex-col items-center px-[1px] py-[4px]">
              <span className="flex items-center gap-[4px]">
                <span className="rounded-full" style={{ width: 8, height: 8, background: TIER_COLOR[tier] }} />
                <span className="text-[22px] font-bold leading-none" style={{ color: C.ink, letterSpacing: "-0.01em" }}>{n}</span>
              </span>
              <span className="mt-[3px] w-full truncate text-center text-[10px] font-medium" style={{ color: C.ink3 }}>
                {TIER_LABEL[tier]}
              </span>
            </span>
          ))}
        </div>
      </div>
      <BottomNav active="map" />
    </div>
  );
}

/* ──────────────────── 2 · Capture — Damage step ──────────────────── */
function OptionRow({
  tier, title, desc, selected = false,
}: { tier: Tier; title: string; desc: string; selected?: boolean }) {
  const accent = TIER_COLOR[tier];
  return (
    <div
      className="flex items-center rounded-[18px] p-[16px]"
      style={{
        gap: 14,
        background: selected ? TIER_SOFT[tier] : C.surface,
        border: selected ? `2px solid ${accent}` : `1px solid ${C.line}`,
      }}
    >
      <span
        className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[14px]"
        style={{ background: selected ? "rgba(255,255,255,0.7)" : C.surface2 }}
      >
        <House size={22} color={accent} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-bold leading-snug" style={{ color: C.ink }}>{title}</span>
        <span className="block text-[14px] leading-[20px]" style={{ color: C.ink2 }}>{desc}</span>
      </span>
      <span
        className="grid h-[24px] w-[24px] shrink-0 place-items-center rounded-full"
        style={{ border: `2px solid ${selected ? accent : C.line}` }}
      >
        {selected && <span className="rounded-full" style={{ width: 12, height: 12, background: accent }} />}
      </span>
    </div>
  );
}

export function CaptureDamageScreen() {
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: C.bg }}>
      <StatusBar />
      {/* StepShell top bar: back · stepper · phase label */}
      <div className="flex items-center gap-[12px] px-[20px] pb-[8px] pt-[12px]">
        <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full" style={{ background: C.surface2 }}>
          <ArrowLeft size={18} color={C.ink} />
        </span>
        <span className="flex flex-1 gap-[4px]">
          <span className="h-[4px] flex-1 rounded-full" style={{ background: C.primary }} />
          <span className="h-[4px] flex-1 rounded-full" style={{ background: C.surface3 }} />
          <span className="h-[4px] flex-1 rounded-full" style={{ background: C.surface3 }} />
        </span>
        <span className="text-[12px] font-medium" style={{ color: C.ink3 }}>Damage · 1/4</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[10px] overflow-hidden px-[20px] py-[8px]">
        <div>
          <h3 className="text-[26px] font-bold leading-[30px]" style={{ color: C.ink, letterSpacing: "-0.02em" }}>
            What is the extent of damage?
          </h3>
          <p className="mt-[4px] text-[14px] leading-[20px]" style={{ color: C.ink2 }}>
            Pick the option that best describes this structure.
          </p>
        </div>
        <div className="h-[6px]" />
        {/* on-device AI advisory (shows when the classifier is confident) */}
        <div
          className="flex items-center rounded-[14px] p-[12px]"
          style={{ gap: 10, background: C.primarySoft, border: "1px solid rgba(0,110,181,0.35)" }}
        >
          <Zap size={18} color={C.primary} className="shrink-0" />
          <span className="min-w-0">
            <span className="block text-[16px] font-bold leading-snug" style={{ color: C.ink }}>
              On-device AI suggests: Partially damaged · 86%
            </span>
            <span className="block text-[12px] font-medium" style={{ color: C.ink3 }}>
              Advisory only — confirm or choose another.
            </span>
          </span>
        </div>
        <OptionRow tier="minimal" title="Minimal / no damage" desc="Little or no visible damage" />
        <OptionRow tier="partial" title="Partially damaged" desc="Visible structural damage; still standing" selected />
        <OptionRow tier="complete" title="Completely destroyed" desc="Collapsed or beyond repair" />
      </div>

      <div className="px-[20px] pb-[34px] pt-[14px]" style={{ background: C.bg }}>
        <div
          className="flex h-[56px] w-full items-center justify-center rounded-[20px]"
          style={{ gap: 8, background: C.primary }}
        >
          <span className="text-[16px] font-semibold text-white">Continue</span>
          <ArrowRight size={19} color="#fff" />
        </div>
        <div className="mt-[10px] text-center text-[12px] font-medium" style={{ color: C.ink3 }}>
          You can change this later.
        </div>
      </div>
    </div>
  );
}

/* ──────────────── 3+4 · My reports (offline / syncing) ──────────────── */
type RowState = "queued" | "syncing" | "synced" | "rejected";
function StatusChip({ state }: { state: RowState }) {
  const cfg = {
    synced: { label: "Synced", Icon: Check, bg: C.okSoft, fg: C.ok },
    rejected: { label: "Rejected", Icon: TriangleAlert, bg: C.warnSoft, fg: C.ink },
    queued: { label: "Queued", Icon: CloudOff, bg: C.surface3, fg: C.ink2 },
    syncing: { label: "Queued", Icon: CloudOff, bg: C.surface3, fg: C.ink2 },
  }[state];
  return (
    <span className="inline-flex shrink-0 items-center rounded-full px-[8px] py-[4px]" style={{ gap: 6, background: cfg.bg }}>
      <cfg.Icon size={11} color={cfg.fg} />
      <span className="text-[11px] font-semibold" style={{ color: cfg.fg }}>{cfg.label}</span>
    </span>
  );
}

function ReportRow({
  id, time, tier, state, photo, note, animateProgress = false,
}: { id: string; time: string; tier: Tier; state: RowState; photo: string; note?: string; animateProgress?: boolean }) {
  return (
    <div
      className="flex items-center rounded-[18px] p-[12px]"
      style={{ gap: 12, background: C.surface, border: `1px solid ${C.line}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" className="h-[56px] w-[56px] shrink-0 rounded-[14px] object-cover" />
      <span className="min-w-0 flex-1">
        <span className="flex items-center" style={{ gap: 8 }}>
          <span className="min-w-0 truncate text-[16px] font-bold" style={{ color: C.ink }}>#{id}</span>
          <StatusChip state={state} />
        </span>
        <span className="mt-[2px] block truncate text-[12px] font-medium" style={{ color: C.ink3 }}>{time}</span>
        {note && <span className="mt-[2px] block text-[12px] font-medium" style={{ color: C.ink2 }}>{note}</span>}
        <span className="mt-[6px] block">
          <DamageChip tier={tier} />
        </span>
        {state === "syncing" && (
          <span className="mt-[6px] block h-[3px] overflow-hidden rounded-full" style={{ background: C.surface3 }}>
            <span className={`block h-full rounded-full ${animateProgress ? "lp-fill" : ""}`} style={{ background: TIER_COLOR[tier], width: "55%" }} />
          </span>
        )}
      </span>
      <ChevronRight size={16} color={C.ink3} className="shrink-0" />
    </div>
  );
}

export function ReportsScreen({ offline = false }: { offline?: boolean }) {
  const rows = offline
    ? ([
        { id: "b781ccbf", time: "Just now · K4-112", tier: "partial", state: "queued", photo: "/landing/damage-street.jpg" },
        { id: "7900a404", time: "9 min ago · K4-307", tier: "complete", state: "queued", photo: "/landing/damage-houses.jpg" },
        { id: "6f2d7988", time: "14 min ago · K4-218", tier: "minimal", state: "queued", photo: "/landing/street-antakya.jpg" },
      ] as const)
    : ([
        { id: "b781ccbf", time: "2 min ago · K4-112", tier: "partial", state: "synced", photo: "/landing/damage-street.jpg" },
        { id: "7900a404", time: "11 min ago · K4-307", tier: "complete", state: "syncing", photo: "/landing/damage-houses.jpg" },
        { id: "6f2d7988", time: "16 min ago · K4-218", tier: "minimal", state: "rejected", photo: "/landing/street-antakya.jpg", note: "Duplicate of a nearby report" },
      ] as const);
  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: C.bg }}>
      <StatusBar />
      <div className="px-[20px] pt-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-[26px] font-bold" style={{ color: C.ink, letterSpacing: "-0.02em" }}>Reports</span>
          <span className="grid h-[40px] w-[40px] place-items-center rounded-full" style={{ background: C.surface }}>
            <Download size={18} color={C.ink2} />
          </span>
        </div>
        <div className="pt-[4px] text-[12px] font-medium" style={{ color: C.ink3 }}>
          {offline ? "3 reports · 0 synced" : "3 reports · 1 synced"}
        </div>
        {/* SyncHeader — passive connectivity + outbox banner */}
        <div
          className="mt-[12px] flex items-center rounded-[14px] px-[12px] py-[10px]"
          style={{ gap: 8, background: offline ? C.surface2 : C.primarySoft }}
        >
          {offline
            ? <CloudOff size={18} color={C.ink2} />
            : <CloudUpload size={18} color={C.primary} />}
          <span className="text-[13px] font-semibold" style={{ color: C.ink }}>
            {offline ? "Offline · 3 queued" : "Online · 2 queued · syncing…"}
          </span>
        </div>
        {/* filter chips */}
        <div className="flex overflow-hidden py-[14px]" style={{ gap: 8 }}>
          {[["All · 3", true], ["Minimal / no damage · 1", false], ["Partially damaged · 1", false]].map(([label, on]) => (
            <span
              key={label as string}
              className="shrink-0 whitespace-nowrap rounded-full px-[14px] py-[7px] text-[13px] font-semibold"
              style={on
                ? { background: C.primary, color: C.onPrimary }
                : { background: C.surface, color: C.ink2, border: `1px solid ${C.line}` }}
            >
              {label as string}
            </span>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[20px] pb-[20px]" style={{ gap: 10 }}>
        {rows.map((r) => (
          <ReportRow key={r.id} {...r} animateProgress={!offline} />
        ))}
      </div>
      <BottomNav active="reports" />
    </div>
  );
}

/* ───────────────────── 5 · Report detail ───────────────────── */
function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex-1 rounded-[12px] p-[10px]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
      <span className="block text-[11px] font-bold uppercase" style={{ color: C.ink3, letterSpacing: "0.1em" }}>{label}</span>
      <span className="mt-[2px] block text-[14px] font-medium" style={{ color: C.ink }}>{value}</span>
    </span>
  );
}

export function ReportDetailScreen() {
  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden" style={{ background: C.bg }}>
      {/* photo header (real: 260dp; trimmed so the whole card stack fits the fold) */}
      <div className="relative h-[196px] shrink-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/landing/damage-houses.jpg" alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-x-0 top-0"><StatusBar /></div>
        <span
          className="absolute left-[14px] top-[42px] grid h-[40px] w-[40px] place-items-center rounded-full"
          style={{ background: "rgba(255,255,255,0.95)" }}
        >
          <ArrowLeft size={18} color={C.ink} />
        </span>
        <span
          className="absolute bottom-[14px] left-[14px] flex items-center rounded-full px-[10px] py-[5px]"
          style={{ gap: 6, background: "rgba(0,0,0,0.6)" }}
        >
          <Check size={12} color="#fff" />
          <span className="text-[12px] font-medium text-white">Anonymised · EXIF stripped</span>
        </span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden p-[20px] pb-0" style={{ gap: 12 }}>
        <div className="flex items-start justify-between" style={{ gap: 8 }}>
          <span className="min-w-0">
            <span className="block text-[11px] font-bold uppercase" style={{ color: C.ink3, letterSpacing: "0.1em" }}>Report</span>
            <span className="block truncate text-[22px] font-bold" style={{ color: C.ink, letterSpacing: "-0.01em" }}>#b781ccbf</span>
          </span>
          <DamageChip tier="partial" md />
        </div>

        {/* location: mini map + plus code */}
        <div>
          <div className="relative h-[96px] overflow-hidden rounded-[16px]" style={{ border: `1px solid ${C.line}` }}>
            <Basemap height={220} />
            <span
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ width: 14, height: 14, background: C.warn, border: "2.5px solid #fff", boxShadow: "0 1px 3px rgba(35,46,61,.35)" }}
            />
          </div>
          <div className="mt-[8px] flex items-center" style={{ gap: 6 }}>
            <MapPin size={14} color={C.primary} />
            <span className="font-mono text-[14px] font-medium" style={{ color: C.ink2 }}>K4-112</span>
            <span className="text-[12px] font-medium" style={{ color: C.ink3 }}>· ±12 m</span>
          </div>
        </div>

        <div className="flex" style={{ gap: 8 }}>
          <MetaCell label="Type" value="Residential" />
          <MetaCell label="Crisis" value="Earthquake" />
        </div>

        {/* damage timeline — this building, versioned */}
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase" style={{ color: C.ink3, letterSpacing: "0.1em" }}>Damage timeline</span>
            <span className="text-[12px] font-medium" style={{ color: C.ink3 }}>this building</span>
          </div>
          <div className="mt-[8px] rounded-[16px] p-[14px]" style={{ background: C.surface, border: `1px solid ${C.line}` }}>
            <div className="flex" style={{ gap: 12 }}>
              <span className="flex flex-col items-center">
                <span className="mt-[4px] rounded-full" style={{ width: 14, height: 14, background: C.warn }} />
                <span style={{ width: 1, height: 26, background: C.line }} />
              </span>
              <span className="min-w-0 flex-1 pb-[6px]">
                <span className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: C.warn }}>Partially damaged</span>
                  <span className="text-[12px] font-medium" style={{ color: C.ink3 }}>2 min ago</span>
                </span>
                <span className="block text-[12px] font-medium" style={{ color: C.ink2 }}>v2 · your report</span>
              </span>
            </div>
            <div className="flex" style={{ gap: 12 }}>
              <span className="mt-[4px] ml-[2px] rounded-full" style={{ width: 10, height: 10, background: C.ok }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold" style={{ color: C.ok }}>Minimal / no damage</span>
                  <span className="text-[12px] font-medium" style={{ color: C.ink3 }}>2 d ago</span>
                </span>
                <span className="block text-[12px] font-medium" style={{ color: C.ink2 }}>v1 · community report</span>
              </span>
            </div>
          </div>
        </div>

        {/* withdraw — reporter-initiated erasure */}
        <div
          className="flex items-center rounded-[14px] px-[14px] py-[12px]"
          style={{ gap: 10, border: "1px solid rgba(209,40,0,0.4)" }}
        >
          <TriangleAlert size={18} color={C.complete} />
          <span className="text-[13px] font-semibold" style={{ color: C.complete }}>Withdraw report</span>
        </div>
      </div>
      <BottomNav active="reports" />
    </div>
  );
}
