"use client";

/* ACT IV — PRIVACY. 360vh. The redaction pipeline, shown with the app's real
   on-device output: the detector box finds the face, the pixelated frame
   (actual pipeline output, not a mockup) crossfades in, EXIF lines strike
   through, then the licence plate gets the same treatment. */

import { useRef } from "react";
import { gsap, useGSAP } from "../gsap";

const EXIF_ROWS = [
  ["EXIF GPS 36.2012, 36.1613", "stripped"],
  ["Device make · serial", "stripped"],
  ["Capture timestamp", "stripped"],
  ["Face — 1 found", "pixelated"],
] as const;

export function ActPrivacy() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.set(".pv-scan", { autoAlpha: 0 });
      gsap.set(".pv-after", { autoAlpha: 0 });
      gsap.set(".pv-exif-row", { autoAlpha: 0, x: -12 });
      gsap.set(".pv-cardB", { autoAlpha: 0, y: 60, rotate: -3 });
      gsap.set(".pv-blurB", { autoAlpha: 0 });
      gsap.set(".pv-scanB", { autoAlpha: 0 });
      gsap.set(".pv-copy-rest", { autoAlpha: 0, y: 24 });

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
        /* card A: detector box closes in on the face */
        .fromTo(".pv-cardA", { y: 80, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.08, ease: "power2.out" }, 0.02)
        .to(".pv-scan", { autoAlpha: 1, duration: 0.02 }, 0.1)
        .fromTo(
          ".pv-scan",
          { left: "4%", top: "4%", width: "92%", height: "92%" },
          { left: "16%", top: "22%", width: "48%", height: "56%", duration: 0.08, ease: "power2.inOut" },
          0.1,
        )
        /* the real redacted frame lands */
        .to(".pv-after", { autoAlpha: 1, duration: 0.05 }, 0.21)
        .to(".pv-scan", { autoAlpha: 0, duration: 0.03 }, 0.24)
        .to(".pv-copy-rest", { autoAlpha: 1, y: 0, duration: 0.05 }, 0.22)
        /* EXIF ledger strikes through, row by row */
        .to(".pv-exif-row", { autoAlpha: 1, x: 0, duration: 0.04, stagger: 0.035 }, 0.28)
        /* card B: the plate */
        .to(".pv-cardB", { autoAlpha: 1, y: 0, rotate: -3, duration: 0.07, ease: "power2.out" }, 0.48)
        .to(".pv-scanB", { autoAlpha: 1, duration: 0.02 }, 0.56)
        .fromTo(
          ".pv-scanB",
          { left: "6%", top: "6%", width: "88%", height: "88%" },
          { left: "27%", top: "63%", width: "24%", height: "12%", duration: 0.07, ease: "power2.inOut" },
          0.56,
        )
        .to(".pv-blurB", { autoAlpha: 1, duration: 0.04 }, 0.65)
        .to(".pv-scanB", { autoAlpha: 0, duration: 0.03 }, 0.68)
        /* anchor: scrub maps scroll onto [0,1] exactly */
        .set({}, {}, 1);
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-privacy" data-act data-header-theme="light" className="relative z-10 h-auto bg-white lg:h-[360vh]">
      <div className="py-20 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:items-center lg:overflow-hidden lg:py-0">
        <div className="mx-auto grid w-full max-w-[1400px] items-center gap-x-16 gap-y-10 px-5 sm:px-10 lg:grid-cols-[minmax(0,46fr)_minmax(0,54fr)]">
          {/* left: the privacy contract */}
          <div>
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Before anything leaves the phone
            </div>
            <h2 className="mt-4 max-w-[18ch] text-[clamp(2rem,4vw,3.2rem)] font-extrabold leading-[1.07] tracking-[-0.02em] text-ink">
              Privacy is the pipeline, not a promise.
            </h2>
            <div className="pv-copy-rest">
              <p className="mt-5 max-w-[50ch] text-[16.5px] leading-relaxed text-ink2">
                A crisis photo is full of people who never consented to being data. So the
                redaction runs <span className="font-semibold text-ink">on the device, while still offline</span> —
                the pixelated face below is the pipeline&apos;s real output, not an artist&apos;s
                impression; the plate scene re-stages the same rule.
              </p>
              <div className="mt-7 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-ink3">
                Photo-file metadata, removed on device
              </div>
              <div className="mt-2 max-w-[420px] overflow-hidden rounded-xl border border-line">
                {EXIF_ROWS.map(([k, v]) => (
                  <div key={k} className="pv-exif-row flex items-center justify-between gap-4 border-b border-line bg-surface2/60 px-4 py-2.5 font-mono text-[12.5px] last:border-b-0">
                    <span className="text-ink2 line-through decoration-[#D12800]/60">{k}</span>
                    <span className="font-semibold text-primary-ink">→ {v}</span>
                  </div>
                ))}
              </div>
              <p className="mt-5 max-w-[50ch] text-[14px] leading-relaxed text-ink2">
                No name, no number, no account. An opaque device ID is the only identity —
                and withdrawing a report erases it from the server.
              </p>
            </div>
          </div>

          {/* right: the evidence */}
          <div className="relative h-[120vw] sm:h-[90vw] lg:h-[min(76vh,920px)]" aria-hidden>
            {/* card A — face */}
            <div className="pv-cardA absolute right-0 top-0 w-[min(78%,580px)] overflow-hidden rounded-2xl shadow-[0_40px_90px_-30px_rgba(0,40,80,0.45)]">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/privacy-before.jpg" alt="A resident photographing earthquake damage" className="block w-full" />
                {/* real on-device output crossfades over the original */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/privacy-after.jpg" alt="" aria-hidden className="pv-after absolute inset-0 block w-full" />
                <div className="pv-scan absolute rounded-lg border-2 border-primary shadow-[0_0_0_2000px_rgba(0,30,60,0.12)]">
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-primary px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
                    face · on-device detector
                  </span>
                </div>
                <span className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 font-mono text-[10.5px] font-medium text-white">
                  REDACTED ON DEVICE · 04:32
                </span>
              </div>
            </div>

            {/* card B — plate */}
            <div className="pv-cardB absolute bottom-0 left-0 w-[min(62%,460px)] overflow-hidden rounded-2xl shadow-[0_40px_90px_-30px_rgba(0,40,80,0.45)]">
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/landing/privacy-plate.jpg" alt="A car with a readable licence plate in front of damaged buildings" className="block w-full" />
                {/* blur patch: a clipped, blurred copy of the same photo —
                    backdrop-filter is unreliable inside transformed cards */}
                <div className="pv-blurB absolute left-[27%] top-[63%] h-[12%] w-[24%] overflow-hidden rounded-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/landing/privacy-plate.jpg"
                    alt=""
                    aria-hidden
                    className="absolute max-w-none"
                    style={{
                      width: `${(100 / 24) * 100}%`,
                      height: `${(100 / 12) * 100}%`,
                      left: `${(-27 / 24) * 100}%`,
                      top: `${(-63 / 12) * 100}%`,
                      filter: "blur(9px)",
                    }}
                  />
                </div>
                <div className="pv-scanB absolute rounded-lg border-2 border-primary">
                  <span className="absolute -top-7 left-0 whitespace-nowrap rounded bg-primary px-2 py-0.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-white">
                    plate
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
