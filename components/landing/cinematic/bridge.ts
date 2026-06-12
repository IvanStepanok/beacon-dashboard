/* Scroll → WebGL bridge. ScrollTrigger writes here at scroll rate and the R3F
   scene reads it inside useFrame — values never pass through React state, so
   nothing re-renders at 120 Hz. (The one exception, `visible`, has a tiny
   pub/sub so the canvas can stop its frameloop when scrolled past.) */
export const orbitBridge = {
  /* 0..1 across the whole orbit act: hero hold → clouds → align → descent. */
  progress: 0,
  /* Normalized pointer (-1..1) for the hero parallax; eased inside the rig. */
  pointerX: 0,
  pointerY: 0,
  visible: true,
};

type VisibleListener = (visible: boolean) => void;
const listeners = new Set<VisibleListener>();

export function setOrbitVisible(visible: boolean) {
  if (visible === orbitBridge.visible) return;
  orbitBridge.visible = visible;
  listeners.forEach((l) => l(visible));
}

export function onOrbitVisible(listener: VisibleListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
