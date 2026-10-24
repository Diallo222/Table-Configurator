import gsap from "gsap";
import * as THREE from "three";
import { SLUGS } from "../../../data/catalog";
import { rigs, cam, resetRig, stage } from "../../../webgl/rigs";
import { getEntity } from "../../../webgl/objects/registry";
import { sound } from "../../../core/audio";

// Scene choreography for the Workbench: framing, entering, plan views.

const VIEWS = {
  studio: [0.62, 0.46, 1],
  front: [0, 0.015, 1],
  side: [1, 0.015, 0.0001],
  top: [0, 1, 0.002],
};

export function measure(slug) {
  const e = getEntity(slug);
  const out = e.spec.build(e.params);
  return { H: out.height, W: out.width ?? 1, D: out.depth ?? 0.6 };
}

/** Compute a camera pose that frames the object, leaving room for the UI panels. */
export function framing(slug, view = "studio") {
  const { H, W, D } = measure(slug);
  const plan = view !== "studio";
  const fov = plan ? 9 : 24;
  const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const vw = window.innerWidth, vh = window.innerHeight;
  const aspect = vw / vh;
  const desktop = vw >= 980;
  const usableH = desktop ? 0.62 : 0.4; // fraction of viewport height the object may use
  const usableW = desktop ? Math.max(0.3, (vw - 860) / vw) : 0.82;
  // in the 3/4 studio view the depth shows too: it widens the silhouette and adds height
  const extentH = view === "top" ? D : view === "studio" ? H + D * 0.4 : H;
  const extentW = view === "side" ? D : view === "top" || view === "front" ? W : W * 0.86 + D * 0.55;
  const size = Math.max(extentH / usableH, extentW / (usableW * aspect));
  const dist = (size / 2 / t) * (plan ? 1.15 : 1.05);

  const dir = new THREE.Vector3(...VIEWS[view]).normalize();
  const target = new THREE.Vector3(0, view === "top" ? 0 : H * 0.48, 0);
  const worldPerPx = (2 * dist * t) / vh;
  if (desktop) {
    const right = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize();
    if (view === "top") right.set(1, 0, 0);
    // info column (left, ~380px) is narrower than the spec panel (right, ~420px): nudge the object left
    target.addScaledVector(right, 24 * worldPerPx);
  } else {
    const up = view === "top" ? new THREE.Vector3(0, 0, -1) : new THREE.Vector3(0, 1, 0);
    target.addScaledVector(up, -vh * 0.17 * worldPerPx);
  }
  const pos = target.clone().addScaledVector(dir, dist);
  return { x: pos.x, y: pos.y, z: pos.z, tx: target.x, ty: target.y, tz: target.z, fov };
}

export function frame(slug, view = "studio", duration = 1.6) {
  const f = framing(slug, view);
  gsap.to(cam, { ...f, orbit: 0, parallax: view === "studio" ? 0.5 : 0, duration, ease: "expo.inOut", overwrite: true });
}

/** Bring `slug` to the bench: others dematerialise, it materialises with the drafting sweep. */
export function enter(slug, { flight = false } = {}) {
  for (const s of SLUGS) {
    if (s === slug) continue;
    const r = rigs[s];
    gsap.killTweensOf(r);
    if (r.visible) gsap.to(r, { sweep: 0, explode: 0, duration: 0.7, ease: "power2.in", onComplete: () => (r.visible = 0) });
  }
  const r = rigs[slug];
  gsap.killTweensOf(r);
  const live = flight && r.visible && r.sweep > 0.4;
  if (!live) resetRig(slug, { visible: 1, sweep: 0, ry: -0.35 });
  stage.shadow = 1;
  gsap.to(r, { x: 0, y: 0, z: 0, scale: 1, rx: 0, ry: 0, spin: 0, explode: 0, duration: 1.5, ease: "expo.inOut" });
  gsap.to(r, { sweep: 1, duration: live ? 0.8 : 1.8, ease: "power2.inOut", delay: live ? 0 : 0.35, onStart: () => !live && sound("scratch", 1.2) });
  frame(slug, "studio", live ? 1.5 : 1.9);
}
