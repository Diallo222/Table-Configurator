import * as THREE from "three";
import { BY_SLUG, SLUGS } from "../../data/catalog";
import { BUILDERS } from "./builders";
import { Entity } from "./Entity";
import { kelvinToRgb } from "../../utils/color";
import { useUI } from "../../store/useUI";

function haloTexture() {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d");
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.2, "rgba(255,255,255,0.45)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

const EXTRAS = {
  orbit: {
    setup(e) {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.02, 24, 16), new THREE.MeshBasicMaterial({ toneMapped: false }));
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({ map: haloTexture(), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false })
      );
      const spot = new THREE.SpotLight("#ffffff", 0, 3.5, 0.75, 0.6, 1.6);
      const target = new THREE.Object3D();
      spot.target = target;
      bulb.layers.set(1);
      halo.layers.set(1);
      e.root.add(bulb, halo, spot, target);
      e.extra = { bulb, halo, spot, target, glow: 0, color: new THREE.Color() };
    },
    tick(e, dt) {
      const { bulb, halo, spot, target, color } = e.extra;
      const [r, g, b] = kelvinToRgb(e.params.kelvin);
      color.setRGB(r, g, b, THREE.SRGBColorSpace);
      const night = useUI.getState().theme === "night";
      const want = e.rig.sweep > 0.98 ? (night ? 1 : 0.35) : 0;
      e.extra.glow += (want - e.extra.glow) * Math.min(1, dt * 4);
      const [hx, hy] = e.out.head;
      const t = e.out.tilt;
      // light axis = shade opening direction (local -Y rotated by tilt about Z)
      const dx = Math.sin(t), dy = -Math.cos(t);
      bulb.position.set(hx + dx * 0.035, hy + dy * 0.035, 0);
      bulb.material.color.copy(color).multiplyScalar(0.4 + e.extra.glow * 2.2);
      bulb.visible = e.extra.glow > 0.01;
      halo.position.copy(bulb.position);
      halo.scale.setScalar(0.12 + e.extra.glow * 0.5);
      halo.material.color.copy(color);
      halo.material.opacity = e.extra.glow * 0.55;
      halo.visible = bulb.visible;
      spot.position.copy(bulb.position);
      target.position.set(hx + dx * 1.2, hy + dy * 1.2, 0);
      spot.color.copy(color);
      spot.intensity = e.extra.glow * 6;
    },
  },
};

const entities = new Map();

export function getEntity(slug) {
  if (!entities.has(slug)) {
    const spec = { ...BY_SLUG[slug], build: BUILDERS[slug], ...(EXTRAS[slug] ?? {}) };
    entities.set(slug, new Entity(spec));
  }
  return entities.get(slug);
}

export const allEntities = () => SLUGS.map(getEntity);
