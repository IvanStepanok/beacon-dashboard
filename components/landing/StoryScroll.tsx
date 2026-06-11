"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { PhoneFrame } from "./PhoneFrame";

export interface StoryBeat {
  kicker: string;
  title: string;
  body: string;
  facts: string[];
  screen: ReactNode;
}

/* Generic reveal-on-scroll wrapper (adds .lp-in once visible). */
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && el.classList.add("lp-in")),
      { threshold: 0.15 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`lp-reveal ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

/* The onboarding-style centerpiece: story beats scroll on the left while a
   sticky phone on the right plays the matching app state. Below lg the sticky
   stage hides and each beat carries its own inline phone. */
export function StoryScroll({ beats }: { beats: StoryBeat[] }) {
  const [active, setActive] = useState(0);
  const beatRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // A beat activates when it crosses the vertical center of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const idx = Number((e.target as HTMLElement).dataset.beat);
            setActive(idx);
          }
        });
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
    );
    beatRefs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, [beats.length]);

  return (
    <div className="mx-auto grid max-w-[1400px] gap-x-12 px-5 sm:px-10 lg:grid-cols-[minmax(0,44fr)_minmax(0,56fr)]">
      {/* Left: the narrative rail */}
      <div className="relative">
        {/* progress rail (desktop) */}
        <div aria-hidden className="absolute bottom-0 left-0 top-0 hidden w-px bg-line lg:block" />
        {beats.map((b, i) => (
          <div
            key={i}
            data-beat={i}
            ref={(el) => {
              beatRefs.current[i] = el;
            }}
            className="flex min-h-[72vh] items-center py-16 lg:pl-10"
          >
            <div className="relative w-full">
              {/* rail marker */}
              <span
                aria-hidden
                className={`absolute -left-10 top-1.5 hidden h-3 w-3 -translate-x-1/2 rounded-full border-2 transition-colors duration-300 lg:block ${
                  active === i ? "border-primary bg-primary" : "border-line bg-white"
                }`}
              />
              <Reveal>
                <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.18em] text-primary">
                  {String(i + 1).padStart(2, "0")} · {b.kicker}
                </div>
                <h3 className="mt-3 max-w-[18ch] text-[clamp(1.6rem,2.6vw,2.3rem)] font-extrabold leading-[1.12] tracking-tight text-ink">
                  {b.title}
                </h3>
                <p className="mt-4 max-w-[52ch] text-[16px] leading-relaxed text-ink2">{b.body}</p>
                <ul className="mt-5 space-y-2">
                  {b.facts.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-[14px] text-ink">
                      <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {f}
                    </li>
                  ))}
                </ul>
              </Reveal>
              {/* Inline phone for small screens — same screen, no sticky stage */}
              <div className="mt-10 lg:hidden">
                <PhoneFrame>
                  <div className="lp-screen lp-active">{b.screen}</div>
                </PhoneFrame>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Right: sticky phone stage (desktop) */}
      <div className="hidden lg:block">
        <div className="sticky top-[8vh] flex h-[84vh] items-center justify-center">
          <div className="relative">
            {/* soft sky wash behind the device */}
            <div aria-hidden className="absolute -inset-14 -z-10 rounded-full bg-primary-soft/60 blur-3xl" />
            <PhoneFrame>
              {beats.map((b, i) => (
                <div key={i} className={`lp-screen ${active === i ? "lp-active" : ""}`} aria-hidden={active !== i}>
                  {b.screen}
                </div>
              ))}
            </PhoneFrame>
          </div>
        </div>
      </div>
    </div>
  );
}
