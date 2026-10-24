import gsap from "gsap";
import { advance } from "@react-three/fiber";
import { stepScroll } from "./scroll";

// One clock for everything (PLAN D-03): GSAP ticker → Lenis → DOM frame hooks → WebGL render.
// The canvas uses frameloop="never"; advance() takes seconds in that mode.

const hooks = new Set();
let started = false;
let rendering = true;

/** Run `fn(time, dt)` every frame after scroll has been stepped and before WebGL renders. */
export function onFrame(fn) {
  hooks.add(fn);
  return () => hooks.delete(fn);
}

export function setRendering(on) {
  rendering = on;
}

function tick(time, deltaMs) {
  stepScroll(time * 1000);
  const dt = Math.min(deltaMs / 1000, 0.1);
  for (const fn of hooks) fn(time, dt);
  if (rendering && !document.hidden) advance(time);
}

export function startClock() {
  if (started) return;
  started = true;
  gsap.ticker.lagSmoothing(0);
  gsap.ticker.add(tick);
}
