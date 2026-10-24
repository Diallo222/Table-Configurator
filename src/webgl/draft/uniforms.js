import * as THREE from "three";

// Global uniforms shared by every draft material (the same objects are referenced, never copied).
export const draft = {
  uLens: { value: new THREE.Vector3(-1e5, -1e5, 0) },
  uPlan: { value: 0 },
  uTime: { value: 0 },
  uInk: { value: new THREE.Color("#161614") },
  uPencil: { value: new THREE.Color("#ff4a1c") },
  uPx: { value: 1 },
  uRes: { value: new THREE.Vector2(1, 1) },
};

export const INK = { day: "#161614", night: "#eeebe4" };

export function setInk(theme) {
  draft.uInk.value.set(INK[theme] ?? INK.day);
}

// Lens geometry in CSS px; converted to device px / GL coordinates here.
export function setLens(x, y, r) {
  const px = draft.uPx.value;
  draft.uLens.value.set(x * px, draft.uRes.value.y - y * px, r * px);
}
