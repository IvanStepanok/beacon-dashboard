/* Additional 1:1 screens for the cinematic story — same transcription rules as
   screens.tsx (360×800dp stage, dp = px, BeaconColors via C, Lucide icons).
   These cover the beats the base set skips: the camera viewfinder
   (feature/capture PhotoStep), the offline map-pack state (feature/map) and
   the sync moment on the Reports list (feature/reports SyncHeader).

   Everything the page's GSAP timelines grab carries a stable className:
   cam-flash / cam-ai-chip / cam-shutter / cam-thumb, mo-pin / mo-banner,
   ss-banner / ss-row. The screens themselves stay static — choreography
   lives in the parent. */

import {
  ArrowLeft, Check, ChevronRight, CloudOff, CloudUpload, Download,
  LocateFixed, Search, SlidersHorizontal, SwitchCamera, Zap,
} from "lucide-react";
import {
  C, StatusBar, BottomNav, Basemap, TIER_COLOR, TIER_SOFT, TIER_LABEL, type Tier,
} from "../screens";

/* ───────────────────── Camera — Photo step (step 0) ───────────────────── */
/* The in-app viewfinder: CameraX preview full-bleed, StepShell chrome drawn
   on-photo (scrim circles instead of surface2). `phase` walks the story:
   aim → shutter pressed (flash + thumbnail) → on-device AI verdict chip. */
export function CameraScreen({ phase }: { phase: "aim" | "shot" | "ai" }) {
  const scrim = "rgba(0,0,0,0.45)";
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: C.ink }}>
      {/* viewfinder feed + vignette — the building the film just landed on */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/landing/damage-picture.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(120% 90% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)" }}
      />

      {/* offline from the first frame — the story's whole point */}
      <StatusBar signal={0} time="04:31" light />

      {/* StepShell top bar, on-photo variant: back · stepper · phase label */}
      <div className="absolute inset-x-0 top-[28px] z-10 flex items-center gap-[12px] px-[20px] pb-[8px] pt-[12px]">
        <span className="grid h-[36px] w-[36px] shrink-0 place-items-center rounded-full" style={{ background: scrim }}>
          <ArrowLeft size={18} color="#fff" />
        </span>
        <span className="flex flex-1 gap-[4px]">
          <span className="h-[4px] flex-1 rounded-full" style={{ background: "#FFFFFF" }} />
          <span className="h-[4px] flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
          <span className="h-[4px] flex-1 rounded-full" style={{ background: "rgba(255,255,255,0.35)" }} />
        </span>
        <span className="text-[12px] font-medium text-white">Photo · 1/4</span>
      </div>

      {/* reticle — thin frame + corner ticks, the aim aid */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-[20px]"
        style={{ width: 240, height: 240, border: "2px solid rgba(255,255,255,0.7)" }}
      >
        <span className="absolute -left-[2px] -top-[2px] h-[24px] w-[24px] rounded-tl-[20px]" style={{ borderTop: "3px solid #fff", borderLeft: "3px solid #fff" }} />
        <span className="absolute -right-[2px] -top-[2px] h-[24px] w-[24px] rounded-tr-[20px]" style={{ borderTop: "3px solid #fff", borderRight: "3px solid #fff" }} />
        <span className="absolute -bottom-[2px] -left-[2px] h-[24px] w-[24px] rounded-bl-[20px]" style={{ borderBottom: "3px solid #fff", borderLeft: "3px solid #fff" }} />
        <span className="absolute -bottom-[2px] -right-[2px] h-[24px] w-[24px] rounded-br-[20px]" style={{ borderBottom: "3px solid #fff", borderRight: "3px solid #fff" }} />
      </div>

      {/* on-device AI verdict — same chip recipe as CaptureDamageScreen's
          advisory, slid over the controls once the classifier returns */}
      {phase === "ai" && (
        <div
          className="cam-ai-chip absolute inset-x-[16px] bottom-[122px] z-10 flex items-center rounded-[14px] p-[12px]"
          style={{ gap: 10, background: C.primarySoft, border: "1px solid rgba(0,110,181,0.35)" }}
        >
          <Zap size={18} color={C.primary} className="shrink-0" />
          <span className="min-w-0">
            <span className="block text-[14px] font-bold leading-snug" style={{ color: C.ink }}>
              On-device AI · Partially damaged · 86%
            </span>
            <span className="block text-[12px] font-medium" style={{ color: C.ink3 }}>
              advisory only — runs locally
            </span>
          </span>
        </div>
      )}

      {/* capture controls: flash · shutter · flip */}
      <div className="absolute inset-x-0 bottom-[34px] z-10 flex items-center justify-center" style={{ gap: 40 }}>
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full" style={{ background: scrim }}>
          <Zap size={20} color="#fff" />
        </span>
        <span
          className="cam-shutter grid h-[68px] w-[68px] place-items-center rounded-full"
          style={{ border: "4px solid #fff" }}
        >
          <span className="h-[54px] w-[54px] rounded-full" style={{ background: "#FFFFFF" }} />
        </span>
        <span className="grid h-[44px] w-[44px] place-items-center rounded-full" style={{ background: scrim }}>
          <SwitchCamera size={20} color="#fff" />
        </span>
      </div>

      {/* after the shot: roll thumbnail + count badge */}
      {phase !== "aim" && (
        <span className="cam-thumb absolute bottom-[40px] left-[20px] z-10 block h-[56px] w-[56px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/landing/damage-picture.jpg" alt="" className="h-full w-full rounded-[12px] object-cover ring-2 ring-white" />
          <span
            className="absolute -right-[6px] -top-[6px] grid h-[20px] w-[20px] place-items-center rounded-full text-[11px] font-bold text-white"
            style={{ background: C.primary, border: "2px solid #fff" }}
          >
            1
          </span>
        </span>
      )}

      {/* shutter flash — opacity 0 here; the page's timeline blinks it */}
      {phase !== "aim" && (
        <div className="cam-flash absolute inset-0 z-30 bg-white" style={{ opacity: 0 }} />
      )}
    </div>
  );
}

/* ─────────────────────── Map home — offline fork ─────────────────────── */
/* MapHomeScreen's composition with connectivity gone: cached pins stay (the
   pack is local), the crisis banner yields to the map-pack banner. The page
   animates mo-pin / mo-banner instead of the lp-drop loop. */
const MO_PINS: { left: number; top: number; tier: Tier }[] = [
  { left: 92, top: 332, tier: "complete" },
  { left: 150, top: 300, tier: "partial" },
  { left: 208, top: 355, tier: "minimal" },
  { left: 120, top: 420, tier: "minimal" },
];

export function MapOfflineScreen() {
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: "#F4F1EA" }}>
      <Basemap />
      {MO_PINS.map((p) => (
        <span
          key={`${p.left}-${p.top}`}
          className="mo-pin absolute z-10 rounded-full"
          style={{
            left: p.left, top: p.top, width: 14, height: 14, background: TIER_COLOR[p.tier],
            border: "2.5px solid #fff", boxShadow: "0 1px 3px rgba(35,46,61,.35)",
          }}
        />
      ))}

      <StatusBar signal={0} time="04:33" />
      {/* top overlays: search + filter, then the map-pack banner */}
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
          className="mo-banner flex items-center gap-[10px] rounded-[14px] p-[10px]"
          style={{ background: C.surface2, border: `1px solid ${C.line}` }}
        >
          <span className="grid h-[32px] w-[32px] shrink-0 place-items-center rounded-[10px]" style={{ background: C.surface3 }}>
            <CloudOff size={18} color={C.ink2} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold" style={{ color: C.ink }}>
              Offline — map pack active
            </span>
            <span className="block truncate text-[12px] font-medium" style={{ color: C.ink2 }}>
              Selmara · 18 MB · cached 3 weeks ago
            </span>
          </span>
        </div>
      </div>

      {/* bottom overlays: recenter + damage stats (same recipe as MapHome) */}
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

/* ──────────────────── Reports — the sync moment ──────────────────── */
/* Focused Reports variant for the one-bar beat: stage 0 = still offline,
   stage 1 = first signal bar, outbox draining, stage 2 = all delivered.
   Rows reuse the ReportRow recipe from screens.tsx verbatim. */
type SyncRowState = "queued" | "syncing" | "synced";

function SyncChip({ state }: { state: SyncRowState }) {
  const cfg = {
    synced: { label: "Synced", Icon: Check, bg: C.okSoft, fg: C.ok },
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

const SS_ROWS = [
  { id: "b781ccbf", time: "1 h ago · K4-112", tier: "partial", photo: "/landing/damage-street.jpg" },
  { id: "7900a404", time: "1 h ago · K4-307", tier: "complete", photo: "/landing/damage-houses.jpg" },
  { id: "6f2d7988", time: "2 h ago · K4-218", tier: "minimal", photo: "/landing/street-antakya.jpg" },
] as const;

export function SyncStatusScreen({ stage }: { stage: 0 | 1 | 2 }) {
  const states: SyncRowState[][] = [
    ["queued", "queued", "queued"],
    ["synced", "syncing", "queued"],
    ["synced", "synced", "synced"],
  ];
  const banner = [
    { bg: C.surface2, Icon: CloudOff, fg: C.ink2, label: "Offline · 3 queued" },
    { bg: C.primarySoft, Icon: CloudUpload, fg: C.primary, label: "One bar — syncing 3 queued…" },
    { bg: C.okSoft, Icon: Check, fg: C.ok, label: "All reports delivered" },
  ][stage];
  const synced = [0, 1, 3][stage];

  return (
    <div className="absolute inset-0 flex flex-col" style={{ background: C.bg }}>
      <StatusBar signal={stage === 0 ? 0 : 1} time="06:12" />
      <div className="px-[20px] pt-[14px]">
        <div className="flex items-center justify-between">
          <span className="text-[26px] font-bold" style={{ color: C.ink, letterSpacing: "-0.02em" }}>Reports</span>
          <span className="grid h-[40px] w-[40px] place-items-center rounded-full" style={{ background: C.surface }}>
            <Download size={18} color={C.ink2} />
          </span>
        </div>
        <div className="pt-[4px] text-[12px] font-medium" style={{ color: C.ink3 }}>
          3 reports · {synced} synced
        </div>
        {/* SyncHeader — the banner the whole beat hangs on */}
        <div
          className="ss-banner mt-[12px] flex items-center rounded-[14px] px-[12px] py-[10px]"
          style={{ gap: 8, background: banner.bg }}
        >
          <banner.Icon size={18} color={banner.fg} />
          <span className="text-[13px] font-semibold" style={{ color: C.ink }}>{banner.label}</span>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-[20px] py-[14px]" style={{ gap: 10 }}>
        {SS_ROWS.map((r, i) => {
          const state = states[stage][i];
          return (
            <div
              key={r.id}
              className="ss-row flex items-center rounded-[18px] p-[12px]"
              style={{ gap: 12, background: C.surface, border: `1px solid ${C.line}` }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.photo} alt="" className="h-[56px] w-[56px] shrink-0 rounded-[14px] object-cover" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center" style={{ gap: 8 }}>
                  <span className="min-w-0 truncate text-[16px] font-bold" style={{ color: C.ink }}>#{r.id}</span>
                  <SyncChip state={state} />
                </span>
                <span className="mt-[2px] block truncate text-[12px] font-medium" style={{ color: C.ink3 }}>{r.time}</span>
                <span className="mt-[6px] inline-flex w-fit items-center rounded-full px-[8px] py-[4px]" style={{ gap: 6, background: TIER_SOFT[r.tier] }}>
                  <span className="rounded-full" style={{ width: 8, height: 8, background: TIER_COLOR[r.tier] }} />
                  <span className="text-[11px] font-semibold" style={{ color: C.ink }}>{TIER_LABEL[r.tier]}</span>
                </span>
                {state === "syncing" && (
                  <span className="mt-[6px] block h-[3px] overflow-hidden rounded-full" style={{ background: C.surface3 }}>
                    <span className="lp-fill block h-full rounded-full" style={{ background: TIER_COLOR[r.tier], width: "55%" }} />
                  </span>
                )}
              </span>
              <ChevronRight size={16} color={C.ink3} className="shrink-0" />
            </div>
          );
        })}
      </div>
      <BottomNav active="reports" />
    </div>
  );
}
