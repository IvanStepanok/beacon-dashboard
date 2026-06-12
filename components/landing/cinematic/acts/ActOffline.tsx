"use client";

/* ACT III — BLACKOUT. 340vh. The network dies and nothing about the app
   breaks: the map pack was cached weeks ago, reports queue on disk. The
   band goes near-black; the phone is the only light on stage. */

import { useRef } from "react";
import { gsap, useGSAP } from "../gsap";
import { PhoneFrame } from "../../PhoneFrame";
import { MapOfflineScreen, SyncStatusScreen } from "../screens-extra";

export function ActOffline() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set([".of-copy-1", ".of-copy-2", ".of-copy-3"], { autoAlpha: 0, y: 42 });
      gsap.set(".of-scr-queue", { autoAlpha: 0 });
      gsap.set(".of-pill", { autoAlpha: 0, x: 16 });
      gsap.set(".of-phone", { autoAlpha: 0, y: 60 });

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
        /* power flicker as the act opens */
        .fromTo(
          ".of-flicker",
          { opacity: 0 },
          { opacity: 0.85, duration: 0.012, ease: "none" },
          0.02,
        )
        .to(".of-flicker", { opacity: 0.1, duration: 0.01 }, 0.034)
        .to(".of-flicker", { opacity: 0.6, duration: 0.01 }, 0.046)
        .to(".of-flicker", { opacity: 0, duration: 0.02 }, 0.058)
        .to(".of-copy-1", { autoAlpha: 1, y: 0, duration: 0.05, ease: "power3.out" }, 0.06)
        .to(".of-phone", { autoAlpha: 1, y: 0, duration: 0.08, ease: "power2.out" }, 0.1)
        .to(".of-copy-1", { autoAlpha: 0, y: -42, duration: 0.05 }, 0.3)
        /* the map was already here */
        .to(".of-copy-2", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.36)
        .to(".of-pill", { autoAlpha: 1, x: 0, duration: 0.04, ease: "power2.out" }, 0.4)
        .to(".of-copy-2", { autoAlpha: 0, y: -42, duration: 0.05 }, 0.56)
        /* reports queue on disk */
        .to(".of-pill", { autoAlpha: 0, duration: 0.03 }, 0.58)
        .to(".of-scr-queue", { autoAlpha: 1, duration: 0.06 }, 0.6)
        .to(".of-copy-3", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.64)
        .to(".of-copy-3", { autoAlpha: 0, y: -42, duration: 0.05 }, 0.93)
        /* anchor: scrub maps scroll onto [0,1] exactly */
        .set({}, {}, 1);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-offline" data-act data-header-theme="dark" className="relative z-10" style={{ height: "340vh", background: "#0E1722" }}>
      <div className="sticky top-0 h-dvh overflow-hidden">
        <div className="relative mx-auto h-full max-w-[1400px] px-5 sm:px-10">
          {/* copy 1 — the blackout */}
          <div className="of-copy-1 absolute left-5 top-[18%] max-w-[560px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70">
              04:31 · cell service unavailable
            </div>
            <h2 className="mt-4 font-mono text-[clamp(3rem,7vw,5.8rem)] font-bold leading-none tracking-[-0.03em] text-white">
              0 bars.
            </h2>
            <p className="mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/65">
              Cell towers fall with the buildings. For most crisis apps this is the edge
              case. For Beacon it is the <span className="font-semibold text-white">normal case</span> —
              the whole pipeline assumes silence.
            </p>
          </div>

          {/* copy 2 — offline map */}
          <div className="of-copy-2 absolute left-5 top-[18%] max-w-[560px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-soft">
              Offline by design
            </div>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white">
              The map was already here.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[16.5px] leading-relaxed text-white/65">
              An 18 MB map pack of your district, downloaded weeks before the ground moved.
              Offline Plus Codes give every report a shareable address when the street
              signs are gone.
            </p>
          </div>

          {/* copy 3 — outbox on disk */}
          <div className="of-copy-3 absolute left-5 top-[18%] max-w-[560px] sm:left-10 lg:left-16 lg:top-1/2 lg:-translate-y-1/2">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary-soft">
              The outbox
            </div>
            <h2 className="mt-4 text-[clamp(2rem,4vw,3.4rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-white">
              Written to disk, not to hope.
            </h2>
            <p className="mt-5 max-w-[48ch] text-[16.5px] leading-relaxed text-white/65">
              Every report lands in a durable on-disk queue that survives app restarts and
              dead batteries. Three reports tonight. They will wait as long as they have to.
            </p>
          </div>

          {/* the phone — the only light on stage */}
          <div className="of-phone absolute bottom-0 right-1/2 translate-x-1/2 lg:right-[8%] lg:translate-x-0">
            <div className="origin-bottom scale-[0.55] sm:scale-75 lg:scale-100">
              <div style={{ filter: "drop-shadow(0 0 90px rgba(120,170,220,0.18))" }}>
                <PhoneFrame>
                  <div className="absolute inset-0">
                    <MapOfflineScreen />
                  </div>
                  <div className="of-scr-queue invisible absolute inset-0 opacity-0">
                    <SyncStatusScreen stage={0} />
                  </div>
                </PhoneFrame>
              </div>
            </div>
            <div className="of-pill absolute -left-2 top-[30%] hidden -translate-x-full whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-white/70 backdrop-blur lg:block">
              map pack · 18 MB · cached 3 weeks ago
            </div>
          </div>
        </div>

        {/* quiet ledger line — pays off when the outbox drains in act V */}
        <div className="absolute bottom-12 left-5 hidden font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45 sm:left-10 lg:left-16 lg:block">
          Outbox · 3 queued · 0 lost
        </div>

        {/* power flicker overlay */}
        <div className="of-flicker pointer-events-none absolute inset-0 z-20 bg-black opacity-0" />
      </div>
    </section>
  );
}
