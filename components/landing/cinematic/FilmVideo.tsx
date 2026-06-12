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
import { orbitBridge, canvasVisible, onBridgeChange } from "./bridge";

/* Video timeline anchors (seconds). The act boundary hides inside the cloud
   deck; the street arrives with the flight's end so the capture beats play
   against an almost-still final push-in. */
const T_CLOUDS = 4.2; /* orbit act end / ground act start — inside the deck */
const T_STREET = 9.6; /* ground FLIGHT_END — eye level at the building */
const T_LAST = 10.0; /* keep a hair under duration: seeking to the exact
                        end fires `ended` and some browsers snap to 0 */
const FLIGHT_END = 0.62; /* must match cityLayout's FLIGHT_END */

function targetTime() {
  if (orbitBridge.cityOn || orbitBridge.city > 0) {
    const p = orbitBridge.city;
    if (p >= FLIGHT_END) {
      /* street: a barely-perceptible dolly while the phone beats play */
      return T_STREET + ((p - FLIGHT_END) / (1 - FLIGHT_END)) * (T_LAST - T_STREET);
    }
    return T_CLOUDS + (p / FLIGHT_END) * (T_STREET - T_CLOUDS);
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

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let raf = 0;
    let rendered = -1;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (video.readyState < 1) return; /* metadata not in yet */
      const target = Math.min(targetTime(), (video.duration || T_LAST) - 0.04);
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
        src="/landing/descent.mp4"
        poster="/landing/descent-poster.jpg"
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
