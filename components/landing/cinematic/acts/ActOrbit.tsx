"use client";

/* ACT I — ORBIT. 560vh. The fixed WebGL globe is the visual; this section
   owns the master scrub that feeds it (orbitBridge.progress), the copy beats
   that crossfade over it, the descent instrument cluster and the white
   through-the-clouds flash that hands off to the ground act. */

import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, Globe } from "lucide-react";
import { gsap, ScrollTrigger, SplitText, useGSAP } from "../gsap";
import { orbitBridge, setActOn } from "../bridge";

/* Same curve the camera rig uses — the altitude readout must agree with it. */
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

export function ActOrbit() {
  const root = useRef<HTMLElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      /* Hero headline reveal on load — masked line rise, the one entrance
         animation that is time-driven, not scroll-driven. */
      SplitText.create(".orb-h1", {
        type: "lines",
        mask: "lines",
        aria: "auto",
        autoSplit: true, // re-splits when webfonts land — line masks stay true
        onSplit: (self) =>
          gsap.from(self.lines, {
            yPercent: 110,
            duration: 1.1,
            stagger: 0.09,
            ease: "power4.out",
            delay: 0.25,
          }),
      });
      gsap.from(".orb-hero-sub > *", {
        autoAlpha: 0,
        y: 18,
        duration: 0.9,
        stagger: 0.08,
        delay: 0.7,
        ease: "power3.out",
      });

      /* Master scrub → WebGL bridge. scrub:true (1:1) — the scene applies its
         own easing curves, and the altitude HUD must not lag the camera. */
      const master = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          orbitBridge.progress = self.progress;
          if (altRef.current) {
            const r = gsap.utils.interpolate(3.25, 1.18, smoothstep(0.52, 0.92, self.progress));
            const km = Math.max(56, Math.round(((r - 1) / 2.25) * 700));
            altRef.current.textContent = km.toLocaleString("en-US");
          }
        },
        onLeave: () => setActOn("orbit", false),
        onEnterBack: () => setActOn("orbit", true),
      });
      /* A reload mid-page lands with the trigger already past — tell the
         canvas the truth from the start. */
      setActOn("orbit", master.isActive || master.progress < 1);

      /* Copy beats — a single scrubbed timeline, positions are fractions of
         the act. Text lags the camera slightly (scrub 0.6) for weight. */
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });
      gsap.set([".orb-beat-1", ".orb-beat-2"], { autoAlpha: 0, y: 48 });
      gsap.set(".orb-hud", { autoAlpha: 0 });
      gsap.set(".orb-flash", { opacity: 0 });

      tl.to(".orb-beat-0", { autoAlpha: 0, y: -48, duration: 0.05 }, 0.09)
        .to(".orb-beat-1", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.16)
        .to(".orb-beat-1", { autoAlpha: 0, y: -48, duration: 0.05 }, 0.3)
        .to(".orb-beat-2", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.37)
        .to(".orb-beat-2", { autoAlpha: 0, y: -48, duration: 0.05 }, 0.5)
        .to(".orb-hud", { autoAlpha: 1, duration: 0.03 }, 0.56)
        .to(".orb-hud", { autoAlpha: 0, duration: 0.03 }, 0.8)
        .to(".orb-flash", { opacity: 1, duration: 0.1, ease: "power1.in" }, 0.82)
        /* hold the white through the act's end — the ground veil takes over */
        .to(".orb-flash", { opacity: 1, duration: 0.06, ease: "none" }, 0.94)
        .set({}, {}, 1);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-orbit" data-act data-header-theme="dark" className="relative" style={{ height: "560vh" }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        {/* readability scrims behind the copy */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[#04090F]/45 lg:hidden" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 hidden w-[58%] lg:block"
          style={{ background: "linear-gradient(90deg, rgba(3,8,14,0.78) 0%, rgba(3,8,14,0.32) 55%, rgba(3,8,14,0) 100%)" }}
        />
        <div className="relative mx-auto h-full max-w-[1400px] px-5 sm:px-10">
          {/* ── beat 0 · hero ── */}
          <div className="orb-beat-0 absolute left-5 top-[16%] max-w-[600px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF5B3D]" />
              Beacon · UNDP Crisis Mapping Challenge
            </div>
            <h1 className="orb-h1 mt-6 text-[clamp(2.5rem,5.2vw,4.4rem)] font-extrabold leading-[1.04] tracking-[-0.025em] text-white">
              From 700 km up, every street looks fine.
            </h1>
            <div className="orb-hero-sub">
              <p className="mt-6 max-w-[54ch] text-[17px] leading-relaxed text-white/75">
                The first hours of a disaster are mapped from orbit — too coarse, too slow,
                and only when the sky agrees. The people who know the truth are already
                standing in it.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#act-ground"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-primary-ink"
                >
                  Watch the journey of one report <ArrowRight size={16} />
                </a>
                <Link
                  href="/public"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
                >
                  <Globe size={15} /> Live public map
                </Link>
              </div>
            </div>
          </div>

          {/* ── beat 1 · satellites & clouds ── */}
          <div className="orb-beat-1 invisible absolute left-5 opacity-0 top-[16%] max-w-[560px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FF8A70]">
              04:17 · Earthquake M 6.4 · Selmara, Vetra Province
            </div>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white">
              Optical satellites need days. And clear skies.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-white/75">
              Imaging satellites wait for the next orbital pass — and for the weather to break.
              After the 2023 Türkiye–Syria earthquake, usable building-level damage maps took days —
              while search windows were measured in hours. Tonight, the clouds are rolling in.
            </p>
          </div>

          {/* ── beat 2 · the answer ── */}
          <div className="orb-beat-2 invisible absolute left-5 opacity-0 top-[16%] max-w-[560px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-soft">
              The Beacon answer
            </div>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white">
              The fastest sensor network is already deployed.
            </h2>
            <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-white/75">
              Four billion smartphones. Beacon turns each one into a damage sensor —
              no account, no signal, no training required. Let&apos;s follow one
              report from the street it starts on.
            </p>
          </div>

          {/* ── descent instrument cluster ── */}
          <div className="orb-hud invisible absolute bottom-12 left-5 font-mono text-[12px] uppercase tracking-[0.18em] text-white/85 opacity-0 sm:left-10 lg:left-16">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF5B3D]" />
              Descending · Selmara, Vetra Province
            </div>
            <div className="mt-2 text-[20px] font-bold tabular-nums text-white">
              Alt <span ref={altRef}>700</span> km
            </div>
          </div>
        </div>

        {/* through-the-clouds flash — hands off to the ground act */}
        <div className="orb-flash pointer-events-none absolute inset-0 z-20 bg-white opacity-0" />
      </div>
    </section>
  );
}
