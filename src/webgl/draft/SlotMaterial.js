import * as THREE from "three";
import CustomShaderMaterial from "three-custom-shader-material/vanilla";
import gsap from "gsap";
import { MATTER_FRAG, MATTER_VERT } from "./shaders";
import { draft } from "./uniforms";
import { resolveMaterial, WHITE, MID } from "./textures";
import { FINISHES } from "../../data/materials";

const v4 = () => new THREE.Vector4();

function writeSide(u, prefix, s) {
  u[`uMap${prefix}`].value = s.map;
  u[`uArm${prefix}`].value = s.arm;
  u[`uCol${prefix}`].value.copy(s.color);
  u[`u${prefix}`].value.set(s.tile, s.rough, s.metal, s.detail);
  u[`u${prefix}2`].value.set(s.avg, s.rotate, s.clear, 0);
}

/**
 * One material per (object, slot). Holds two surface descriptions, A (current) and B (incoming),
 * and blends between them with the ink-bleed front.
 */
export class SlotMaterial {
  constructor(sweepUniform) {
    this.uniforms = {
      ...draft,
      uSweepY: sweepUniform,
      uMapA: { value: WHITE },
      uArmA: { value: MID },
      uMapB: { value: WHITE },
      uArmB: { value: MID },
      uColA: { value: new THREE.Color("#cccccc") },
      uColB: { value: new THREE.Color("#cccccc") },
      uA: { value: v4().set(1, 0.6, 0, 0) },
      uA2: { value: v4().set(1, 0, 0, 0) },
      uB: { value: v4().set(1, 0.6, 0, 0) },
      uB2: { value: v4().set(1, 0, 0, 0) },
      uBleedHit: { value: new THREE.Vector3() },
      uBleed: { value: 0 },
      uBleedR: { value: 2 },
      uFinish: { value: 1 },
      uGloss: { value: 0 },
    };
    this.material = new CustomShaderMaterial({
      baseMaterial: THREE.MeshPhysicalMaterial,
      vertexShader: MATTER_VERT,
      fragmentShader: MATTER_FRAG,
      uniforms: this.uniforms,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      sheen: 0.0001,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffffff"),
      envMapIntensity: 1,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    this.current = null;
    this.tween = null;
    this.token = 0;
  }

  /** Switch to material `id`. With `from` (world point) the change bleeds out from there. */
  async set(id, { from = null, radius = 2.5, duration = 1.1, immediate = false } = {}) {
    if (this.current === id) return;
    const token = ++this.token;
    const s = await resolveMaterial(id);
    if (token !== this.token) return; // a newer request superseded this one
    const u = this.uniforms;
    this.tween?.progress(1);
    if (immediate || !this.current) {
      this.apply(s);
      this.current = id;
      return;
    }
    writeSide(u, "B", s);
    u.uBleedHit.value.copy(from ?? new THREE.Vector3(0, 0.5, 0));
    u.uBleedR.value = radius;
    u.uBleed.value = 0;
    this.current = id;
    this.tween = gsap.to(u.uBleed, {
      value: 1,
      duration,
      ease: "power2.out",
      onComplete: () => {
        this.apply(s);
        u.uBleed.value = 0;
      },
    });
  }

  apply(s) {
    writeSide(this.uniforms, "A", s);
    const m = this.material;
    m.sheen = Math.max(s.sheen, 0.0001);
    if (m.normalMap !== s.nor) {
      m.normalMap = s.nor;
      m.normalScale.setScalar(0.6);
      m.needsUpdate = true;
    }
  }

  setFinish(key, immediate = false) {
    const f = FINISHES[key] ?? FINISHES.satin;
    const u = this.uniforms;
    if (immediate) {
      u.uFinish.value = f.rough;
      u.uGloss.value = f.gloss;
    } else {
      gsap.to(u.uFinish, { value: f.rough, duration: 0.8, ease: "power2.inOut" });
      gsap.to(u.uGloss, { value: f.gloss, duration: 0.8, ease: "power2.inOut" });
    }
  }

  dispose() {
    this.tween?.kill();
    this.material.dispose();
  }
}
