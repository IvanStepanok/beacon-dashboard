"use client";

/* Fixed full-viewport WebGL stage behind the scrolling story. Client wrapper
   with ssr:false — three.js never renders on the server. The wrapper feeds
   pointer parallax into the bridge, cross-fades its backdrop between deep
   space (act I) and the morning paper-sky of the maquette (act II), and
   fades away entirely once both film acts have scrolled past. */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { orbitBridge, canvasVisible, onBridgeChange } from "./bridge";

const OrbitScene = dynamic(() => import("./orbit/OrbitScene"), { ssr: false });

export function OrbitCanvas() {
  /* Initial values from the bridge — a reload mid-page may have already
     scrolled past the film before this component mounts. */
  const [state, setState] = useState(() => ({
    shown: canvasVisible(),
    city: orbitBridge.cityOn,
  }));

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      orbitBridge.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      orbitBridge.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const apply = () => setState({ shown: canvasVisible(), city: orbitBridge.cityOn });
    const off = onBridgeChange(apply);
    /* The acts flip the bridge from layout effects, which run before this
       passive effect subscribes — re-read once or a mid-page reload keeps
       the wrong backdrop. */
    apply();
    return () => {
      window.removeEventListener("pointermove", onMove);
      off();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 transition-opacity duration-500"
      style={{ opacity: state.shown ? 1 : 0 }}
    >
      {/* deep space (act I) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: state.city ? 0 : 1,
          background:
            "radial-gradient(ellipse 90% 70% at 64% 38%, #10263F 0%, #081521 55%, #03080E 100%)",
        }}
      />
      {/* morning paper-sky over the maquette (act II) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: state.city ? 1 : 0,
          background:
            "linear-gradient(180deg, #C9DCEC 0%, #E2EAF0 42%, #F2EDE2 100%)",
        }}
      />
      <OrbitScene />
    </div>
  );
}
