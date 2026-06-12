"use client";

/* ACT II — THE FLIGHT. 600vh. One continuous shot: we punch out of the cloud
   deck above Selmara (the scroll-scrubbed film renders in the fixed video
   behind this transparent stage), drift down from bird's eye, level out, and
   land at eye height on a street facing the collapsed building — then the
   phone rises and the capture happens. The master scrub feeds
   orbitBridge.city; the same trigger drives the DOM beats, so the film and
   the copy can never drift apart. The altitude HUD continues the orbit
   act's readout: kilometres up there, metres down here. */

import { useRef } from "react";
import { gsap, ScrollTrigger, useGSAP } from "../gsap";
import { PhoneFrame } from "../../PhoneFrame";
import { CaptureDamageScreen } from "../../screens";
import { CameraScreen } from "../screens-extra";
import { orbitBridge, setActOn } from "../bridge";
import { camAltitudeAt, flightU, FLIGHT_END } from "../city/cityLayout";

export function ActGround() {
  const root = useRef<HTMLElement>(null);
  const altRef = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      gsap.set(".gm-meta", { autoAlpha: 0, x: -14 });
      gsap.set([".gm-copy-1", ".gm-copy-2"], { autoAlpha: 0, y: 42 });
      gsap.set(".gm-hud", { autoAlpha: 0 });
      gsap.set(".gm-phone", { yPercent: 230, rotateX: 16, transformPerspective: 1100, transformOrigin: "50% 100%" });
      gsap.set([".gm-scr-ai", ".gm-scr-tier"], { autoAlpha: 0 });
      gsap.set(".gm-shutterflash", { opacity: 0 });
      gsap.set([".gm-tap-1", ".gm-tap-2"], { autoAlpha: 0, y: 10, xPercent: -100 });

      /* Master scrub → city camera + altitude HUD. */
      const master = ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (self) => {
          orbitBridge.city = self.progress;
          if (altRef.current) {
            const alt = camAltitudeAt(flightU(self.progress));
            altRef.current.textContent =
              alt > 60
                ? `Alt ${Math.round(alt).toLocaleString("en-US")} m`
                : alt > 2.2
                  ? `Alt ${alt.toFixed(0)} m`
                  : "Eye level · 1.7 m";
          }
        },
        onToggle: (self) => {
          setActOn("city", self.isActive);
          /* this section overlaps the orbit act's last 100vh, so the pin is
             the cut point — it happens inside the film's cloud deck. Hide
             the orbit's released stage so its chrome can't ghost through
             this transparent act while it slides out of the flow. (Lives in
             the orbit act — outside this useGSAP scope, so pass elements,
             not a scoped selector string.) */
          gsap.set(document.querySelectorAll(".orb-stage"), { autoAlpha: self.isActive ? 0 : 1 });
        },
      });
      setActOn("city", master.isActive);
      gsap.set(document.querySelectorAll(".orb-stage"), { autoAlpha: master.isActive ? 0 : 1 });

      /* DOM beats on the same scroll axis (slight lag for weight). */
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
        },
      });

      tl
        /* out of the cloud deck — the video carries the reveal */
        .to(".gm-meta", { autoAlpha: 1, x: 0, duration: 0.04 }, 0.045)
        .to(".gm-hud", { autoAlpha: 1, duration: 0.03 }, 0.045)
        /* bird's eye copy */
        .to(".gm-copy-1", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.13)
        .to(".gm-copy-1", { autoAlpha: 0, y: -42, duration: 0.05 }, 0.42)
        /* street arrival: the phone comes out */
        .to(".gm-phone", { yPercent: 0, rotateX: 0, duration: 0.1, ease: "power2.out" }, FLIGHT_END + 0.02)
        .to(".gm-copy-2", { autoAlpha: 1, y: 0, duration: 0.05 }, FLIGHT_END + 0.05)
        .to(".gm-tap-1", { autoAlpha: 1, y: 0, duration: 0.04 }, FLIGHT_END + 0.13)
        /* shutter: press, flash, and the AI layer is there when it clears */
        .to(".gm-scr-aim .cam-shutter", { scale: 0.84, duration: 0.012, ease: "power1.in" }, 0.8)
        .to(".gm-scr-aim .cam-shutter", { scale: 1, duration: 0.016, ease: "power1.out" }, 0.812)
        .to(".gm-shutterflash", { opacity: 1, duration: 0.015, ease: "power1.in" }, 0.812)
        .to(".gm-scr-ai", { autoAlpha: 1, duration: 0.001 }, 0.825)
        .to(".gm-shutterflash", { opacity: 0, duration: 0.035, ease: "power2.out" }, 0.83)
        /* the verdict chip pops on its own beat */
        .fromTo(
          ".gm-scr-ai .cam-ai-chip",
          { autoAlpha: 0, y: 26 },
          { autoAlpha: 1, y: 0, duration: 0.04, ease: "power3.out" },
          0.855,
        )
        /* hand over to the real damage-tier screen */
        .to(".gm-scr-tier", { autoAlpha: 1, duration: 0.05 }, 0.92)
        .to(".gm-tap-1", { autoAlpha: 0, y: -10, duration: 0.025 }, 0.92)
        .to(".gm-tap-2", { autoAlpha: 1, y: 0, duration: 0.025 }, 0.945)
        .to(".gm-hud", { autoAlpha: 0, duration: 0.03 }, 0.94)
        .to(".gm-copy-2", { autoAlpha: 0, y: -42, duration: 0.04 }, 0.965)
        /* anchor: scrub maps scroll onto [0,1] exactly */
        .set({}, {}, 1);
    },
    { scope: root },
  );

  return (
    /* -mt-[100vh]: the section overlaps the orbit act's last viewport, so
       its pin starts the moment the orbit sticky releases — without this,
       the boundary spends a full 100vh sliding one white stage out and the
       other in (the "white tunnel"). The stage stays transparent during the
       overlap (veil gate above). */
    <section ref={root} id="act-ground" data-act data-header-theme="light" className="relative z-10 -mt-[100vh]" style={{ height: "360vh" }}>
      {/* the stage is transparent — the film renders behind it */}
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="relative mx-auto h-full max-w-[1400px] px-5 sm:px-10">
          {/* meta strip — same column as the rest of the copy */}
          <div className="gm-meta absolute left-5 top-24 sm:left-10 lg:left-16">
            <div className="inline-flex items-center gap-2.5 rounded-lg border border-line bg-white/92 px-3.5 py-2 font-mono text-[12px] font-semibold tracking-wide text-ink shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-[#D12800]" />
              Selmara · Vetra Province — Sector K4 · 04:17
            </div>
          </div>

          {/* copy beat 1 — bird's eye */}
          <div className="gm-copy-1 invisible absolute left-5 top-[30%] max-w-[520px] rounded-2xl bg-white/74 p-6 opacity-0 shadow-[0_18px_50px_-20px_rgba(20,40,60,0.35)] backdrop-blur-md sm:left-10 lg:left-16">
            <h2 className="text-[clamp(2rem,3.8vw,3.2rem)] font-extrabold leading-[1.07] tracking-[-0.02em] text-ink">
              Someone is already there.
            </h2>
            <p className="mt-4 max-w-[46ch] text-[16.5px] leading-relaxed text-ink2">
              No assessment team, no drone, no clear sky — just a neighbour with a phone,
              standing in front of a building that used to have four floors.
            </p>
          </div>

          {/* copy beat 2 — street level, the capture */}
          <div className="gm-copy-2 invisible absolute left-5 top-[22%] max-w-[460px] rounded-2xl bg-white/74 p-6 opacity-0 shadow-[0_18px_50px_-20px_rgba(20,40,60,0.35)] backdrop-blur-md sm:left-10 lg:left-16">
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

          {/* descent instrument cluster — kilometres became metres */}
          <div className="gm-hud invisible absolute bottom-12 left-5 hidden rounded-xl bg-white/70 px-4 py-3 font-mono text-[12px] uppercase tracking-[0.18em] text-ink2 opacity-0 backdrop-blur-md sm:left-10 sm:block lg:left-16">
            <div className="flex items-center gap-3">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#D12800]" />
              Descending · Selmara Sector K4
            </div>
            <div className="mt-2 text-[20px] font-bold tabular-nums text-ink">
              <span ref={altRef}>Alt 700 m</span>
            </div>
          </div>

          {/* the phone, stage right */}
          <div className="gm-phone absolute bottom-0 right-1/2 translate-x-1/2 lg:bottom-[var(--phone-lift,0px)] lg:right-[8%] lg:translate-x-0">
            {/* pills live inside the scale wrapper so they track the visual
                phone edge on any monitor, not the unscaled layout box */}
            <div className="relative origin-bottom scale-[0.55] sm:scale-75 lg:scale-[var(--phone-scale,1)]">
              <PhoneFrame>
                <div className="gm-scr-aim absolute inset-0 isolate">
                  <CameraScreen phase="aim" />
                </div>
                <div className="gm-scr-ai invisible absolute inset-0 isolate opacity-0">
                  <CameraScreen phase="ai" />
                </div>
                <div className="gm-scr-tier invisible absolute inset-0 isolate opacity-0">
                  <CaptureDamageScreen />
                </div>
                <div className="gm-shutterflash pointer-events-none absolute inset-0 z-30 bg-white opacity-0" />
              </PhoneFrame>
              <div className="gm-tap-1 absolute -left-4 top-[38%] hidden whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink2 shadow-sm lg:block">
                first — the photo
              </div>
              <div className="gm-tap-2 absolute -left-4 top-[38%] hidden whitespace-nowrap rounded-full border border-line bg-white px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink2 shadow-sm lg:block">
                then — confirm the tier
              </div>
            </div>
          </div>
        </div>

        {/* arrival veil — we exit the orbit act's whiteout inside this one */}
      </div>
    </section>
  );
}
