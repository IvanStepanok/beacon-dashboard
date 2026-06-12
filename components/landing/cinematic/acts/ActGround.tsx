"use client";

/* ACT II — GROUND. 420vh. We break through the cloud deck onto the paper map
   (the same Basemap the real app renders), the crisis pin drops, and the
   phone rises into frame: viewfinder → shutter → on-device AI verdict →
   the real damage-tier screen. */

import { useRef } from "react";
import { gsap, useGSAP } from "../gsap";
import { PhoneFrame } from "../../PhoneFrame";
import { CaptureDamageScreen } from "../../screens";
import { CameraScreen } from "../screens-extra";
import { GroundMap } from "../GroundMap";

export function ActGround() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set(".gm-pin-wrap", { autoAlpha: 0, y: -56 });
      gsap.set(".gm-meta", { autoAlpha: 0, x: -14 });
      gsap.set([".gm-copy-1", ".gm-copy-2"], { autoAlpha: 0, y: 42 });
      gsap.set(".gm-phone", { yPercent: 130, rotateX: 16, transformPerspective: 1100, transformOrigin: "50% 100%" });
      gsap.set([".gm-scr-ai", ".gm-scr-tier"], { autoAlpha: 0 });
      gsap.set(".gm-shutterflash", { opacity: 0 });
      gsap.set([".gm-tap-1", ".gm-tap-2"], { autoAlpha: 0, y: 10 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.9,
        },
      });

      tl
        /* arrival: white veil clears, map settles out of the dive */
        .fromTo(".gm-veil", { opacity: 1 }, { opacity: 0, duration: 0.09, ease: "power1.out" }, 0)
        .fromTo(".gm-map", { scale: 2.7 }, { scale: 1.06, duration: 0.62, ease: "power2.out" }, 0)
        /* the crisis pin + meta strip */
        .to(".gm-pin-wrap", { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.07)
        .to(".gm-meta", { autoAlpha: 1, x: 0, duration: 0.05 }, 0.1)
        /* copy beat 1 */
        .to(".gm-copy-1", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.13)
        .to(".gm-copy-1", { autoAlpha: 0, y: -42, duration: 0.05 }, 0.27)
        /* the phone rises */
        .to(".gm-phone", { yPercent: 0, rotateX: 0, duration: 0.14, ease: "power2.out" }, 0.24)
        .to(".gm-copy-2", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.34)
        .to(".gm-tap-1", { autoAlpha: 1, y: 0, duration: 0.04 }, 0.38)
        /* shutter: press, flash, and the AI layer is there when it clears */
        .to(".gm-scr-aim .cam-shutter", { scale: 0.84, duration: 0.015, ease: "power1.in" }, 0.44)
        .to(".gm-scr-aim .cam-shutter", { scale: 1, duration: 0.02, ease: "power1.out" }, 0.455)
        .to(".gm-shutterflash", { opacity: 1, duration: 0.018, ease: "power1.in" }, 0.455)
        .to(".gm-scr-ai", { autoAlpha: 1, duration: 0.001 }, 0.47)
        .to(".gm-shutterflash", { opacity: 0, duration: 0.04, ease: "power2.out" }, 0.475)
        /* the verdict chip pops on its own beat */
        .fromTo(
          ".gm-scr-ai .cam-ai-chip",
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" },
          0.5,
        )
        /* hand over to the real damage-tier screen */
        .to(".gm-scr-tier", { autoAlpha: 1, duration: 0.06 }, 0.62)
        .to(".gm-tap-1", { autoAlpha: 0, y: -10, duration: 0.03 }, 0.62)
        .to(".gm-tap-2", { autoAlpha: 1, y: 0, duration: 0.03 }, 0.65)
        /* slow parallax hold to the act's end */
        .to(".gm-map", { scale: 1.0, duration: 0.3 }, 0.7)
        .to(".gm-copy-2", { autoAlpha: 0, y: -42, duration: 0.06 }, 0.92)
        /* anchor: scrub maps scroll onto [0,1] exactly */
        .set({}, {}, 1);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-ground" data-act data-header-theme="light" className="relative z-10 bg-white" style={{ height: "420vh" }}>
      <div className="sticky top-0 h-dvh overflow-hidden" style={{ background: "#F4F1EA" }}>
        {/* full-bleed city map — same cartographic language as the app */}
        {/* transform-origin = the epicenter, so the dive lands on the pin */}
        <div className="gm-map cl-fillsvg absolute inset-0 will-change-transform" style={{ transformOrigin: "63% 44%" }}>
          <GroundMap />
        </div>

        {/* crisis pin at the map's heart */}
        <div className="gm-pin-wrap absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2 lg:left-[63%]">
          <span className="relative block">
            <span className="cl-ripple absolute -inset-3 rounded-full border-2 border-[#D12800]" />
            <span className="cl-ripple absolute -inset-3 rounded-full border-2 border-[#D12800]" style={{ animationDelay: "1.1s" }} />
            <span className="block h-5 w-5 rounded-full border-[3px] border-white bg-[#D12800] shadow-[0_2px_8px_rgba(209,40,0,0.5)]" />
          </span>
        </div>

        {/* meta strip */}
        <div className="gm-meta absolute left-5 top-24 sm:left-10 lg:left-16">
          <div className="inline-flex items-center gap-2.5 rounded-lg border border-line bg-white/92 px-3.5 py-2 font-mono text-[12px] font-semibold tracking-wide text-ink shadow-sm backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-[#D12800]" />
            Antakya · Hatay — 36.20°N 36.16°E · 04:17
          </div>
        </div>

        <div className="relative mx-auto h-full max-w-[1400px] px-5 sm:px-10">
          {/* copy beat 1 */}
          <div className="gm-copy-1 absolute left-5 top-[34%] max-w-[520px] sm:left-10 lg:left-16">
            <h2 className="text-[clamp(2rem,3.8vw,3.2rem)] font-extrabold leading-[1.07] tracking-[-0.02em] text-ink">
              Someone is already there.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-ink2">
              No assessment team, no drone, no clear sky — just a neighbour with a phone,
              standing in front of a building that used to have four floors.
            </p>
          </div>

          {/* copy beat 2 */}
          <div className="gm-copy-2 absolute left-5 top-[26%] max-w-[460px] sm:left-10 lg:left-16">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Report · three decisions
            </div>
            <h2 className="mt-3 text-[clamp(1.8rem,3.2vw,2.7rem)] font-extrabold leading-[1.08] tracking-[-0.02em] text-ink">
              Photo. Tier. Send.
            </h2>
            <p className="mt-4 max-w-[44ch] text-[16px] leading-relaxed text-ink2">
              A neural network reads the photo <em className="not-italic font-semibold text-ink">on the phone itself</em> and
              suggests the damage tier — advisory only, the human confirms. No cloud,
              no connection, no taxonomy to learn. Everything past the tier is optional detail.
            </p>
            <ul className="mt-5 hidden space-y-2 text-[14px] text-ink sm:block">
              {[
                "Runs in a blackout — the model lives on the device",
                "Snaps to the building footprint, not a fuzzy street point",
                "EXIF stripped and faces blurred before anything leaves",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* the phone, stage right */}
          <div className="gm-phone absolute bottom-0 right-1/2 translate-x-1/2 lg:right-[8%] lg:translate-x-0">
            <div className="origin-bottom scale-[0.55] sm:scale-75 lg:scale-100">
              <PhoneFrame>
                <div className="gm-scr-aim absolute inset-0">
                  <CameraScreen phase="aim" />
                </div>
                <div className="gm-scr-ai invisible absolute inset-0 opacity-0">
                  <CameraScreen phase="ai" />
                </div>
                <div className="gm-scr-tier invisible absolute inset-0 opacity-0">
                  <CaptureDamageScreen />
                </div>
                <div className="gm-shutterflash pointer-events-none absolute inset-0 z-30 bg-white opacity-0" />
              </PhoneFrame>
            </div>
            <div className="gm-tap-1 absolute -left-2 top-[38%] hidden -translate-x-full whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink2 shadow-sm lg:block">
              first — the photo
            </div>
            <div className="gm-tap-2 absolute -left-2 top-[38%] hidden -translate-x-full whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink2 shadow-sm lg:block">
              then — confirm the tier
            </div>
          </div>
        </div>

        {/* arrival veil */}
        <div className="gm-veil pointer-events-none absolute inset-0 z-20 bg-white" />
      </div>
    </section>
  );
}
