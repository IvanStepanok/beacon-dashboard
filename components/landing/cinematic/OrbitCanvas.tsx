"use client";

/* Fixed full-viewport WebGL stage behind the scrolling story. Client wrapper
   with ssr:false — three.js never renders on the server. The wrapper also
   feeds pointer parallax into the bridge and fades itself away once the
   orbital act has scrolled past (the scene stops its frameloop in parallel). */

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { orbitBridge, onOrbitVisible } from "./bridge";

const OrbitScene = dynamic(() => import("./orbit/OrbitScene"), { ssr: false });

export function OrbitCanvas() {
  /* Initial value from the bridge — a reload mid-page may have already
     scrolled past the orbit act before this component mounts. */
  const [shown, setShown] = useState(() => orbitBridge.visible);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      orbitBridge.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      orbitBridge.pointerY = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    const off = onOrbitVisible(setShown);
    return () => {
      window.removeEventListener("pointermove", onMove);
      off();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-0 transition-opacity duration-500"
      style={{
        opacity: shown ? 1 : 0,
        background:
          "radial-gradient(ellipse 90% 70% at 64% 38%, #10263F 0%, #081521 55%, #03080E 100%)",
      }}
    >
      <OrbitScene />
    </div>
  );
}
