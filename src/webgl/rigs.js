import gsap from "gsap";
import { SLUGS } from "../data/catalog";

// Plain mutable state that pages tween with GSAP and the WebGL loop reads every frame.
// Keeping it outside React means a page can choreograph the scene without re-rendering it.

const rig = () => ({
  x: 0,
  y: 0,
  z: 0,
  rx: 0,
  ry: 0,
  spin: 0,
  scale: 1,
  visible: 0,
  sweep: 0, // 0 = drawing, 1 = matter
  explode: 0,
  line: 1.15,
});

export const rigs = Object.fromEntries(SLUGS.map((s) => [s, rig()]));

export const cam = {
  x: 0,
  y: 1.1,
  z: 6,
  tx: 0,
  ty: 0.45,
  tz: 0,
  fov: 28,
  parallax: 1, // pointer parallax strength
  orbit: 0, // extra azimuth around target (radians)
  fit: 1, // widen framing on portrait screens (pages that map DOM rects to world space turn it off)
};

export const stage = {
  shadow: 1, // contact shadow opacity multiplier
  floorY: 0,
};

/** Hide every object except the listed ones (instantly). */
export function only(...slugs) {
  for (const s of SLUGS) {
    gsap.killTweensOf(rigs[s]);
    rigs[s].visible = slugs.includes(s) ? 1 : 0;
  }
}

export function resetRig(slug, props = {}) {
  gsap.killTweensOf(rigs[slug]);
  Object.assign(rigs[slug], rig(), props);
}
