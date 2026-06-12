"use client";

/* ACT V — ONE BAR / SITUATION ROOM. 640vh, the longest act: the payoff.
   A single signal bar returns; the outbox drains as report packets fly from
   the phone into the analyst console sliding in from the right; a duplicate
   folds into an existing pin instead of double-counting; then the console
   takes the stage — KPIs roll up, a report gets verified, exports stream. */

import { useEffect, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../gsap";
import { PhoneFrame } from "../../PhoneFrame";
import { SyncStatusScreen } from "../screens-extra";
import { DashboardMock } from "../DashboardMock";

const PACKETS = [
  { id: "b781ccbf", tier: "#FBC412", top: "46%" },
  { id: "7900a404", tier: "#D12800", top: "54%" },
  { id: "6f2d7988", tier: "#59BA47", top: "62%" },
] as const;

/* ──────────────────────────────────────────────────────────────────────────
   TEMPORARY calibration rig — DELETE after the layout coordinates are baked.
   Lets Ivan drag the phone / console and resize them (red corner dot) on any
   monitor, then copy the measured geometry. Scroll is frozen while tuning so
   the scrubbed timeline can't overwrite manual placement; "→ Teaser/Finale"
   jump between the two console phases (copy BEFORE jumping — a jump lets the
   timeline rewrite everything). */
const TUNE_BTN =
  "pointer-events-auto rounded-lg bg-ink px-3 py-2 text-[12px] font-semibold text-white shadow-md transition-colors hover:bg-primary";

function SyncTuner() {
  const [on, setOn] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!on) return;
    const cleanups: (() => void)[] = [];

    /* freeze scrolling — the scrub only rewrites transforms on scroll ticks */
    const block = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener("wheel", block, { passive: false, capture: true });
    window.addEventListener("touchmove", block, { passive: false, capture: true });
    cleanups.push(() => {
      window.removeEventListener("wheel", block, { capture: true });
      window.removeEventListener("touchmove", block, { capture: true });
    });
    document.body.style.userSelect = "none";
    cleanups.push(() => {
      document.body.style.userSelect = "";
    });

    const rigs: { move: HTMLElement | null; size: HTMLElement | null; prop: "scale" | "transform" }[] = [
      {
        move: document.querySelector<HTMLElement>(".sy-phone"),
        size: document.querySelector<HTMLElement>(".sy-phone > div"),
        prop: "scale", // Tailwind scale-[...] compiles to the `scale` property
      },
      {
        move: document.querySelector<HTMLElement>(".sy-dash"),
        size: document.querySelector<HTMLElement>(".sy-dash-inner"),
        prop: "transform", // GSAP owns a pure scale() matrix here
      },
    ];

    rigs.forEach(({ move, size, prop }) => {
      if (!move || !size) return;
      move.style.outline = "2px dashed #D12800";
      move.style.outlineOffset = "4px";
      cleanups.push(() => {
        move.style.outline = "";
        move.style.outlineOffset = "";
      });

      /* drag anywhere on the mock = move (adjusts the translate components
         of whatever transform GSAP/Tailwind already left there) */
      const onDown = (e: PointerEvent) => {
        if ((e.target as HTMLElement).dataset?.calHandle) return;
        e.preventDefault();
        const cs = getComputedStyle(move).transform;
        const m = cs && cs !== "none" ? new DOMMatrix(cs) : new DOMMatrix();
        const sx = e.clientX;
        const sy = e.clientY;
        const onMove = (ev: PointerEvent) => {
          const next = DOMMatrix.fromMatrix(m);
          next.e = m.e + (ev.clientX - sx);
          next.f = m.f + (ev.clientY - sy);
          move.style.transform = next.toString();
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      };
      move.addEventListener("pointerdown", onDown);
      cleanups.push(() => move.removeEventListener("pointerdown", onDown));

      /* red corner dot = uniform resize around the element's own origin */
      const handle = document.createElement("div");
      handle.dataset.calHandle = "1";
      handle.style.cssText =
        "position:absolute;right:-14px;bottom:-14px;width:28px;height:28px;border-radius:50%;" +
        "background:#D12800;border:3px solid #fff;box-shadow:0 2px 10px rgba(0,0,0,.35);" +
        "cursor:nwse-resize;z-index:99;";
      size.appendChild(handle);
      cleanups.push(() => handle.remove());
      const onSizeDown = (e: PointerEvent) => {
        e.preventDefault();
        e.stopPropagation();
        const rect0 = size.getBoundingClientRect();
        const scale0 = rect0.width / size.offsetWidth;
        const sx = e.clientX;
        const onMove = (ev: PointerEvent) => {
          const k = Math.max(0.12, scale0 * (1 + (ev.clientX - sx) / rect0.width));
          if (prop === "scale") size.style.scale = String(k);
          else size.style.transform = `scale(${k})`;
        };
        const onUp = () => {
          window.removeEventListener("pointermove", onMove);
          window.removeEventListener("pointerup", onUp);
        };
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      };
      handle.addEventListener("pointerdown", onSizeDown);
      cleanups.push(() => handle.removeEventListener("pointerdown", onSizeDown));
    });

    return () => {
      cleanups.forEach((fn) => fn());
      /* drop manual overrides, then force a full refresh: scrub ticks only
         re-render tweens around the playhead, so an inline transform left
         outside their window would survive a plain update */
      const phoneInner = document.querySelector<HTMLElement>(".sy-phone > div");
      if (phoneInner) phoneInner.style.scale = "";
      const dashInner = document.querySelector<HTMLElement>(".sy-dash-inner");
      if (dashInner) dashInner.style.transform = "";
      ScrollTrigger.refresh();
    };
  }, [on]);

  const actSpan = () => {
    const act = document.getElementById("act-sync")!;
    const top = act.getBoundingClientRect().top + window.scrollY;
    return { top, span: act.offsetHeight - window.innerHeight };
  };

  const jump = (frac: number) => {
    const { top, span } = actSpan();
    window.scrollTo({ top: top + frac * span, behavior: "auto" });
  };

  const copy = async () => {
    const { top, span } = actSpan();
    const progress = +((window.scrollY - top) / span).toFixed(3);
    const fmt = (el: HTMLElement | null, base?: number) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        top: Math.round(r.top),
        width: Math.round(r.width),
        height: Math.round(r.height),
        scale: +(r.width / (base ?? el.offsetWidth)).toFixed(3),
      };
    };
    const payload = {
      viewport: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
      phase: progress < 0.58 ? "teaser" : "finale",
      syncProgress: progress,
      phone: fmt(document.querySelector<HTMLElement>(".sy-phone > div")),
      console: fmt(document.querySelector<HTMLElement>(".sy-dash-inner")),
    };
    const text = JSON.stringify(payload, null, 2);
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      window.prompt("Clipboard blocked — copy manually:", text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="pointer-events-none absolute bottom-4 right-4 z-[95] flex flex-col items-end gap-2">
      {on && (
        <div className="pointer-events-auto rounded-lg bg-ink/90 px-3 py-2 text-right font-mono text-[11px] leading-relaxed text-white shadow-lg">
          drag the mock = move · red dot = resize
          <br />
          scroll is frozen · Copy BEFORE jumping phases
        </div>
      )}
      <div className="flex gap-2">
        {on && (
          <>
            <button type="button" onClick={() => jump(0.3)} className={TUNE_BTN}>
              → Teaser
            </button>
            <button type="button" onClick={() => jump(0.8)} className={TUNE_BTN}>
              → Finale
            </button>
            <button type="button" onClick={copy} className={TUNE_BTN}>
              {copied ? "Copied ✓" : "Copy coordinates"}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setOn((v) => !v)}
          className={`${TUNE_BTN} ${on ? "!bg-[#D12800]" : ""}`}
        >
          {on ? "Done" : "🛠 Tune layout"}
        </button>
      </div>
    </div>
  );
}
/* ────────────────────────────────────── end of the temporary calibration rig */

export function ActSync() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set(".sy-copy-2", { autoAlpha: 0, y: 42 });
      gsap.set(".sy-copy-3", { autoAlpha: 0, y: 42, xPercent: -50 });
      gsap.set(".sy-scr-1", { autoAlpha: 0 });
      gsap.set(".sy-scr-2", { autoAlpha: 0 });

      /* The console has two ideal sizes: a compact teaser while it shares
         the stage with the phone and copy, and a near-full-bleed hero once
         it has the stage to itself. Both derive from the real viewport
         (function-based + invalidateOnRefresh → recomputed on resize). */
      const compactScale = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return w < 1024
          ? Math.min((w * 0.92) / 1280, (h * 0.5) / 840)
          : Math.min(Math.max((w * 0.55) / 1280, 0.5), (h * 0.62) / 840, 0.85);
      };
      const bigScale = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return Math.min(Math.max((w * 0.88) / 1280, 0.26), (h * 0.78) / 840, 1.8);
      };
      const hiddenX = () => window.innerWidth + 60;
      const peekX = () => {
        const w = window.innerWidth;
        const visW = 1280 * compactScale();
        return w < 1024
          ? Math.max(w - visW * 0.98, w * 0.04)
          : Math.max(w - visW * 0.86, w * 0.55 + 320);
      };
      const centerX = () => (window.innerWidth - 1280 * bigScale()) / 2;
      gsap.set(".sy-packet", { autoAlpha: 0 });
      gsap.set(".sy-dup-note", { autoAlpha: 0, y: 12 });
      gsap.set(".dm-pin", { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".dm-cluster", { scale: 0, transformOrigin: "50% 50%" });
      gsap.set(".sy-final", { autoAlpha: 0, y: 16, xPercent: -50 });
      gsap.set(".dm-kpi-sub", { autoAlpha: 0 });
      gsap.set(".dm-stamp", { yPercent: -50, rotate: -8, scale: 2.4, autoAlpha: 0 });
      /* the pin the duplicate folds into */
      const pinTarget = gsap.utils.toArray<HTMLElement>(".dm-pin")[4];

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
          invalidateOnRefresh: true,
        },
      });

      tl
        /* the bar comes back */
        .fromTo(".sy-phone", { autoAlpha: 0, y: 60 }, { autoAlpha: 1, y: 0, duration: 0.06, ease: "power2.out" }, 0.01)
        .fromTo(".sy-copy-1", { autoAlpha: 0, y: 42 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.03)
        .to(".sy-scr-1", { autoAlpha: 1, duration: 0.04 }, 0.08)
        /* console slides in to receive — compact teaser off the right edge */
        .fromTo(".sy-dash", { x: hiddenX }, { x: peekX, duration: 0.12, ease: "power2.out" }, 0.12)
        .fromTo(
          ".sy-dash-inner",
          { scale: compactScale, transformOrigin: "top left" },
          { scale: bigScale, duration: 0.1, ease: "power2.inOut" },
          0.58,
        )
        /* packets fly — staggered, each pops a pin on arrival */
        .fromTo(
          ".sy-packet",
          { autoAlpha: 0, x: 0, y: 0, scale: 1 },
          {
            autoAlpha: 1,
            duration: 0.02,
            stagger: 0.045,
          },
          0.16,
        )
        .to(
          ".sy-packet",
          {
            keyframes: [
              { x: "30vw", y: "-13vh", scale: 0.92, duration: 0.05 },
              { x: "56vw", y: "-5vh", scale: 0.55, autoAlpha: 0, duration: 0.05 },
            ],
            stagger: 0.045,
            ease: "power1.inOut",
          },
          0.18,
        )
        .to(".dm-pin", { scale: 1, duration: 0.03, stagger: 0.012, ease: "back.out(2)" }, 0.24)
        .to(".dm-cluster", { scale: 1, duration: 0.04, stagger: 0.02, ease: "back.out(1.8)" }, 0.3)
        /* outbox drains on the phone */
        .to(".sy-scr-2", { autoAlpha: 1, duration: 0.04 }, 0.3)
        .to(".sy-copy-1", { autoAlpha: 0, y: -42, duration: 0.04 }, 0.3)
        /* the duplicate folds in */
        .to(".sy-copy-2", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.34)
        .fromTo(
          ".sy-dup",
          { autoAlpha: 0, x: 0, y: 0, scale: 1 },
          { autoAlpha: 1, duration: 0.015 },
          0.38,
        )
        .to(
          ".sy-dup",
          {
            keyframes: [
              { x: "34vw", y: "-12vh", scale: 0.8, duration: 0.045 },
              { x: "58vw", y: "-6vh", scale: 0.15, autoAlpha: 0, duration: 0.04 },
            ],
            ease: "power1.inOut",
          },
          0.395,
        )
        .to(pinTarget, { keyframes: [{ scale: 1.9, duration: 0.02 }, { scale: 1, duration: 0.03 }] }, 0.475)
        .to(".sy-dup-note", { autoAlpha: 1, y: 0, duration: 0.04 }, 0.49)
        .to(".sy-dup-note", { autoAlpha: 0, duration: 0.04 }, 0.6)
        .to(".sy-copy-2", { autoAlpha: 0, y: -42, duration: 0.04 }, 0.56)
        /* the console takes the stage — big, dead center */
        .to(".sy-phone", { autoAlpha: 0, x: -80, duration: 0.06 }, 0.58)
        .to(".sy-dash", { x: centerX, duration: 0.1, ease: "power2.inOut" }, 0.58)
        .to(".sy-copy-3", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.64)
        .to(".dm-kpi-sub", { autoAlpha: 1, duration: 0.04 }, 0.64)
        /* KPIs roll up (scrub-tied: reversing rolls them back down) */
        .to(".dm-stamp", { autoAlpha: 1, scale: 1, duration: 0.04, ease: "back.out(2.5)" }, 0.78)
        .fromTo(
          ".dm-export",
          { autoAlpha: 0.55 },
          { autoAlpha: 1, duration: 0.03, stagger: 0.02 },
          0.84,
        )
        .to(".sy-final", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.9)
        /* anchor: scrub maps scroll onto [0,1] exactly */
        .set({}, {}, 1);

      /* counter roll-ups live outside the timeline targets-array dance —
         one object tween per KPI, placed on the same scrubbed timeline */
      gsap.utils.toArray<HTMLElement>(".dm-kpi").forEach((el) => {
        const target = Number(el.dataset.target ?? 0);
        const state = { v: 0 };
        tl.to(
          state,
          {
            v: target,
            duration: 0.16,
            ease: "power1.out",
            onUpdate: () => {
              const v = Math.round(state.v);
              el.textContent = v === 0 ? "—" : v.toLocaleString("en-US");
            },
          },
          0.66,
        );
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-sync" data-act data-header-theme="light" className="relative z-10" style={{ height: "640vh", background: "linear-gradient(180deg,#FFFFFF 0%,#EFF6FC 60%,#E6F0F9 100%)" }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="relative mx-auto h-full max-w-[1500px] px-5 sm:px-10">
          {/* copy beats — top-left band */}
          <div className="sy-copy-1 absolute left-5 top-[10%] max-w-[440px] sm:left-10 lg:left-[26%]">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              06:12 · signal restored
            </div>
            <h2 className="mt-3 text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
              One bar is enough.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink2">
              The outbox flushes itself the moment any connection returns. Submissions are
              idempotent — a retry can never count the same report twice.
            </p>
          </div>

          <div className="sy-copy-2 absolute left-5 top-[10%] max-w-[440px] sm:left-10 lg:left-[26%]">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Spatial dedup
            </div>
            <h2 className="mt-3 text-[clamp(1.8rem,3.4vw,2.8rem)] font-extrabold leading-[1.07] tracking-[-0.02em] text-ink">
              A second witness becomes a second version — not a second building.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink2">
              Two neighbours report the same collapsed house. The server folds them into
              one versioned record; the damage count stays honest.
            </p>
          </div>

          <div className="sy-copy-3 absolute left-1/2 top-[4%] w-[min(96vw,1640px)] text-center">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              The situation room
            </div>
            <h2 className="mt-2.5 text-[clamp(1.4rem,2.3vw,2.4rem)] font-extrabold leading-[1.1] tracking-[-0.02em] text-ink">
              From a street in Selmara to a verified record — in hours, not weeks.
            </h2>
          </div>

          {/* the phone, stage left */}
          <div className="sy-phone absolute bottom-0 left-1/2 -translate-x-1/2 lg:bottom-[var(--phone-lift,0px)] lg:left-[3%] lg:translate-x-0">
            <div className="origin-bottom scale-[0.5] sm:scale-[0.7] lg:scale-[calc(var(--phone-scale,1)*0.85)]">
              <PhoneFrame>
                <div className="absolute inset-0 isolate">
                  <SyncStatusScreen stage={0} />
                </div>
                <div className="sy-scr-1 invisible absolute inset-0 isolate opacity-0">
                  <SyncStatusScreen stage={1} />
                </div>
                <div className="sy-scr-2 invisible absolute inset-0 isolate opacity-0">
                  <SyncStatusScreen stage={2} />
                </div>
              </PhoneFrame>
            </div>
          </div>

          {/* report packets in flight */}
          <div className="pointer-events-none absolute inset-0 z-20 hidden lg:block" aria-hidden>
            {PACKETS.map((p) => (
              <span
                key={p.id}
                className="sy-packet absolute left-[21%] flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11.5px] font-semibold text-ink shadow-[0_10px_30px_-8px_rgba(0,40,80,0.3)]"
                style={{ top: p.top }}
              >
                <span className="h-2 w-2 rounded-full" style={{ background: p.tier }} />
                #{p.id}
              </span>
            ))}
            <span
              className="sy-dup absolute left-[21%] top-[50%] flex items-center gap-2 rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11.5px] font-semibold text-ink shadow-[0_10px_30px_-8px_rgba(0,40,80,0.3)]"
            >
              <span className="h-2 w-2 rounded-full bg-[#FBC412]" />
              #c4d20a11 · same building
            </span>
            <span className="sy-dup-note absolute right-[14%] top-[30%] rounded-lg border border-line bg-white px-3.5 py-2 font-mono text-[11.5px] font-semibold text-primary-ink shadow-md">
              duplicate folded · version 2 of one building · count unchanged
            </span>
          </div>

          <div className="sy-final absolute bottom-5 left-1/2 whitespace-nowrap font-mono text-[12.5px] font-semibold uppercase tracking-[0.14em] text-ink2">
            502,064 reports benchmarked · p95 submit 215 ms · five export formats, ready for GeoHub
          </div>
        </div>

        {/* the analyst console — outside the copy container so the finale can
            center on the full viewport, not the 1500px column */}
        <div className="sy-dash absolute left-0 top-[26%] lg:top-[13%]">
          <div className="sy-dash-inner">
            <DashboardMock />
          </div>
        </div>

        {/* TEMPORARY — remove with SyncTuner above */}
        <SyncTuner />
      </div>
    </section>
  );
}
