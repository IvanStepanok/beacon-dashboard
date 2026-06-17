"use client";

/* The film. A fixed WebGL orbit behind six scroll acts:
   I  Orbit — the blind view from space, clouds roll in, descent
   II Ground — the map, the pin, the phone, the on-device AI
   III Blackout — zero bars is the design target
   IV Privacy — real on-device redaction output
   V  One bar — outbox → analyst console, dedup, verification
   VI CTA — get the app / open the console / the numbers

   Lenis smooths the substrate (driven from gsap.ticker — one rAF loop);
   prefers-reduced-motion gets the calm classic page instead of the film.
   All scroll-rate state (header theme/hide, chapter rail) lives in
   FilmChrome, a leaf component — so its setState never re-renders the
   acts or the procedural SVG city. */

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import Link from "next/link";
import Lenis from "lenis";
import { Globe, MonitorCheck } from "lucide-react";
import { gsap, ScrollTrigger } from "./gsap";
import { FilmVideo } from "./FilmVideo";
import { onBridgeChange, orbitBridge } from "./bridge";
import { ActOrbit } from "./acts/ActOrbit";
import { ActGround } from "./acts/ActGround";
import { ActOffline } from "./acts/ActOffline";
import { ActPrivacy } from "./acts/ActPrivacy";
import { ActSync } from "./acts/ActSync";
import { ActCta } from "./acts/ActCta";
import ClassicLanding from "@/app/classic/page";

const CHAPTERS = [
  ["act-orbit", "Orbit"],
  ["act-ground", "Ground"],
  ["act-offline", "Offline"],
  ["act-privacy", "Privacy"],
  ["act-sync", "Sync"],
  ["act-cta", "Deploy"],
] as const;

const subscribeReducedMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/* The device mock has a fixed 360×800 pixel stage — on a 4K monitor a
   hardcoded scale leaves it toy-sized, on a small laptop it crowds the
   copy. CSS variables set from the real viewport drive the lg+ scale
   wrappers instead (the analyst console sizes itself inside ActSync's own
   timeline, where it needs two different scales). */
function useFluidStageScale(enabled: boolean) {
  useLayoutEffect(() => {
    if (!enabled) return;
    const root = document.documentElement;
    const apply = () => {
      const h = window.innerHeight;
      /* phone: fill ~75% of the stage height, never comically large/small */
      const phone = Math.min(Math.max(h / 880, 0.8), 1.6);
      /* lift the bottom-anchored phones off the viewport floor on tall
         screens — 38% of the free space, capped */
      const lift = Math.min(Math.max(0, (h - 680 * phone) * 0.38), h * 0.12);
      root.style.setProperty("--phone-scale", phone.toFixed(3));
      root.style.setProperty("--phone-lift", `${Math.round(lift)}px`);
    };
    apply();
    window.addEventListener("resize", apply);
    return () => {
      window.removeEventListener("resize", apply);
      root.style.removeProperty("--phone-scale");
      root.style.removeProperty("--phone-lift");
    };
  }, [enabled]);
}

/* Header + chapter rail. Isolated on purpose: its state flips at scroll
   rate (direction changes, chapter boundaries) and must not re-render the
   six acts above it. */
function FilmChrome({ lenisRef }: { lenisRef: RefObject<Lenis | null> }) {
  const [headerDark, setHeaderDark] = useState(true);
  const [headerHidden, setHeaderHidden] = useState(false);
  const [chapter, setChapter] = useState(0);

  useEffect(() => {
    const triggers = CHAPTERS.map(([id], i) =>
      ScrollTrigger.create({
        trigger: `#${id}`,
        start: "top 64",
        end: "bottom 64",
        onToggle: (self) => {
          if (!self.isActive) return;
          setChapter(i);
          const el = document.getElementById(id);
          setHeaderDark(el?.dataset.headerTheme !== "light");
        },
      }),
    );
    const dir = ScrollTrigger.create({
      start: 0,
      end: "max",
      onUpdate: (self) => setHeaderHidden(self.direction === 1 && self.scroll() > 500),
    });
    return () => {
      triggers.forEach((t) => t.kill());
      dir.kill();
    };
  }, []);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (lenisRef.current) lenisRef.current.scrollTo(el, { duration: 1.6 });
    else el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      {/* ── floating header (hides going down, returns on the way up) ── */}
      <header
        className={`fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-[transform,background-color,border-color] duration-500 ${
          headerDark ? "border-b border-white/10 bg-[#06101C]/45" : "border-b border-line/70 bg-white/75"
        }`}
        style={{ transform: headerHidden ? "translateY(-110%)" : "translateY(0)" }}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-5 py-3.5 sm:px-10">
          <button onClick={() => scrollTo("act-orbit")} className="flex items-center gap-2.5" aria-label="Back to top">
            <img src="/beacon-icon.png" alt="Beacon" className="h-9 w-9 rounded-xl" />
            <span className={`text-[17px] font-extrabold tracking-tight transition-colors duration-300 ${headerDark ? "text-white" : "text-ink"}`}>
              Beacon
            </span>
          </button>
          <nav className="flex items-center gap-2.5">
            <Link
              href="/public"
              className={`hidden items-center gap-1.5 rounded-lg border px-3.5 py-2 text-[13px] font-semibold transition-colors duration-300 sm:inline-flex ${
                headerDark
                  ? "border-white/25 bg-white/5 text-white hover:bg-white/15"
                  : "border-line bg-white/70 text-ink hover:bg-white"
              }`}
            >
              <Globe size={14} /> Public map
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-ink"
            >
              <MonitorCheck size={14} /> Analyst console
            </Link>
          </nav>
        </div>
      </header>

      {/* ── chapter rail ── */}
      <div className="fixed left-6 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-4 lg:flex">
        {CHAPTERS.map(([id, label], i) => (
          <button key={id} onClick={() => scrollTo(id)} className="group flex items-center gap-2.5" aria-label={`Go to ${label}`}>
            <span
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                chapter === i
                  ? "scale-125 bg-primary"
                  : headerDark
                    ? "bg-white/30 group-hover:bg-white/60"
                    : "bg-ink/20 group-hover:bg-ink/50"
              }`}
            />
            <span
              className={`font-mono text-[10px] font-semibold uppercase tracking-[0.16em] opacity-0 transition-all duration-300 group-hover:opacity-90 ${
                headerDark ? "text-white" : "text-ink"
              }`}
            >
              {String(i + 1).padStart(2, "0")} {label}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

export default function CinematicLanding() {
  const reduced = useReducedMotion();
  const lenisRef = useRef<Lenis | null>(null);
  /* 0..1 while the film buffers (scroll is held); null once released */
  const [filmLoading, setFilmLoading] = useState<number | null>(0);
  useFluidStageScale(!reduced);

  /* Smooth-scroll substrate, single rAF via gsap.ticker. `anchors` keeps the
     hero's #act-ground CTA on the same eased ride as the chapter rail. */
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: true });
    lenisRef.current = lenis;

    /* ── film preload gate ───────────────────────────────────────────────
       The hero paints instantly (poster frame), but scrubbing into an
       unbuffered region shows frozen frames — so the wheel stays locked
       until the film reports enough buffer for the whole descent (~7 s of
       10). On broadband this is sub-second; a failsafe releases the page
       after 8 s no matter what so a flaky link can't trap anyone. */
    let unlocked = false;
    const gateTimers: number[] = [];
    const bootAt = performance.now();
    lenis.stop();
    /* lenis.stop() covers wheel/touch; overflow:hidden also blocks
       keyboard and scrollbar scrolling while the curtain is up */
    document.documentElement.style.overflow = "hidden";
    const release = () => {
      document.documentElement.style.overflow = "";
      lenis.start();
      setFilmLoading(2); /* 2 = curtain fading out */
      gateTimers.push(window.setTimeout(() => setFilmLoading(null), 560));
    };
    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      /* hold the brand curtain at least 700 ms — a sub-frame blink reads
         worse than a beat of intentional loading */
      gateTimers.push(window.setTimeout(release, Math.max(0, 700 - (performance.now() - bootAt))));
    };
    /* subscribe, then re-read: the film component mounts first and may
       have flipped filmReady before this listener existed */
    const offFilmReady = onBridgeChange(() => {
      if (orbitBridge.filmReady) unlock();
    });
    if (orbitBridge.filmReady) unlock();
    const failsafe = window.setTimeout(unlock, 8000);

    /* ── state snapping ──────────────────────────────────────────────────
       Video-editor magnetism, two regimes:
       · UI zones (`stepped` range of an act): the phone/console screens
         live here — resting between states is never allowed, scroll always
         settles onto the nearest state, so two screens can't sit blended
         in a half-crossfade. Transitions play while you scroll; rests are
         always clean frames.
       · Film zones (everything else — the planet, the flight): free
         scrubbing; only a rest already within SNAP_RADIUS of a state gets
         pulled onto it.
       Fractions mirror the acts' timelines — retime both together.
       Desktop-gated: below lg the privacy act flows unstickied. */
    const SNAP_SPECS: { id: string; states: number[]; stepped?: [number, number] }[] = [
      { id: "act-orbit", states: [0, 0.42, 0.84] },
      { id: "act-ground", states: [0.17, 0.47, 0.65, 0.88], stepped: [0.375, 1] },
      { id: "act-offline", states: [0.2, 0.47, 0.75], stepped: [0, 1] },
      { id: "act-privacy", states: [0.12, 0.4, 0.78], stepped: [0, 1] },
      { id: "act-sync", states: [0.27, 0.5, 0.8, 0.95], stepped: [0, 1] },
    ];
    const SNAP_RADIUS_VH = 0.22;
    const SNAP_DELAY_MS = 160;
    let points: number[] = [];
    let zones: [number, number][] = [];
    const measure = () => {
      points = [];
      zones = [];
      if (window.innerWidth < 1024) return;
      for (const { id, states, stepped } of SNAP_SPECS) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const span = el.offsetHeight - window.innerHeight;
        if (span <= 0) continue;
        for (const f of states) points.push(Math.round(top + f * span));
        if (stepped) zones.push([Math.round(top + stepped[0] * span), Math.round(top + stepped[1] * span)]);
      }
      points.sort((a, b) => a - b);
    };
    measure();
    ScrollTrigger.addEventListener("refresh", measure);

    let snapTimer = 0;
    let glidingUntil = 0; /* ignore the glide's own scroll events */
    const settle = () => {
      if (!points.length) return;
      const y = window.scrollY;
      let best = points[0];
      for (const p of points) if (Math.abs(p - y) < Math.abs(best - y)) best = p;
      const d = Math.abs(best - y);
      const inUiZone = zones.some(([a, b]) => y >= a && y <= b);
      if (d < 2 || (!inUiZone && d > window.innerHeight * SNAP_RADIUS_VH)) return;
      const duration = 0.45 + Math.min(d / 1500, 0.45);
      glidingUntil = performance.now() + duration * 1000 + 350;
      lenis.scrollTo(best, { duration, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
    };
    const onScroll = () => {
      ScrollTrigger.update();
      if (performance.now() < glidingUntil) return;
      window.clearTimeout(snapTimer);
      snapTimer = window.setTimeout(settle, SNAP_DELAY_MS);
    };
    lenis.on("scroll", onScroll);

    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);
    return () => {
      window.clearTimeout(snapTimer);
      window.clearTimeout(failsafe);
      gateTimers.forEach((t) => window.clearTimeout(t));
      document.documentElement.style.overflow = "";
      offFilmReady();
      ScrollTrigger.removeEventListener("refresh", measure);
      gsap.ticker.remove(raf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reduced]);

  if (reduced) return <ClassicLanding />;

  return (
    <div className="relative bg-white">
      <FilmVideo />
      {/* brand curtain — an opaque loading screen in the film's deep-space
          tone, up from the very first SSR byte until the descent is
          buffered (so the page can never look frozen-but-unscrollable),
          then a 0.5 s fade reveals the hero */}
      {filmLoading !== null && (
        <div
          aria-hidden
          className={`fixed inset-0 z-[100] grid place-items-center bg-[#04090F] transition-opacity duration-500 ${
            filmLoading === 2 ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <div className="flex flex-col items-center gap-8">
            <div className="flex items-center gap-3">
              <img src="/beacon-icon.png" alt="Beacon" className="h-11 w-11 rounded-xl" />
              <span className="text-[22px] font-extrabold tracking-tight text-white">Beacon</span>
            </div>
            <span className="h-12 w-12 animate-spin rounded-full border-[3px] border-white/15 border-t-white" />
          </div>
        </div>
      )}
      <FilmChrome lenisRef={lenisRef} />
      <main>
        <ActOrbit />
        <ActGround />
        <ActOffline />
        <ActPrivacy />
        <ActSync />
        <ActCta />
      </main>
    </div>
  );
}
