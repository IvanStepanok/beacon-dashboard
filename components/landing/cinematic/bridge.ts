/* Scroll → WebGL bridge. ScrollTrigger writes here at scroll rate and the R3F
   scene reads it inside useFrame — values never pass through React state, so
   nothing re-renders at 120 Hz. Two acts drive the one fixed canvas: the
   orbit film (act I) and the city flight (act II); a tiny pub/sub tells the
   canvas wrapper / frameloop gate when either enters or leaves the screen.

   The state lives on globalThis: the canvas subtree loads through a dynamic
   chunk, and dev-server HMR can end up instantiating this module twice —
   acts writing to one copy while the scene reads another (symptom: stage
   `visible` becomes undefined, and undefined !== false means THREE renders
   the hidden stage). One shared singleton makes duplication harmless. */

interface BridgeState {
  /* 0..1 across act I: hero hold → clouds → align → descent. */
  progress: number;
  /* 0..1 across act II: cloud entry → bird's eye → swoop → street level. */
  city: number;
  /* Normalized pointer (-1..1) for parallax; eased inside the rigs. */
  pointerX: number;
  pointerY: number;
  orbitOn: boolean;
  cityOn: boolean;
  /* the film has buffered enough to scrub the whole descent */
  filmReady: boolean;
}

type Listener = () => void;

interface BridgeGlobal {
  state: BridgeState;
  listeners: Set<Listener>;
}

const globalStore = globalThis as unknown as { __beaconFilmBridge?: BridgeGlobal };

const bridge: BridgeGlobal = (globalStore.__beaconFilmBridge ??= {
  state: {
    progress: 0,
    city: 0,
    pointerX: 0,
    pointerY: 0,
    orbitOn: true,
    cityOn: false,
    filmReady: false,
  },
  listeners: new Set<Listener>(),
});

export const orbitBridge = bridge.state;

export function setActOn(act: "orbit" | "city", on: boolean) {
  /* Coerce hard: ScrollTrigger.isActive can be undefined on a trigger that
     has not refreshed yet (StrictMode's second mount hits this), and an
     undefined stored here makes THREE render "hidden" stages — the renderer
     only skips `visible === false`. */
  const value = on === true;
  const key = act === "orbit" ? "orbitOn" : "cityOn";
  if (bridge.state[key] === value) return;
  bridge.state[key] = value;
  bridge.listeners.forEach((l) => l());
}

export function canvasVisible() {
  return bridge.state.orbitOn || bridge.state.cityOn;
}

/* Mount order makes child effects fire before the landing shell's — state
   lives here (re-readable after subscribing) instead of in fire-and-forget
   DOM events, or a cached video can report ready before anyone listens. */
export function setFilmReady() {
  if (bridge.state.filmReady) return;
  bridge.state.filmReady = true;
  bridge.listeners.forEach((l) => l());
}

export function onBridgeChange(listener: Listener) {
  bridge.listeners.add(listener);
  return () => {
    bridge.listeners.delete(listener);
  };
}
