import * as THREE from "three";
import gsap from "gsap";
import { create } from "zustand";
import { addAfterEffect } from "@react-three/fiber";
import { CATALOG } from "../../../data/catalog";
import { onFrame } from "../../../core/clock";
import { scroll } from "../../../core/scroll";
import { pointer } from "../../../core/pointer";
import { sound } from "../../../core/audio";
import { useUI } from "../../../store/useUI";
import { useConfig } from "../../../store/useConfig";
import { getEntity } from "../../../webgl/objects/registry";
import { project } from "../../../webgl/bridge";
import { setTheme } from "../../chrome/night";
import { LINE, applyCam, applyObjects, centring, claim, clamp01, fitPose, mix, mixObjects, mixPose, smooth } from "../scene";

// The home page is one long, reversible shot. Every frame the scroll position is mapped to a
// scene state (camera + objects) per chapter; between chapters the two states are blended.

/** DOM readouts that change a few times per second at most. */
export const useHome = create(() => ({ coll: 0, mm: 900, seats: 2 }));

const SECTIONS = ["hero", "line", "coll", "measure", "mat", "atelier", "foot"];
const LABELS = ["HERO", "THE LINE", "COLLECTION", "MEASURE", "MATERIALS", "ATELIER", "FIN"];
const v = new THREE.Vector3();
const gsapClamp = (a, b, x) => Math.min(b, Math.max(a, x));

export function seatsFor(wMm) {
  const side = Math.max(1, Math.floor(wMm / 600));
  return Math.min(10, side * 2 + (wMm >= 2000 ? 2 : 0));
}

export function startHome({ sections, annos, chairs }) {
  claim();
  const atlas = getEntity("atlas");
  const intro = { line: 0, sweep: 0 };
  const live = { anno: 0, chairs: 0, wOverride: null, autoNight: false, lastP: {}, tilt: -0.28, mode: "studio", ruler: null };
  let layout = [];

  const measure = () => {
    const vh = window.innerHeight;
    layout = sections.map((el, i) => {
      const r = el.getBoundingClientRect();
      const top = r.top + window.scrollY;
      const h = r.height;
      const sticky = el.dataset.sticky !== undefined;
      let a, b;
      if (i === 0) [a, b] = [-1e6, 0];
      else if (sticky) [a, b] = [top, top + h - vh];
      else [a, b] = [top - vh * 0.35, top + h - vh * 0.65];
      return { el, top, h, sticky, a, b: Math.max(b, a + 1) };
    });
    for (let i = 1; i < layout.length; i++) layout[i].a = Math.max(layout[i].a, layout[i - 1].b + 1);
  };
  measure();
  const ro = new ResizeObserver(measure);
  sections.forEach((s) => ro.observe(s));
  window.addEventListener("resize", measure);

  const desk = () => window.innerWidth >= 980;

  /* ------------------------------------------------------------- chapter states */
  const dims = (e) => ({ W: e.out.width ?? 1, H: e.out.height, D: e.out.depth ?? 0.6 });

  const hero = () => {
    const { W, H, D } = dims(atlas);
    const dk = desk();
    return {
      // seen from above, the top's depth adds to the on-screen height
      cam: fitPose({ dir: [0.62, 0.34, 1], center: [0, H * 0.42, 0], W: Math.max(W, D) * 0.95, H: H + D * 0.35, fillW: dk ? 0.46 : 1.05, fillH: dk ? 0.46 : 0.4, sy: dk ? -0.1 : -0.01 }),
      parallax: 0.6,
      objects: { atlas: { ry: live.tilt, sweep: intro.sweep, line: LINE * intro.line } },
    };
  };

  const line = (p) => {
    const { W, H, D } = dims(atlas);
    const dk = desk();
    const ex = smooth(0.04, 0.5, p) * (1 - smooth(0.8, 0.98, p));
    const axo = smooth(0, 0.45, p) * (1 - 0.7 * smooth(0.8, 1, p));
    const dir = [mix(0.62, 1, axo), mix(0.34, 1.05, axo), mix(1, 0.9, axo)];
    const Heff = H + 0.42 * ex;
    live.anno = smooth(0.32, 0.46, ex) * (1 - smooth(0.82, 0.9, p));
    return {
      cam: fitPose({ dir, center: [0, Heff * 0.5, 0], W: Math.max(W, D) * 1.1, H: Heff + D * 0.5 * axo, fillW: dk ? 0.42 : 1, fillH: dk ? 0.56 : 0.42, sx: dk ? 0.2 : 0, sy: dk ? 0 : 0.17 }),
      parallax: 0.4,
      objects: { atlas: { ry: mix(live.tilt, -0.1, axo), explode: ex, sweep: intro.sweep } },
    };
  };

  const coll = (p) => {
    const dk = desk();
    const S = dk ? 1.9 : 1.5;
    const r = p * (CATALOG.length - 1);
    const objects = {};
    CATALOG.forEach(({ slug }, i) => {
      const e = getEntity(slug);
      const x = (i - r) * S;
      const ax = Math.abs(x);
      const sweep = 1 - smooth(0.3 * S, 0.85 * S, ax);
      const ln = LINE * (1 - smooth(1.2 * S, 2.5 * S, ax));
      if (ln < 0.005 && sweep <= 0) return;
      const { W, H, D } = dims(e);
      const size = Math.max(W, H * 1.15, D * 0.8);
      const ry = -0.55 + (x / S) * 0.5 + (ax < 0.5 * S ? (live.tilt + 0.28) * 0.8 : 0);
      const scale = Math.min(1, 1 / size);
      const [dx, dz] = centring(e, ry, scale);
      objects[slug] = { x: x + dx, z: dz, ry, scale, sweep, line: ln };
    });
    const idx = Math.round(r);
    if (useHome.getState().coll !== idx) useHome.setState({ coll: idx });
    return {
      cam: fitPose({ dir: [0.16, 0.3, 1], center: [0, 0.55, 0], W: 1.7, H: 1.2, fillW: dk ? 0.38 : 0.74, fillH: dk ? 0.5 : 0.36, sy: dk ? -0.02 : 0.04 }),
      parallax: 0.3,
      objects,
    };
  };

  const measureCh = (p) => {
    const dk = desk();
    const w = 900 + Math.round(smooth(0.06, 0.86, p) * 150) * 10;
    live.wOverride = w;
    live.chairs = 1;
    const { H } = dims(atlas);
    return {
      cam: fitPose({ dir: [0, 1, 0.002], center: [0, H, 0], W: 3.3, H: 1.9, fillW: dk ? 0.6 : 0.92, fillH: dk ? 0.56 : 0.4, fov: 9, sx: dk ? 0.06 : 0, sy: dk ? 0.05 : 0.02 }),
      parallax: 0,
      plan: true,
      objects: { atlas: { ry: 0, sweep: 1 } },
    };
  };

  const mat = (p) => {
    const e = getEntity("tripod");
    const { H } = dims(e);
    const dk = desk();
    return {
      cam: fitPose({ dir: [0.62, 0.42, 1], center: [0, H * 0.5, 0], W: 0.55, H, fillW: dk ? 0.3 : 0.6, fillH: dk ? 0.62 : 0.36, sx: dk ? 0.2 : 0, sy: dk ? 0 : 0.2 }),
      parallax: 0.5,
      objects: { tripod: { ry: -0.7 + p * 1.4 } },
    };
  };

  const atelier = (p) => {
    const dk = desk();
    const drop = 1 - smooth(0.12, 0.5, p);
    return {
      cam: fitPose({ dir: [0.35, 0.16, 1], center: [0, 0.32, 0], W: 0.75, H: 0.75, fillW: dk ? 0.3 : 0.62, fillH: dk ? 0.62 : 0.4, sx: dk ? 0.24 : 0, sy: dk ? 0 : -0.16 }),
      parallax: 0.5,
      objects: { orbit: { y: drop * 0.9, ry: -0.5 + (live.tilt + 0.28) * 0.6, sweep: smooth(0.08, 0.45, p), line: LINE * smooth(0, 0.12, p) } },
    };
  };

  const foot = () => ({ ...atelier(1), objects: {} });

  const STATES = [hero, line, coll, measureCh, mat, atelier, foot];

  /* ------------------------------------------------------------- per frame */
  const night = (theme) => {
    const b = getEntity("orbit").extra.bulb;
    const s = b ? project(b.getWorldPosition(v)) : null;
    setTheme(theme, s?.x ?? window.innerWidth * 0.7, s?.y ?? window.innerHeight * 0.4);
  };

  const off = onFrame((t, dt) => {
    if (!layout.length) return;
    const y = scroll.y;
    const vh = window.innerHeight;
    const k = 1 - Math.pow(0.02, dt);
    live.tilt += (-0.28 + pointer.nx * 0.22 - live.tilt) * k;
    live.anno = 0;
    live.chairs = 0;
    live.wOverride = null;

    // CSS progress per section (drives the type reveals)
    layout.forEach((s, i) => {
      const p = i === 0 ? clamp01(y / vh) : s.sticky ? clamp01((y - s.top) / Math.max(1, s.h - vh)) : clamp01((y + vh - s.top) / (s.h + vh));
      if (Math.abs((live.lastP[i] ?? -1) - p) > 0.0004) {
        s.el.style.setProperty("--p", p.toFixed(4));
        live.lastP[i] = p;
      }
    });

    // which chapter(s) are on screen
    let state, dominant;
    for (let i = 0; i < layout.length; i++) {
      const s = layout[i];
      if (y < s.a && i > 0) {
        const prev = layout[i - 1];
        const kk = smooth(prev.b, s.a, y);
        const A = STATES[i - 1](1), B = STATES[i](0);
        state = { cam: mixPose(A.cam, B.cam, kk), parallax: mix(A.parallax, B.parallax, kk), objects: mixObjects(A.objects, B.objects, kk), plan: kk < 0.5 ? A.plan : B.plan };
        dominant = kk < 0.5 ? i - 1 : i;
        break;
      }
      if (y <= s.b || i === layout.length - 1) {
        const p = i === 0 ? 0 : clamp01((y - s.a) / (s.b - s.a));
        state = STATES[i](p);
        dominant = i;
        if (SECTIONS[i] === "atelier") {
          if (p > 0.62 && !live.autoNight && useUI.getState().theme === "day") {
            live.autoNight = true;
            sound("click");
            night("night");
          } else if (p < 0.4 && live.autoNight) {
            live.autoNight = false;
            if (useUI.getState().theme === "night") night("day");
          }
        }
        break;
      }
    }
    if (!state) return;
    if (dominant !== live.dominant) {
      live.dominant = dominant;
      useUI.getState().setSection(String(dominant + 1).padStart(2, "0"), LABELS[dominant]);
    }

    applyCam(state.cam, { parallax: state.parallax, fit: 1 });
    applyObjects(state.objects);

    // the measure chapter stretches the table without touching the saved configuration
    if (live.wOverride !== null) atlas.configure({ w: live.wOverride });
    else if (atlas.target.w !== useConfig.getState().configs.atlas.w) atlas.configure(useConfig.getState().configs.atlas);
    if (live.wOverride !== null) {
      const seats = seatsFor(live.wOverride);
      const h = useHome.getState();
      if (h.mm !== live.wOverride || h.seats !== seats) useHome.setState({ mm: live.wOverride, seats });
    }

    // plan mode + rulers in millimetres for the measure chapter
    const wantPlan = SECTIONS[dominant] === "measure";
    const ui = useUI.getState();
    if (wantPlan && ui.mode !== "plan") ui.setMode("plan");
    if (!wantPlan && ui.mode === "plan") ui.setMode("studio");
    const ruler = wantPlan ? Math.round(state.cam.perPx * 1000 * 100) / 100 : null;
    if (ruler !== live.ruler) {
      live.ruler = ruler;
      ui.setRuler(ruler);
    }
  });

  /* ------------------------------------------------------------- after render: DOM tied to 3D points */
  const pt = { x: 0, y: 0 };
  const offAfter = addAfterEffect(() => {
    // §02 annotations with leader lines
    if (annos) {
      const show = live.anno;
      const w = window.innerWidth;
      annos.items.forEach((a, i) => {
        const p = annoPoint(atlas, a.dataset.anchor);
        const s = show > 0.01 && p ? project(p, pt) : null;
        const dot = annos.dots[i], ln = annos.lines[i];
        if (!s) {
          a.style.opacity = 0;
          dot.setAttribute("r", 0);
          ln.setAttribute("x2", ln.getAttribute("x1"));
          return;
        }
        const box = a.getBoundingClientRect();
        const reachX = 70 + i * 18;
        // labels go right of their point unless that would leave the screen
        const side = s.x + reachX + box.width > w - 16 || s.x > w * 0.62 ? -1 : 1;
        const lx = gsapClamp(16 + (side < 0 ? box.width : 0), w - 16 - (side > 0 ? box.width : 0), s.x + side * reachX);
        const ly = s.y - 64 - i * 26;
        const ax = side > 0 ? lx : lx - box.width;
        a.style.transform = `translate3d(${ax.toFixed(1)}px, ${(ly - box.height / 2).toFixed(1)}px, 0)`;
        a.style.opacity = clamp01(show * 1.4 - i * 0.15);
        const reach = clamp01(show * 1.6 - i * 0.2);
        dot.setAttribute("cx", s.x);
        dot.setAttribute("cy", s.y);
        dot.setAttribute("r", 2.5 * reach);
        ln.setAttribute("x1", s.x);
        ln.setAttribute("y1", s.y);
        ln.setAttribute("x2", mix(s.x, lx, reach));
        ln.setAttribute("y2", mix(s.y, ly, reach));
      });
    }
    // §04 chairs drawn around the table
    if (chairs) {
      const W = atlas.params.w / 1000, D = atlas.params.d / 1000, H = atlas.out.height;
      const wMm = live.wOverride ?? 0;
      const pos = live.chairs ? chairLayout(W, D, seatsFor(wMm)) : [];
      chairs.forEach((el, i) => {
        const c = pos[i];
        const s = c ? project(atlas.root.localToWorld(v.set(c[0], H, c[1])), pt) : null;
        el.classList.toggle("is-on", !!s);
        if (s) el.style.transform = `translate3d(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px, 0) rotate(${c[2]}deg)`;
      });
    }
  });

  // intro: the table is drawn in lines, then the sweep turns it into matter
  const startIntro = (handoff) => {
    gsap.to(intro, { line: 1, duration: handoff ? 0.6 : 0.8, ease: "power2.out" });
    gsap.to(intro, { sweep: 1, duration: handoff ? 2.2 : 1.6, delay: handoff ? 0.35 : 0.25, ease: "power2.inOut", onStart: () => sound("scratch", 1.2) });
  };

  return {
    startIntro,
    stop() {
      off();
      offAfter();
      ro.disconnect();
      window.removeEventListener("resize", measure);
      gsap.killTweensOf(intro);
      atlas.configure(useConfig.getState().configs.atlas);
      const ui = useUI.getState();
      ui.setMode("studio");
      ui.setRuler(null);
    },
  };
}

function annoPoint(e, name) {
  if (e.out.anchors[name]) return e.anchor(name, v).clone();
  const pv = e.parts.get(name) ?? e.parts.get("railF") ?? e.parts.get("beam") ?? e.parts.get("spine");
  return pv ? pv.group.getWorldPosition(new THREE.Vector3()) : null;
}

/** Chair positions [x, z, rotationDeg] around a W×D table (metres, table space). */
function chairLayout(W, D, seats) {
  const ends = W >= 2 ? 2 : 0;
  const side = (seats - ends) / 2;
  const out = [];
  for (let k = 0; k < side; k++) {
    const x = -W / 2 + (W * (k + 0.5)) / side;
    out.push([x, D / 2 + 0.16, 0], [x, -D / 2 - 0.16, 180]);
  }
  if (ends) out.push([-W / 2 - 0.16, 0, 90], [W / 2 + 0.16, 0, -90]);
  return out;
}
