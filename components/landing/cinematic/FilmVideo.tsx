"use client";

/* Fixed full-viewport video behind the scrolling story — replaces the WebGL
   globe + city maquette. One continuous generated shot (orbit → clouds →
   bird's eye → street level, 10 s) scrubbed by scroll: the acts' master
   ScrollTriggers keep writing orbitBridge.progress / .city exactly as they
   did for the 3D stages, and this component maps them onto video time.

   Scrubbing technique: never write currentTime from scroll events — a rAF
   loop eases a rendered time toward the scroll-derived target (hides seek
   granularity and coalesces bursts). The file is encoded with a 12-frame
   GOP specifically so backward seeks stay cheap.

   The DOM beats (copy cards, HUD, phone) stay in the acts, untouched. */

import { useEffect, useRef, useState } from "react";
import { orbitBridge, canvasVisible, onBridgeChange, setFilmReady } from "./bridge";

/* Video timeline anchors (seconds). The act boundary hides inside the cloud
   deck; the flight sails all the way to the film's final frame and FREEZES
   there for the whole capture sequence — a slow residual push-in read as
   stutter (frames flipping once per ~25vh of scroll), and a frozen frame
   also can't drift when the reader nudges the wheel mid-beat. */
const T_CLOUDS = 4.2; /* orbit act end / ground act start — inside the deck */
const T_END = 9.96; /* the last full frame — a hair under duration: seeking
                       to the exact end fires `ended` and can snap to 0 */
const FLIGHT_END = 0.375; /* must match cityLayout's FLIGHT_END */

function targetTime() {
  if (orbitBridge.cityOn || orbitBridge.city > 0) {
    const p = Math.min(orbitBridge.city / FLIGHT_END, 1);
    return T_CLOUDS + p * (T_END - T_CLOUDS);
  }
  return orbitBridge.progress * T_CLOUDS;
}

export function FilmVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shown, setShown] = useState(() => canvasVisible());

  useEffect(() => {
    const apply = () => setShown(canvasVisible());
    const off = onBridgeChange(apply);
    /* acts flip the bridge from layout effects before this passive effect
       subscribes — re-read once or a mid-page reload keeps a stale state */
    apply();
    return off;
  }, []);

  /* Buffer telemetry for the scroll gate: the page holds scrolling until
     enough of the film is buffered to scrub through the whole descent
     (orbit + flight ≈ the first 7 s). Reported through the bridge — the
     landing shell re-reads it after subscribing, immune to mount order. */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const READY_AT = 7;
    let iv = 0;
    const check = () => {
      const end = video.buffered.length ? video.buffered.end(video.buffered.length - 1) : 0;
      const dur = video.duration || 10;
      /* trust only real buffered seconds — Chrome reports readyState 4
         optimistically long before a seek into the tail would survive */
      if (end >= Math.min(READY_AT, dur - 0.2)) {
        setFilmReady();
        window.clearInterval(iv);
      }
    };
    const evs = ["progress", "loadedmetadata", "canplay", "canplaythrough"] as const;
    evs.forEach((t) => video.addEventListener(t, check));
    /* Safari under-fires `progress` on fast links — poll as a backstop */
    iv = window.setInterval(check, 350);
    check();
    return () => {
      evs.forEach((t) => video.removeEventListener(t, check));
      window.clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let rendered = -1;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (video.readyState < 1) return; /* metadata not in yet */
      const target = Math.min(targetTime(), (video.duration || T_END + 0.08) - 0.04);
      if (rendered < 0) rendered = target;
      /* ease toward the scroll target; snap when close so the frame settles */
      const d = target - rendered;
      rendered = Math.abs(d) < 0.012 ? target : rendered + d * 0.22;
      if (Math.abs(video.currentTime - rendered) > 0.016 && !video.seeking) {
        video.currentTime = rendered;
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 bg-[#03080E] transition-opacity duration-500"
      style={{ opacity: shown ? 1 : 0 }}
    >
      <video
        ref={videoRef}
        className="h-full w-full object-cover"
        /* TESTING the "yafw balanced" master — revert to descent.mp4?v=2 +
           descent-poster.jpg if the original grade wins */
        src="/landing/descent-b.mp4?v=3"
        poster="/landing/descent-b-poster.jpg"
        preload="auto"
        muted
        playsInline
        disablePictureInPicture
        controls={false}
        tabIndex={-1}
      />
    </div>
  );
}
