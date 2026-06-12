/* Scroll → WebGL bridge. ScrollTrigger writes here at scroll rate and the R3F
   scene reads it inside useFrame — values never pass through React state, so
   nothing re-renders at 120 Hz. Two acts drive the one fixed canvas: the
   orbit film (act I) and the city flight (act II); a tiny pub/sub tells the
   canvas wrapper / frameloop gate when either enters or leaves the screen. */
export const orbitBridge = {
  /* 0..1 across act I: hero hold → clouds → align → descent. */
  progress: 0,
  /* 0..1 across act II: cloud entry → bird's eye → swoop → street level. */
  city: 0,
  /* Normalized pointer (-1..1) for parallax; eased inside the rigs. */
  pointerX: 0,
  pointerY: 0,
  orbitOn: true,
  cityOn: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();

export function setActOn(act: "orbit" | "city", on: boolean) {
  const key = act === "orbit" ? "orbitOn" : "cityOn";
  if (orbitBridge[key] === on) return;
  orbitBridge[key] = on;
  listeners.forEach((l) => l());
}

export function canvasVisible() {
  return orbitBridge.orbitOn || orbitBridge.cityOn;
}

export function onBridgeChange(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
