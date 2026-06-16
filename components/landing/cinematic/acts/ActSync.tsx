"use client";

/* ACT V — ONE BAR / SITUATION ROOM. 640vh, the longest act: the payoff.
   A single signal bar returns; the outbox drains as report packets fly from
   the phone into the analyst console sliding in from the right; a duplicate
   folds into an existing pin instead of double-counting; then the console
   takes the stage — KPIs roll up, a report gets verified, exports stream. */

import { useRef } from "react";
import { gsap, useGSAP } from "../gsap";
import { PhoneFrame } from "../../PhoneFrame";
import { SyncStatusScreen } from "../screens-extra";
import { DashboardMock } from "../DashboardMock";

const PACKETS = [
  { id: "b781ccbf", tier: "#FBC412", top: "46%" },
  { id: "7900a404", tier: "#D12800", top: "54%" },
  { id: "6f2d7988", tier: "#59BA47", top: "62%" },
] as const;


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
         (function-based + invalidateOnRefresh → recomputed on resize).
         Teaser geometry is calibrated against Ivan's hand-placed layouts
         on a 14" MacBook (1500×750) and a 4K monitor (3008×1604). */
      const compactScale = () => {
        const w = window.innerWidth;
        const h = window.innerHeight;
        return w < 1024
          ? Math.min((w * 0.92) / 1280, (h * 0.5) / 840)
          : Math.min(Math.max((w * 0.55) / 1280, 0.5), (h * 0.62) / 840, 1);
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
        if (w < 1024) return Math.max(w - visW * 0.98, w * 0.04);
        /* fully on screen when there's room (36px right margin), but never
           crowding the copy column — overflow the right edge instead (the
           14" case, where copy + console simply don't both fit) */
        const cw = Math.min(w, 1500);
        const copyRight = (w - cw) / 2 + cw * 0.26 + 440;
        return Math.max(w - visW - 36, copyRight + 36);
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
              From a street to a verified record — in hours, not weeks.
            </h2>
          </div>

          {/* the phone, stage left — hugging the copy column from the left
              (calibrated): left = copy column (26%) minus the phone's visual
              width (308px × scale, origin-bottom keeps x centered) minus a
              32px gap; scale rides --phone-scale but stops at 1.36 */}
          <div className="sy-phone absolute bottom-0 left-1/2 -translate-x-1/2 lg:bottom-[var(--phone-lift,0px)] lg:left-[max(calc(26%-186px-min(var(--phone-scale,1),1.36)*154px),8px)] lg:translate-x-0">
            <div className="origin-bottom scale-[0.5] sm:scale-[0.7] lg:scale-[min(var(--phone-scale,1),1.36)]">
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

      </div>
    </section>
  );
}
