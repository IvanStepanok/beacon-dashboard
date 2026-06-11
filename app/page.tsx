"use client";

import Link from "next/link";
import { Radar, Globe, MonitorCheck, ArrowRight, Smartphone } from "lucide-react";
import { PhoneFrame } from "@/components/landing/PhoneFrame";
import { StoryScroll, Reveal, type StoryBeat } from "@/components/landing/StoryScroll";
import { MapScreen, CaptureScreen, OfflineScreen, SyncScreen, VerifyScreen } from "@/components/landing/screens";

/* Inline image punctuation for the hero headline — type-height, rounded. */
function InlineImg({ src, alt }: { src: string; alt: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="mx-1 inline-block h-[0.82em] w-[1.7em] -translate-y-[0.06em] rounded-lg object-cover align-baseline"
    />
  );
}

const BEATS: StoryBeat[] = [
  {
    kicker: "Report",
    title: "Three taps from rubble to record",
    body: "Photo, damage tier, send. An on-device neural network reads the photo and suggests the tier before the reporter has to think about taxonomy — it runs locally, so it works in a blackout.",
    facts: [
      "On-device AI damage classification — no network required",
      "Photos are EXIF-stripped and faces blurred before anything leaves the phone",
      "Reports snap to the actual building footprint, not a fuzzy street point",
    ],
    screen: <CaptureScreen />,
  },
  {
    kicker: "Offline",
    title: "Zero bars is the normal case, not the edge case",
    body: "Cell towers fall with the buildings. Beacon pre-downloads the map of your area (18 MB), locates you with offline Plus Codes, and writes every report to a durable on-disk outbox that survives app restarts and dead batteries.",
    facts: [
      "Offline map pack follows your location — downloaded before or during the crisis",
      "Reports queue on disk, not in memory — restart-proof",
      "Plus Codes give a shareable address when street signs are gone",
    ],
    screen: <OfflineScreen />,
  },
  {
    kicker: "Sync",
    title: "When one bar returns, the record catches up",
    body: "The outbox flushes automatically on reconnect. Submits are idempotent, so retries can never double-count a building — and if two neighbours report the same damage, the server merges them into one versioned record instead of inflating the count.",
    facts: [
      "Automatic background sync on reconnect",
      "Server-side spatial dedup — agreement raises confidence, not the count",
      "198 submissions/s sustained on a single small instance (p95 215 ms)",
    ],
    screen: <SyncScreen />,
  },
  {
    kicker: "Verify",
    title: "Crowdsourced does not mean unverified",
    body: "Nearby reports of the same building corroborate each other; field validators and UNDP analysts confirm the rest from the console. Reporters stay anonymous — a device ID, no account — yet build a trust record that ranks their future reports.",
    facts: [
      "Three-state pipeline: pending, verified, flagged — auditable end to end",
      "Anonymous by design: no name, phone number or account",
      "Public map shows verified data only; analysts see everything",
    ],
    screen: <VerifyScreen />,
  },
];

const SCALE_STATS: [string, string, string][] = [
  ["502,064", "reports in the live benchmark", "full pipeline — submit, map, verify, export — measured at half a million reports, not a demo dataset"],
  ["139–911 B", "per map tile at z8–z12", "server-side clustered vector tiles keep the map fluid at any density"],
  ["35 MB", "peak server memory, all 5 exports", "GeoJSON, CSV (HXL), KML, GeoPackage and Shapefile stream from a cursor"],
  ["198/s", "sustained submissions", "p50 148 ms, p95 215 ms on one small instance"],
];

export default function LandingPage() {
  return (
    <div className="bg-white">
      {/* ───────────────── header ───────────────── */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-6 px-5 py-3 sm:px-10">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white">
              <Radar size={19} strokeWidth={2.2} />
            </span>
            <span className="text-[17px] font-extrabold tracking-tight text-ink">Beacon</span>
          </Link>
          <nav className="ml-4 hidden items-center gap-5 text-[13.5px] font-medium text-ink2 md:flex">
            <a href="#story" className="hover:text-ink">How it works</a>
            <a href="#scale" className="hover:text-ink">Proven scale</a>
            <a href="#field" className="hover:text-ink">Built for the field</a>
            <a href="#get" className="hover:text-ink">Get the app</a>
          </nav>
          <div className="ml-auto flex items-center gap-2.5">
            <Link
              href="/public"
              className="hidden items-center gap-1.5 rounded-lg border border-line px-3.5 py-2 text-[13px] font-semibold text-ink transition-colors hover:bg-surface2 sm:inline-flex"
            >
              <Globe size={14} /> Public map
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-primary-ink"
            >
              <MonitorCheck size={14} /> Analyst console
            </Link>
          </div>
        </div>
      </header>

      {/* ───────────────── hero ───────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute -right-40 top-10 -z-10 h-[480px] w-[480px] rounded-full bg-primary-soft/50 blur-3xl" />
        <div className="mx-auto grid max-w-[1400px] items-center gap-x-12 gap-y-14 px-5 pb-20 pt-14 sm:px-10 lg:grid-cols-[minmax(0,56fr)_minmax(0,44fr)] lg:pt-20">
          <div>
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full border border-line bg-surface2/60 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-ink2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                UNDP · Build the Future of Crisis Mapping
              </div>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 max-w-[16ch] text-[clamp(2.4rem,5vw,4rem)] font-extrabold leading-[1.06] tracking-[-0.02em] text-ink">
                The first map of a disaster
                <InlineImg src="/landing/street-antakya.jpg" alt="A street in Antakya after the earthquake" />
                comes from the people
                <InlineImg src="/landing/responders.jpg" alt="Search-and-rescue workers in red helmets" />
                standing in it
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-[58ch] text-[17px] leading-relaxed text-ink2">
                Beacon turns anyone with a phone into a damage sensor — three taps to report a building,
                working with zero connectivity — and turns those reports into verified, exportable
                situation data UNDP teams can act on within the first hours, not weeks.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="#story"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-[15px] font-bold text-white transition-all hover:bg-primary-ink active:translate-y-px"
                >
                  See how it works <ArrowRight size={16} />
                </a>
                <Link
                  href="/public"
                  className="inline-flex items-center gap-2 rounded-lg border border-line px-5 py-3 text-[15px] font-semibold text-ink transition-colors hover:bg-surface2"
                >
                  Open the live public map
                </Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <dl className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-line pt-5">
                {(
                  [
                    ["3 taps", "per report"],
                    ["0 bars", "needed in the field"],
                    ["6", "UN languages, incl. RTL"],
                    ["502,064", "reports benchmarked"],
                  ] as const
                ).map(([v, l]) => (
                  <div key={l}>
                    <dt className="sr-only">{l}</dt>
                    <dd className="font-mono text-[20px] font-bold tabular-nums text-ink">{v}</dd>
                    <dd className="text-[12px] text-ink3">{l}</dd>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>
          <Reveal delay={200} className="justify-self-center lg:justify-self-end">
            <PhoneFrame>
              <div className="lp-screen lp-active">
                <MapScreen />
              </div>
            </PhoneFrame>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── why band ───────────────── */}
      <section className="border-y border-line bg-surface2/60">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 py-16 sm:px-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <Reveal>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/damage-street.jpg"
              alt="Collapsed houses along a damaged street after an earthquake"
              className="aspect-[4/3] w-full rounded-2xl object-cover"
            />
          </Reveal>
          <Reveal delay={100}>
            <h2 className="max-w-[24ch] text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-tight tracking-tight text-ink">
              Satellites need days and clear skies. Assessment teams need roads.
            </h2>
            <p className="mt-5 max-w-[60ch] text-[16px] leading-relaxed text-ink2">
              The people who know which buildings fell are already there — they live in them.
              In the 2023 Türkiye–Syria earthquake, the difference between a building marked
              and a building missed was measured in lives. Beacon closes that gap with the
              one sensor network that is always pre-deployed: the affected community itself.
            </p>
            <p className="mt-4 max-w-[60ch] text-[16px] leading-relaxed text-ink2">
              Every report lands as structured, geolocated, three-tier damage data — ready for
              UNDP GeoHub layers, RAPIDA workflows and OCHA HXL pipelines, not a pile of
              unstructured social-media posts someone has to triage by hand.
            </p>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── scroll story ───────────────── */}
      <section id="story" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
          <Reveal>
            <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">From street to situation room</div>
            <h2 className="mt-3 max-w-[26ch] text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-tight tracking-tight text-ink">
              One report&apos;s journey, end to end
            </h2>
          </Reveal>
        </div>
        <StoryScroll beats={BEATS} />
      </section>

      {/* ───────────────── scale band ───────────────── */}
      <section id="scale" className="scroll-mt-20 border-y border-line bg-surface2/60 py-20">
        <div className="mx-auto max-w-[1400px] px-5 sm:px-10">
          <Reveal>
            <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">Measured, not promised</div>
            <h2 className="mt-3 max-w-[28ch] text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-tight tracking-tight text-ink">
              Already benchmarked at half a million reports
            </h2>
            <p className="mt-4 max-w-[62ch] text-[16px] leading-relaxed text-ink2">
              A crisis-mapping tool that collapses under crisis-scale load is a liability.
              We seeded 500,000 synthetic reports and measured the whole stack — the numbers
              below are reproducible from the repository, methodology included.
            </p>
          </Reveal>
          <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1.3fr]">
            {SCALE_STATS.map(([value, label, detail], i) => (
              <Reveal key={label} delay={i * 80} className="h-full">
                <div className="flex h-full flex-col bg-white p-6">
                  <div className="font-mono text-[clamp(1.6rem,2.6vw,2.2rem)] font-bold tabular-nums text-primary">{value}</div>
                  <div className="mt-1 text-[14px] font-bold text-ink">{label}</div>
                  <div className="mt-2 text-[13px] leading-relaxed text-ink2">{detail}</div>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={200}>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink2">
              <span className="font-semibold text-ink">Analyst exports:</span>
              {["GeoJSON", "CSV · HXL", "KML", "GeoPackage", "Shapefile"].map((f) => (
                <span key={f} className="font-mono">{f}</span>
              ))}
              <span>— all five stream at 500k without breaking a sweat, ready for QGIS, ArcGIS and GeoHub.</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── field band ───────────────── */}
      <section id="field" className="scroll-mt-20 py-20">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <Reveal className="order-2 lg:order-1">
            <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">Built for the field</div>
            <h2 className="mt-3 max-w-[24ch] text-[clamp(1.7rem,3vw,2.4rem)] font-extrabold leading-tight tracking-tight text-ink">
              Trust is a design requirement, not a feature
            </h2>
            <ul className="mt-6 space-y-4">
              {(
                [
                  ["Anonymous by default", "No account, no phone number — an opaque device ID is the only identity. Withdrawing your own report erases it."],
                  ["Privacy before upload", "EXIF metadata stripped and faces blurred on the device, before a photo ever reaches the network."],
                  ["Six UN languages", "English, French, Spanish, Russian, Arabic and Chinese — with full right-to-left layout, because a crisis tool nobody can read helps nobody."],
                  ["Honest uncertainty", "Reports carry GPS accuracy, AI confidence and verification state — analysts always see how solid each data point is."],
                ] as const
              ).map(([t, d], i) => (
                <li key={t} className="flex gap-3.5">
                  <span className="mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft font-mono text-[11px] font-bold text-primary-ink">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-[15px] font-bold text-ink">{t}</div>
                    <div className="mt-0.5 max-w-[58ch] text-[14px] leading-relaxed text-ink2">{d}</div>
                  </div>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/volunteer-phone.jpg"
              alt="A volunteer in the field entering data on a phone"
              className="aspect-[4/5] w-full rounded-2xl object-cover lg:aspect-[3/4]"
            />
          </Reveal>
        </div>
      </section>

      {/* ───────────────── get the app / CTA ───────────────── */}
      <section id="get" className="scroll-mt-20 bg-ink py-20 text-white">
        <div className="mx-auto grid max-w-[1400px] items-center gap-12 px-5 sm:px-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          <div>
            <Reveal>
              <h2 className="max-w-[22ch] text-[clamp(1.9rem,3.4vw,2.7rem)] font-extrabold leading-tight tracking-tight">
                Put a damage sensor in every pocket
              </h2>
              <p className="mt-4 max-w-[58ch] text-[16px] leading-relaxed text-white/70">
                One Kotlin Multiplatform codebase, Android and iOS. Install it before the
                ground shakes — the offline map pack and the report queue are exactly why.
              </p>
            </Reveal>
            <Reveal delay={120}>
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
              <p className="mt-3 text-[12px] text-white/50">
                Sideload-ready APK, no store account needed — store listings follow the pilot.
              </p>
            </Reveal>
          </div>
          <Reveal delay={160}>
            <div className="rounded-2xl border border-white/15 bg-white/5 p-7">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">For UNDP teams</div>
              <h3 className="mt-2 text-[20px] font-bold">The other half is the console</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-white/70">
                Live map with clustered vector tiles, verification & triage board,
                role-based access for five analyst roles, one-click situation brief,
                and exports for every GIS tool in the building.
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
              <p className="mt-4 text-[12px] text-white/50">Demo accounts are listed on the sign-in page.</p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── footer ───────────────── */}
      <footer className="border-t border-white/10 bg-ink pb-10 pt-8 text-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-6 px-5 sm:px-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">
                <Radar size={16} strokeWidth={2.2} />
              </span>
              <span className="text-[15px] font-extrabold tracking-tight">Beacon</span>
            </div>
            <p className="mt-3 max-w-[52ch] text-[13px] leading-relaxed text-white/60">
              Community-driven crisis damage mapping. Built for the UNDP
              “Build the Future of Crisis Mapping” challenge, 2026.
            </p>
          </div>
          <div className="text-[11px] leading-relaxed text-white/40">
            Photography: Chandler Cruttenden (Unsplash) · Serkan Gönültaş, Doruk Aksel Anıl,
            <br className="hidden sm:block" />
            Mohammed Amine Jaddari (Pexels) — free licenses, with thanks.
          </div>
        </div>
      </footer>
    </div>
  );
}
