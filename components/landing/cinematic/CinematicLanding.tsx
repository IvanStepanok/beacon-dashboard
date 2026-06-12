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
import { Globe, MonitorCheck, Radar } from "lucide-react";
import { gsap, ScrollTrigger } from "./gsap";
import { FilmVideo } from "./FilmVideo";
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
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
              <Radar size={19} strokeWidth={2.2} />
            </span>
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
  useFluidStageScale(!reduced);

  /* Smooth-scroll substrate, single rAF via gsap.ticker. `anchors` keeps the
     hero's #act-ground CTA on the same eased ride as the chapter rail. */
  useEffect(() => {
    if (reduced) return;
    const lenis = new Lenis({ autoRaf: false, lerp: 0.1, anchors: true });
    lenisRef.current = lenis;

    /* ── state snapping ──────────────────────────────────────────────────
       Video-editor magnetism: each act lists its stable states (a copy beat
       fully shown, a phone screen settled) as act-progress fractions —
       they mirror the acts' own timelines. When scrolling comes to rest
       within SNAP_RADIUS of a state, Lenis glides the last bit onto it, so
       landing on a screen stops being precision work; resting farther away
       (free-scrubbing the flight) is left alone. Desktop-gated: below lg
       the privacy act flows unstickied and the fractions don't hold. */
    const SNAP_STATES: [string, number[]][] = [
      ["act-orbit", [0, 0.42, 0.84]],
      ["act-ground", [0.28, 0.76, 0.88, 0.97]],
      ["act-offline", [0.2, 0.47, 0.75]],
      ["act-privacy", [0.4, 0.78]],
      ["act-sync", [0.27, 0.5, 0.8, 0.95]],
    ];
    const SNAP_RADIUS_VH = 0.22;
    const SNAP_DELAY_MS = 160;
    let points: number[] = [];
    const measure = () => {
      points = [];
      if (window.innerWidth < 1024) return;
      for (const [id, fracs] of SNAP_STATES) {
        const el = document.getElementById(id);
        if (!el) continue;
        const top = el.getBoundingClientRect().top + window.scrollY;
        const span = el.offsetHeight - window.innerHeight;
        if (span <= 0) continue;
        for (const f of fracs) points.push(Math.round(top + f * span));
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
      if (d < 2 || d > window.innerHeight * SNAP_RADIUS_VH) return;
      glidingUntil = performance.now() + 950;
      lenis.scrollTo(best, { duration: 0.6, easing: (t: number) => 1 - Math.pow(1 - t, 3) });
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
