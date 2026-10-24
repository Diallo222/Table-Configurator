import * as THREE from "three";
import { addAfterEffect } from "@react-three/fiber";
import { getEntity } from "./objects/registry";

// DOM → WebGL helpers: raycast picking (swatch drops), projection (annotations) and snapshots.

let three = null;
export const bindThree = (state) => (three = state);
export const getThree = () => three;

const ndc = new THREE.Vector2();
const ray = new THREE.Raycaster();
const box = new THREE.Box3();
const v = new THREE.Vector3();

/** Pick the configurable part under a screen point (CSS px). */
export function pick(x, y, slug) {
  if (!three) return null;
  const { camera, size } = three;
  ndc.set((x / size.width) * 2 - 1, -(y / size.height) * 2 + 1);
  ray.setFromCamera(ndc, camera);
  const roots = slug ? [getEntity(slug).root] : [];
  const hit = ray.intersectObjects(roots, true).find((h) => h.object.userData.slot);
  return hit ? { slug: hit.object.userData.slug, slot: hit.object.userData.slot, point: hit.point.clone() } : null;
}

/** World-space centre of every mesh using `slot` on an entity. */
export function slotCenter(slug, slot) {
  const e = getEntity(slug);
  box.makeEmpty();
  e.root.traverse((o) => {
    if (o.isMesh && o.userData.slot === slot) box.expandByObject(o);
  });
  return box.isEmpty() ? e.root.getWorldPosition(new THREE.Vector3()) : box.getCenter(new THREE.Vector3());
}

/** Project a world point to CSS px. Returns null when behind the camera. */
export function project(p, out = { x: 0, y: 0 }) {
  if (!three) return null;
  v.copy(p).project(three.camera);
  if (v.z > 1) return null;
  out.x = (v.x * 0.5 + 0.5) * three.size.width;
  out.y = (-v.y * 0.5 + 0.5) * three.size.height;
  return out;
}

/* -------- snapshots: read the canvas right after a render, composite on paper -------- */
let pending = [];
/** True while the frame being rendered is a snapshot (editing aids like handles hide themselves). */
export const capture = { on: false };
addAfterEffect(() => {
  if (!pending.length || !three) return;
  capture.on = false;
  const src = three.gl.domElement;
  for (const { resolve, width, crop } of pending.splice(0)) {
    const c = document.createElement("canvas");
    const sw = src.width * crop, sh = src.height * crop;
    const sx = (src.width - sw) / 2, sy = (src.height - sh) / 2;
    c.width = width;
    c.height = Math.round((width * sh) / sw);
    const g = c.getContext("2d");
    g.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--paper").trim() || "#eeebe4";
    g.fillRect(0, 0, c.width, c.height);
    g.drawImage(src, sx, sy, sw, sh, 0, 0, c.width, c.height);
    resolve(c);
  }
});

/** Resolve with a canvas of the next rendered frame (centre crop). */
export function snapshot({ width = 520, crop = 0.8 } = {}) {
  capture.on = true;
  return new Promise((resolve) => pending.push({ resolve, width, crop }));
}
