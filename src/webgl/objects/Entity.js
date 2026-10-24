import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { easing } from "maath";
import gsap from "gsap";
import { draft } from "../draft/uniforms";
import { HULL_FRAG, HULL_VERT, patchLineShader } from "../draft/shaders";
import { SlotMaterial } from "../draft/SlotMaterial";
import { smoothNormals } from "../geo";
import { rigs } from "../rigs";

class DraftLineMaterial extends LineMaterial {
  constructor(sweep) {
    super({ linewidth: 1.15, worldUnits: false, alphaToCoverage: true, toneMapped: false });
    this.uniforms = { ...this.uniforms, ...draft, uSweepY: sweep };
    patchLineShader(this);
  }
}

const SWEEP_MARGIN = 0.06;
const tmp = new THREE.Vector3();
const ONE = new THREE.Vector3(1, 1, 1);

/** One part = matter mesh + silhouette hull + edge lines, rebuilt only when its signature changes. */
class PartView {
  constructor(entity) {
    this.slug = entity.slug;
    this.group = new THREE.Group();
    this.mesh = new THREE.Mesh(new THREE.BufferGeometry());
    this.mesh.castShadow = true;
    this.hull = new THREE.Mesh(new THREE.BufferGeometry(), entity.hullMat);
    this.hull.renderOrder = 1;
    this.lines = new LineSegments2(new LineSegmentsGeometry(), entity.lineMat);
    this.lines.renderOrder = 2;
    // drawing layers: seen by the main camera only (not by shadows or raycasts)
    this.hull.layers.set(1);
    this.lines.layers.set(1);
    this.group.add(this.mesh, this.hull, this.lines);
    this.sig = null;
    this.explode = [0, 0, 0];
    this.base = new THREE.Vector3();
  }

  set(def, material) {
    if (def.sig !== this.sig) {
      const geo = def.make();
      const old = [this.mesh.geometry, this.hull.geometry, this.lines.geometry];
      this.mesh.geometry = geo;
      this.hull.geometry = def.hull === "smooth" ? smoothNormals(geo) : geo;
      const lg = new LineSegmentsGeometry();
      if (def.edges !== "none") {
        const src = def.edges ? def.edges() : geo;
        const eg = new THREE.EdgesGeometry(src, def.threshold ?? 32);
        lg.fromEdgesGeometry(eg);
        eg.dispose();
        if (src !== geo) src.dispose();
      }
      this.lines.geometry = lg;
      for (const g of new Set(old)) g.dispose();
      this.sig = def.sig;
    }
    this.mesh.material = material;
    this.mesh.userData.slot = def.slot;
    this.mesh.userData.slug = this.slug;
    this.base.set(...(def.pos ?? [0, 0, 0]));
    this.group.rotation.set(...(def.rot ?? [0, 0, 0]));
    this.explode = def.explode ?? [0, 0, 0];
  }

  place(explode) {
    this.group.position.set(
      this.base.x + this.explode[0] * explode,
      this.base.y + this.explode[1] * explode,
      this.base.z + this.explode[2] * explode
    );
  }

  dispose() {
    for (const g of new Set([this.mesh.geometry, this.hull.geometry, this.lines.geometry])) g.dispose();
  }
}

/**
 * A configurable object living in the persistent scene. Driven by:
 *  - its config (numeric params ease towards targets, enums/materials switch),
 *  - its rig (position, rotation, scale, visibility, sweep, explode) tweened by pages with GSAP.
 */
export class Entity {
  constructor(spec) {
    this.spec = spec;
    this.slug = spec.slug;
    this.rig = rigs[spec.slug];
    this.root = new THREE.Group();
    this.root.name = spec.slug;
    this.content = new THREE.Group();
    this.root.add(this.content);
    this.sweep = { value: 99 };

    this.hullMat = new THREE.ShaderMaterial({
      uniforms: { ...draft, uSweepY: this.sweep, uWidth: { value: 1.6 } },
      vertexShader: HULL_VERT,
      fragmentShader: HULL_FRAG,
      side: THREE.BackSide,
      toneMapped: false,
    });
    this.lineMat = new DraftLineMaterial(this.sweep);

    this.slots = {};
    this.parts = new Map();
    this.params = {};
    this.target = {};
    for (const [k, p] of Object.entries(spec.params)) {
      this.params[k] = p.default;
      if (p.type === "num") this.target[k] = p.default;
    }
    this.out = { height: 1, anchors: {}, dims: [] };
    this.dirty = true;
    this.extra = {}; // per-object live state (e.g. lamp light)
    spec.setup?.(this);
  }

  slot(name) {
    return (this.slots[name] ??= new SlotMaterial(this.sweep));
  }

  /** Apply a config. `from` = world point where a material change starts bleeding. */
  configure(cfg, { from = null, immediate = false } = {}) {
    for (const [k, v] of Object.entries(cfg)) {
      const p = this.spec.params[k];
      if (!p) continue;
      if (p.type === "num") {
        this.target[k] = v;
        if (immediate) this.params[k] = v;
        this.dirty ||= immediate;
      } else if (p.type === "material") {
        this.params[k] = v;
        this.slot(p.slot).set(v, { from, immediate, radius: this.spec.bleedRadius ?? 2.5 });
      } else if (p.type === "finish") {
        if (this.params[k] !== v || immediate) {
          this.params[k] = v;
          for (const s of p.slots) this.slot(s).setFinish(v, immediate);
        }
      } else if (this.params[k] !== v) {
        this.params[k] = v;
        this.dirty = true;
      }
    }
  }

  rebuild() {
    const out = this.spec.build(this.params);
    this.out = out;
    const seen = new Set();
    for (const def of out.parts) {
      seen.add(def.key);
      let pv = this.parts.get(def.key);
      if (!pv) {
        pv = new PartView(this);
        this.parts.set(def.key, pv);
        this.content.add(pv.group);
        if (def.pop && this.built) {
          gsap.fromTo(pv.group.scale, { y: 0.001 }, { y: 1, duration: 0.7, ease: "expo.out" });
        }
      }
      pv.set(def, this.slot(def.slot).material);
    }
    for (const [key, pv] of this.parts) {
      if (!seen.has(key)) {
        this.content.remove(pv.group);
        pv.dispose();
        this.parts.delete(key);
      }
    }
    this.dirty = false;
    this.built = true;
    this._bounds = null;
  }

  /** Bounding box of the assembled object in its own space (unexploded), cached per rebuild. */
  bounds() {
    if (this._bounds) return this._bounds;
    const out = new THREE.Box3();
    const b = new THREE.Box3();
    const m = new THREE.Matrix4();
    for (const pv of this.parts.values()) {
      const g = pv.mesh.geometry;
      if (!g.boundingBox) g.computeBoundingBox();
      m.compose(pv.base, pv.group.quaternion, ONE); // ignore the pop-in scale tween
      out.union(b.copy(g.boundingBox).applyMatrix4(m));
    }
    return (this._bounds = out);
  }

  update(dt, state) {
    // ease numeric params (dimensions) towards their targets
    for (const k in this.target) {
      const before = this.params[k];
      const box = { v: before };
      easing.damp(box, "v", this.target[k], 0.12, dt);
      if (Math.abs(box.v - this.target[k]) < 0.25) box.v = this.target[k];
      if (box.v !== before) {
        this.params[k] = box.v;
        this.dirty = true;
      }
    }
    if (this.dirty) this.rebuild();

    const r = this.rig;
    this.root.visible = r.visible > 0;
    if (!this.root.visible) return;
    this.root.position.set(r.x, r.y, r.z);
    this.root.rotation.set(r.rx, r.ry + r.spin, 0);
    this.root.scale.setScalar(r.scale);
    for (const pv of this.parts.values()) pv.place(r.explode);

    const lift = (this.out.explodeLift ?? 0.4) * r.explode;
    const h = this.out.height + lift;
    this.sweep.value = r.y + r.scale * (-SWEEP_MARGIN + r.sweep * (h + 2 * SWEEP_MARGIN));

    const { size } = state;
    this.lineMat.resolution.set(size.width, size.height);
    this.lineMat.linewidth = r.line ?? 1.15;
    this.hullMat.uniforms.uWidth.value = 1.7 * draft.uPx.value * (r.line ?? 1.15);
    this.spec.tick?.(this, dt, state);
  }

  /** World position of a named anchor from the builder output. */
  anchor(name, target = tmp) {
    const a = this.out.anchors[name];
    if (!a) return null;
    const pv = a.part ? this.parts.get(a.part) : null;
    target.set(...a.pos);
    if (pv) target.add(pv.group.position).sub(pv.base);
    return this.root.localToWorld(target);
  }
}
