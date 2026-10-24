import * as THREE from "three";
import gsap from "gsap";
import { SLUGS } from "../../data/catalog";
import { rigs, cam } from "../../webgl/rigs";

// Helpers for pages that drive the scene every frame from scroll or layout (Home, Index).
// A "state" is { cam: pose, objects: { slug: rig props } }, computed purely from inputs,
// so scrolling backwards replays everything in reverse for free.

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const mix = (a, b, k) => a + (b - a) * k;
export const smooth = (a, b, v) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
export const LINE = 1.15;

const UP = new THREE.Vector3(0, 1, 0);
const d = new THREE.Vector3();
const right = new THREE.Vector3();
const up = new THREE.Vector3();

/**
 * Camera pose that fits a W×H extent centred on `center`, seen from `dir`.
 * `sx`/`sy` place the object off-centre, in fractions of the viewport (+x right, +y up).
 */
export function fitPose({ dir, center = [0, 0, 0], W, H, fillW = 0.6, fillH = 0.6, fov = 24, sx = 0, sy = 0 }) {
  const vh = window.innerHeight;
  const aspect = window.innerWidth / vh;
  const t = Math.tan(THREE.MathUtils.degToRad(fov / 2));
  const size = Math.max(H / fillH, W / (fillW * aspect));
  const dist = size / 2 / t;
  d.set(...dir).normalize();
  right.crossVectors(UP, d);
  if (right.lengthSq() < 1e-8) right.set(1, 0, 0);
  right.normalize();
  up.crossVectors(d, right).normalize();
  const viewH = 2 * dist * t;
  const viewW = viewH * aspect;
  const tx = center[0] - right.x * sx * viewW - up.x * sy * viewH;
  const ty = center[1] - right.y * sx * viewW - up.y * sy * viewH;
  const tz = center[2] - right.z * sx * viewW - up.z * sy * viewH;
  return { x: tx + d.x * dist, y: ty + d.y * dist, z: tz + d.z * dist, tx, ty, tz, fov, perPx: viewH / vh };
}

export function mixPose(a, b, k) {
  const out = {};
  for (const key in a) out[key] = mix(a[key], b[key], k);
  return out;
}

/** World offset that centres an entity's bounding box on its rig position (for a given ry and scale). */
export function centring(entity, ry, scale) {
  const b = entity.bounds();
  const ox = (b.min.x + b.max.x) / 2, oz = (b.min.z + b.max.z) / 2;
  const c = Math.cos(ry), s = Math.sin(ry);
  return [-(ox * c + oz * s) * scale, -(-ox * s + oz * c) * scale];
}

const presence = (s) => (s ? Math.max(s.line ?? LINE, (s.sweep ?? 1) * 2) : 0);
const DEFAULT = { x: 0, y: 0, z: 0, rx: 0, ry: 0, scale: 1, explode: 0, sweep: 1, line: LINE };

/** Blend two object maps. An object missing on one side fades out in place instead of travelling. */
export function mixObjects(A, B, k) {
  const out = {};
  for (const slug of new Set([...Object.keys(A), ...Object.keys(B)])) {
    const a = { ...DEFAULT, ...(A[slug] ?? { ...B[slug], sweep: 0, line: 0 }) };
    const b = { ...DEFAULT, ...(B[slug] ?? { ...A[slug], sweep: 0, line: 0 }) };
    const pa = presence(A[slug]), pb = presence(B[slug]);
    const kt = pa < 0.01 ? 1 : pb < 0.01 ? 0 : k; // transform follows whichever side is visible
    const o = {};
    for (const key in DEFAULT) o[key] = mix(a[key], b[key], key === "sweep" || key === "line" ? k : kt);
    out[slug] = o;
  }
  return out;
}

/** Take control of the scene: stop any tweens left by the previous page. */
export function claim() {
  gsap.killTweensOf(cam);
  for (const s of SLUGS) gsap.killTweensOf(rigs[s]);
}

export function applyCam(p, extra = {}) {
  cam.x = p.x;
  cam.y = p.y;
  cam.z = p.z;
  cam.tx = p.tx;
  cam.ty = p.ty;
  cam.tz = p.tz;
  cam.fov = p.fov;
  cam.orbit = 0;
  Object.assign(cam, extra);
}

/** Write object states into the rigs. Objects not listed are hidden. */
export function applyObjects(objects) {
  for (const s of SLUGS) {
    const r = rigs[s];
    const o = objects[s];
    if (!o) {
      r.visible = 0;
      r.sweep = 0;
      continue;
    }
    const st = { ...DEFAULT, ...o };
    r.x = st.x;
    r.y = st.y;
    r.z = st.z;
    r.rx = st.rx;
    r.ry = st.ry;
    r.spin = 0;
    r.scale = st.scale;
    r.explode = st.explode;
    r.sweep = clamp01(st.sweep);
    r.line = Math.max(0, st.line);
    r.visible = r.line > 0.02 || r.sweep > 0.002 ? 1 : 0;
  }
}
