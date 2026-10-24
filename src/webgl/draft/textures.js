import * as THREE from "three";
import { MATERIALS } from "../../data/materials";
import { proceduralCanvas } from "../../utils/procedural";

const loader = new THREE.TextureLoader();

function solid(r, g, b) {
  const t = new THREE.DataTexture(new Uint8Array([r, g, b, 255]), 1, 1);
  t.needsUpdate = true;
  return t;
}
export const WHITE = solid(255, 255, 255);
export const MID = solid(128, 128, 128); // neutral "arm" → roughness factor 1

function prep(t, srgb) {
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function averageLuminance(image) {
  const c = document.createElement("canvas");
  c.width = c.height = 8;
  const ctx = c.getContext("2d");
  ctx.drawImage(image, 0, 0, 8, 8);
  const d = ctx.getImageData(0, 0, 8, 8).data;
  let sum = 0;
  for (let i = 0; i < d.length; i += 4) {
    // sRGB → linear, matching what the shader samples
    const lin = (v) => Math.pow(v / 255, 2.2);
    sum += 0.2126 * lin(d[i]) + 0.7152 * lin(d[i + 1]) + 0.0722 * lin(d[i + 2]);
  }
  return sum / 64;
}

const load = (url) => new Promise((res, rej) => loader.load(url, res, undefined, rej));
const sets = new Map(); // tex name → Promise<{ map, arm, nor, avg }>

function loadSet(tex) {
  if (sets.has(tex)) return sets.get(tex);
  let p;
  if (tex.startsWith("proc:")) {
    const canvas = proceduralCanvas(tex.slice(5));
    const map = prep(new THREE.CanvasTexture(canvas), true);
    const arm = prep(new THREE.CanvasTexture(canvas), false);
    p = Promise.resolve({ map, arm, nor: null, avg: averageLuminance(canvas) });
  } else {
    p = Promise.all([
      load(`/textures/${tex}_diff.webp`),
      load(`/textures/${tex}_arm.webp`),
      load(`/textures/${tex}_nor.webp`),
    ]).then(([map, arm, nor]) => ({
      map: prep(map, true),
      arm: prep(arm, false),
      nor: prep(nor, false),
      avg: averageLuminance(map.image),
    }));
  }
  sets.set(tex, p);
  return p;
}

// Resolved surface description consumed by SlotMaterial.
const resolved = new Map();
export function resolveMaterial(id) {
  if (resolved.has(id)) return resolved.get(id);
  const m = MATERIALS[id];
  const base = {
    id,
    color: new THREE.Color(m.color),
    tile: m.tile ?? 1,
    rough: m.rough ?? 0.5,
    metal: m.metal ?? 0,
    detail: m.detail ?? 0,
    rotate: m.rotate ? 1 : 0,
    clear: m.clear ?? 0,
    sheen: m.sheen ?? 0,
    map: WHITE,
    arm: MID,
    nor: null,
    avg: 1,
  };
  const p = m.tex
    ? loadSet(m.tex).then((s) => {
        let nor = null;
        if (s.nor) {
          nor = s.nor.clone();
          nor.repeat.setScalar(1 / base.tile);
          if (base.rotate) nor.rotation = Math.PI / 2;
          nor.needsUpdate = true;
        }
        return { ...base, map: s.map, arm: s.arm, nor, avg: s.avg };
      })
    : Promise.resolve(base);
  resolved.set(id, p);
  return p;
}

export function preloadMaterials(ids) {
  return Promise.all(ids.map(resolveMaterial));
}
