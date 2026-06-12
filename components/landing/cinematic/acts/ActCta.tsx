"use client";

/* ACT VI — CTA + footer. Normal document flow again: get the app, open the
   console, the measured-not-promised numbers, credits. Entrance-triggered
   counters (not scrubbed — counting reads better as an event). */

import { useRef } from "react";
import Link from "next/link";
import { Globe, MonitorCheck, Radar, Smartphone } from "lucide-react";
import { gsap, useGSAP } from "../gsap";

const SCALE_STATS: [string, number, string, string][] = [
  ["reports in the live benchmark", 502064, "", "full pipeline measured at half a million synthetic reports in the production schema"],
  ["sustained submissions / s", 198, "", "p50 148 ms · p95 215 ms on a single instance"],
  ["MB peak server memory", 35, "", "all five export formats streamed back-to-back, from a cursor"],
  ["UN languages, incl. RTL", 6, "", "English, French, Spanish, Russian, Arabic, Chinese"],
];

export function ActCta() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      gsap.utils.toArray<HTMLElement>(".cta-stat").forEach((el) => {
        const target = Number(el.dataset.target ?? 0);
        const state = { v: 0 };
        gsap.to(state, {
          v: target,
          duration: 1.8,
          ease: "power1.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(state.v).toLocaleString("en-US");
          },
        });
      });
      gsap.utils.toArray<HTMLElement>(".cta-reveal").forEach((el, i) => {
        gsap.from(el, {
          y: 36,
          autoAlpha: 0,
          duration: 0.9,
          ease: "power3.out",
          delay: (i % 3) * 0.08,
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="act-cta" data-act data-header-theme="dark" className="relative z-10 bg-ink text-white">
      <div className="mx-auto max-w-[1400px] px-5 pb-12 pt-24 sm:px-10">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div className="cta-reveal">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-white/50">
              Install it before the ground shakes
            </div>
            <h2 className="mt-4 max-w-[20ch] text-[clamp(2.2rem,4.4vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
              Put a damage sensor in every pocket.
            </h2>
            <p className="mt-5 max-w-[56ch] text-[16.5px] leading-relaxed text-white/70">
              One Kotlin Multiplatform codebase, Android and iOS. The offline map pack and
              the on-disk outbox are exactly why it belongs on the phone <em className="not-italic font-semibold text-white">before</em> the
              crisis, not after.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="/downloads/beacon-android.apk"
                className="inline-flex items-center gap-2.5 rounded-lg bg-white px-5 py-3 text-[15px] font-bold text-ink transition-transform active:translate-y-px"
              >
                <Smartphone size={17} /> Android — direct APK
              </a>
              <a
                href="mailto:ivan.stepanok@raccoongang.com?subject=Beacon%20TestFlight%20invite"
                className="inline-flex items-center gap-2.5 rounded-lg border border-white/25 px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-white/10"
              >
                <Smartphone size={17} /> iOS — TestFlight invite
              </a>
            </div>
            <p className="mt-3 text-[12px] text-white/45">
              Sideload-ready APK, no store account needed — store listings follow the pilot.
            </p>
          </div>

          <div className="cta-reveal rounded-2xl border border-white/15 bg-white/5 p-7">
            <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">For UNDP teams</div>
            <h3 className="mt-2 text-[20px] font-bold">The other half is the console</h3>
            <p className="mt-2 text-[14px] leading-relaxed text-white/70">
              The situation room behind this film is real and running: clustered vector
              tiles, verification and triage, five analyst roles, a one-click situation
              brief, and exports for the GIS tools already in the building — GeoJSON,
              HXL CSV, KML, GeoPackage, Shapefile.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-primary-ink"
              >
                <MonitorCheck size={15} /> Open the analyst console
              </Link>
              <Link
                href="/public"
                className="inline-flex items-center gap-2 rounded-lg border border-white/25 px-4 py-2.5 text-[14px] font-semibold text-white hover:bg-white/10"
              >
                <Globe size={15} /> Public map — no sign-in
              </Link>
            </div>
            <p className="mt-4 text-[12px] text-white/45">Demo accounts are listed on the sign-in page.</p>
          </div>
        </div>

        {/* measured, not promised */}
        <div className="mt-20 border-t border-white/10 pt-10">
          <div className="cta-reveal font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
            Measured, not promised — reproducible from the repository
          </div>
          <div className="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
            {SCALE_STATS.map(([label, target, , detail]) => (
              <div key={label} className="cta-reveal border-l border-white/15 pl-5">
                <div className="font-mono text-[clamp(1.8rem,2.8vw,2.4rem)] font-bold tabular-nums text-white">
                  <span className="cta-stat" data-target={target}>0</span>
                </div>
                <div className="mt-1 text-[13.5px] font-bold text-white/90">{label}</div>
                <div className="mt-1.5 text-[12.5px] leading-relaxed text-white/55">{detail}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* footer */}
      <footer className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 py-10 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                <Radar size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[15px] font-extrabold tracking-tight">Beacon</span>
            </div>
            <p className="mt-3 max-w-[56ch] text-[13px] leading-relaxed text-white/55">
              Community-driven crisis damage mapping. Built for the UNDP
              “Build the Future of Crisis Mapping” challenge, 2026.
              {" "}
              <Link href="/classic" className="underline decoration-white/30 underline-offset-2 hover:text-white">
                Prefer the quiet version?
              </Link>
            </p>
          </div>
          <div className="max-w-[60ch] text-[11px] leading-relaxed text-white/40">
            Photography: Chandler Cruttenden (Unsplash) · Serkan Gönültaş, Doruk Aksel Anıl,
            Mohammed Amine Jaddari (Pexels) — free licenses, with thanks.
            The redaction scenes use staged imagery; the face pixelation is the app&apos;s real
            on-device output, the plate blur is re-staged in the page. Phone and console
            scenes are HTML recreations of the shipping apps — the film&apos;s dashboard numbers
            come from the 500k load-test scenario, not live data. The Antakya M 6.4
            timeline is a training scenario.
          </div>
        </div>
      </footer>
    </section>
  );
}
