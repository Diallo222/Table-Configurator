import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rbox, boxEdges, cyl, tube, roundedPath, puck, cylEdges, boxUV } from "../geo";

// Each builder turns params (mm) into part definitions (metres).
// `sig` must change whenever the geometry changes; transforms may change freely.

const mm = (v) => v / 1000;
const r3 = (v) => Math.round(v * 1e4) / 1e4;
const Y = new THREE.Vector3(0, 1, 0);
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();

/** Euler that points a +Y-aligned part from `a` to `b`, plus its length. */
function aim(a, b) {
  const d = new THREE.Vector3(...b).sub(new THREE.Vector3(...a));
  const len = d.length();
  _q.setFromUnitVectors(Y, d.normalize());
  _e.setFromQuaternion(_q);
  return { rot: [_e.x, _e.y, _e.z], len };
}

/* ------------------------------------------------------------------ ATLAS */
function atlas(p) {
  const W = mm(p.w), D = mm(p.d), H = 0.74, T = 0.032;
  const parts = [];
  const topY = H - T;
  parts.push({
    key: "top",
    slot: "top",
    sig: `top${r3(W)}x${r3(D)}`,
    make: () => rbox(W, T, D, 0.005, 3),
    edges: () => boxEdges(W, T, D),
    pos: [0, topY, 0],
    explode: [0, 0.42, 0],
  });

  if (p.base === "splay") {
    const ix = W / 2 - 0.12, iz = D / 2 - 0.1, splay = 0.045;
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const top = [sx * ix, topY, sz * iz];
      const foot = [sx * (ix + splay), 0, sz * (iz + splay)];
      const { rot, len } = aim(foot, top);
      parts.push({
        key: `leg${sx}${sz}`,
        slot: "frame",
        sig: `leg${r3(len)}`,
        make: () => cyl(0.024, 0.015, len, 28),
        threshold: 40,
        hull: "smooth",
        pos: foot,
        rot,
        explode: [sx * 0.16, -0.04, sz * 0.12],
      });
    }
    const railY = topY - 0.075;
    parts.push(
      { key: "railF", slot: "frame", sig: `rx${r3(W)}`, make: () => rbox(2 * ix - 0.04, 0.075, 0.022, 0.003), edges: () => boxEdges(2 * ix - 0.04, 0.075, 0.022), pos: [0, railY, iz], explode: [0, 0.2, 0.08] },
      { key: "railB", slot: "frame", sig: `rx${r3(W)}`, make: () => rbox(2 * ix - 0.04, 0.075, 0.022, 0.003), edges: () => boxEdges(2 * ix - 0.04, 0.075, 0.022), pos: [0, railY, -iz], explode: [0, 0.2, -0.08] },
      { key: "railL", slot: "frame", sig: `rz${r3(D)}`, make: () => rbox(0.022, 0.075, 2 * iz - 0.04, 0.003), edges: () => boxEdges(0.022, 0.075, 2 * iz - 0.04), pos: [-ix, railY, 0], explode: [-0.08, 0.2, 0] },
      { key: "railR", slot: "frame", sig: `rz${r3(D)}`, make: () => rbox(0.022, 0.075, 2 * iz - 0.04, 0.003), edges: () => boxEdges(0.022, 0.075, 2 * iz - 0.04), pos: [ix, railY, 0], explode: [0.08, 0.2, 0] }
    );
  } else if (p.base === "trestle") {
    const x = W / 2 - 0.17, pd = D - 0.2;
    for (const s of [1, -1]) {
      parts.push({
        key: `panel${s}`,
        slot: "frame",
        sig: `panel${r3(D)}`,
        make: () => rbox(0.045, topY - 0.04, pd, 0.004),
        edges: () => boxEdges(0.045, topY - 0.04, pd),
        pos: [s * x, 0.04, 0],
        explode: [s * 0.22, 0, 0],
      });
      parts.push({
        key: `foot${s}`,
        slot: "frame",
        sig: `foot${r3(D)}`,
        make: () => rbox(0.085, 0.04, pd + 0.06, 0.004),
        edges: () => boxEdges(0.085, 0.04, pd + 0.06),
        pos: [s * x, 0, 0],
        explode: [s * 0.22, -0.06, 0],
      });
    }
    parts.push({
      key: "beam",
      slot: "frame",
      sig: `beam${r3(W)}`,
      make: () => rbox(2 * x - 0.045, 0.09, 0.045, 0.004),
      edges: () => boxEdges(2 * x - 0.045, 0.09, 0.045),
      pos: [0, 0.2, 0],
      explode: [0, -0.02, 0.18],
    });
  } else {
    const x = W / 2 - 0.15, z = D / 2 - 0.08, R = 0.017;
    for (const s of [1, -1]) {
      parts.push({
        key: `arc${s}`,
        slot: "frame",
        sig: `arc${r3(D)}`,
        make: () => tube(roundedPath([[0, 0, -z], [0, topY - R, -z], [0, topY - R, z], [0, 0, z]], 0.09), R, 120, 18),
        edges: "none",
        pos: [s * x, 0, 0],
        explode: [s * 0.2, -0.02, 0],
      });
    }
    parts.push({
      key: "spine",
      slot: "frame",
      sig: `spine${r3(W)}`,
      make: () => cyl(R, R, 2 * x, 18),
      threshold: 40,
      hull: "smooth",
      pos: [-x, topY - R, 0],
      rot: [0, 0, -Math.PI / 2],
      explode: [0, 0.18, 0],
    });
  }

  return {
    parts,
    height: H,
    width: W,
    depth: D,
    explodeLift: 0.42,
    anchors: {
      top: { part: "top", pos: [W * 0.3, H, D * 0.25], label: "Top" },
      base: { part: p.base === "splay" ? "leg11" : p.base === "trestle" ? "panel1" : "arc1", pos: [W / 2 - 0.15, H * 0.35, D / 2 - 0.1], label: "Base" },
    },
    dims: [
      { param: "w", axis: "x", a: [-W / 2, H + 0.08, D / 2], b: [W / 2, H + 0.08, D / 2] },
      { param: "d", axis: "z", a: [W / 2 + 0.08, H, -D / 2], b: [W / 2 + 0.08, H, D / 2] },
    ],
  };
}

/* ------------------------------------------------------------------- MIRA */
function mira(p) {
  const W = 0.76, R = 0.017;
  const parts = [];
  const sidePath =
    p.frameStyle === "tube"
      ? [[0, 0, 0.34], [0, 0.56, 0.32], [0, 0.6, -0.2], [0, 0, -0.38]]
      : [[0, 0.58, 0.05], [0, 0.57, 0.33], [0, 0.012, 0.4], [0, 0.012, -0.38], [0, 0.6, -0.2], [0, 0.6, 0.02]];
  for (const s of [1, -1]) {
    parts.push({
      key: `side${s}`,
      slot: "frame",
      sig: `side${p.frameStyle}`,
      make: () => tube(roundedPath(sidePath, 0.08), R, 160, 18),
      edges: "none",
      pos: [s * (W / 2), 0, 0],
      explode: [s * 0.24, 0, 0],
    });
  }
  for (const [k, z, y] of [["barF", 0.24, 0.235], ["barB", -0.26, 0.235]]) {
    parts.push({
      key: k,
      slot: "frame",
      sig: "bar",
      make: () => cyl(0.014, 0.014, W, 18),
      threshold: 40,
      hull: "smooth",
      pos: [-W / 2, y, z],
      rot: [0, 0, -Math.PI / 2],
      explode: [0, -0.08, 0],
    });
  }
  parts.push({
    key: "seat",
    slot: "seat",
    sig: "seat",
    make: () => rbox(W - 0.06, 0.13, 0.58, 0.055, 6),
    edges: "none",
    pos: [0, 0.245, 0.03],
    rot: [-0.05, 0, 0],
    explode: [0, 0.3, 0.12],
  });
  parts.push({
    key: "back",
    slot: "seat",
    sig: "back",
    make: () => rbox(W - 0.06, 0.52, 0.13, 0.055, 6),
    edges: "none",
    pos: [0, 0.33, -0.25],
    rot: [-0.3, 0, 0],
    explode: [0, 0.32, -0.16],
  });
  return {
    parts,
    height: 0.86,
    width: W + 0.04,
    depth: 0.8,
    explodeLift: 0.32,
    anchors: {
      seat: { part: "seat", pos: [0.18, 0.39, 0.15], label: "Upholstery" },
      frame: { part: "side1", pos: [W / 2, 0.58, 0.1], label: "Frame" },
    },
    dims: [],
  };
}

/* ------------------------------------------------------------------ ORBIT */
const L1 = 0.42, L2 = 0.38, SHOULDER = 0.09;

export function orbitIK(reach, lift) {
  const dx = Math.max(mm(reach), 0.05), dy = mm(lift) - SHOULDER;
  let dist = Math.hypot(dx, dy);
  dist = Math.min(Math.max(dist, Math.abs(L1 - L2) + 0.02), L1 + L2 - 0.004);
  const a = Math.atan2(dy, dx);
  const b = Math.acos((L1 * L1 + dist * dist - L2 * L2) / (2 * L1 * dist));
  const t1 = a + b;
  const e = [Math.cos(t1) * L1, SHOULDER + Math.sin(t1) * L1];
  const w = [Math.cos(a) * dist, SHOULDER + Math.sin(a) * dist];
  return { e, w };
}

function shadeProfile(kind) {
  const pts = [];
  if (kind === "cone") {
    const outer = [[0.012, 0.03], [0.03, 0.02], [0.085, -0.1]];
    outer.forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
    [[0.082, -0.1], [0.027, 0.018], [0.008, 0.026]].forEach(([x, y]) => pts.push(new THREE.Vector2(x, y)));
  } else {
    const arc = (r, i) => {
      const a = 0.16 + (i / 14) * (Math.PI / 2 - 0.16);
      return new THREE.Vector2(Math.sin(a) * r, -0.05 + Math.cos(a) * r);
    };
    for (let i = 0; i <= 14; i++) pts.push(arc(0.08, i));
    for (let i = 14; i >= 0; i--) pts.push(arc(0.077, i));
  }
  return pts;
}

function orbit(p) {
  const { e, w } = orbitIK(p.reach, p.lift);
  const parts = [];
  parts.push({
    key: "base",
    slot: "body",
    sig: "base",
    make: () => puck(0.105, 0.026, 0.008),
    edges: () => cylEdges(0.105, 0.026),
    threshold: 40,
    pos: [0, 0, 0],
    explode: [0, -0.06, 0],
  });
  parts.push({
    key: "post",
    slot: "body",
    sig: "post",
    make: () => cyl(0.011, 0.011, SHOULDER - 0.026, 18),
    threshold: 40,
    hull: "smooth",
    pos: [0, 0.026, 0],
    explode: [0, 0, 0],
  });
  const s0 = [0, SHOULDER, 0], s1 = [e[0], e[1], 0], s2 = [w[0], w[1], 0];
  const a1 = aim(s0, s1), a2 = aim(s1, s2);
  parts.push({ key: "arm1", slot: "body", sig: "arm1", make: () => cyl(0.009, 0.009, L1, 16), threshold: 40, hull: "smooth", pos: s0, rot: a1.rot, explode: [0, 0.08, 0] });
  parts.push({ key: "arm2", slot: "body", sig: "arm2", make: () => cyl(0.008, 0.008, a2.len, 16), threshold: 40, hull: "smooth", pos: s1, rot: a2.rot, explode: [0.06, 0.16, 0] });
  for (const [k, at, ex] of [["j0", s0, [0, 0.04, 0]], ["j1", s1, [0, 0.12, 0]]]) {
    parts.push({
      key: k,
      slot: "body",
      sig: "joint",
      make: () => {
        const g = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 24);
        g.rotateX(Math.PI / 2);
        return boxUV(g);
      },
      threshold: 40,
      hull: "smooth",
      pos: at,
      explode: ex,
    });
  }
  // shade hangs from the wrist, tilted towards the desk
  const tilt = 0.5 + Math.max(0, mm(p.lift) - 0.4) * 0.6;
  parts.push({
    key: "shade",
    slot: "body",
    sig: `shade${p.shade}`,
    make: () => {
      const g = new THREE.LatheGeometry(shadeProfile(p.shade), 48);
      return boxUV(g);
    },
    threshold: 50,
    hull: "smooth",
    pos: s2,
    rot: [0, 0, tilt],
    explode: [0.1, 0.2, 0],
  });
  return {
    parts,
    height: Math.max(e[1], w[1]) + 0.06,
    width: Math.max(w[0], e[0]) + 0.12,
    depth: 0.24,
    explodeLift: 0.2,
    head: s2,
    tilt,
    anchors: {
      head: { part: "shade", pos: [w[0], w[1], 0], label: "Head" },
      body: { part: "arm1", pos: [e[0] * 0.5, (e[1] + SHOULDER) * 0.5, 0], label: "Body" },
    },
    dims: [],
  };
}

/* ----------------------------------------------------------------- TRIPOD */
function tripod(p) {
  const H = mm(p.h), T = 0.036;
  const parts = [];
  const seatY = H - T;
  if (p.seatShape === "round") {
    parts.push({ key: "seat", slot: "seat", sig: "seatR", make: () => puck(0.175, T, 0.009), edges: () => cylEdges(0.175, T), threshold: 40, pos: [0, seatY, 0], explode: [0, 0.3, 0] });
  } else {
    parts.push({ key: "seat", slot: "seat", sig: "seatS", make: () => rbox(0.34, T, 0.34, 0.012), edges: () => boxEdges(0.34, T, 0.34), pos: [0, seatY, 0], explode: [0, 0.3, 0] });
  }
  const rTop = 0.1, rFoot = 0.1 + H * 0.16;
  for (let i = 0; i < 3; i++) {
    const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
    const top = [Math.cos(a) * rTop, seatY, Math.sin(a) * rTop];
    const foot = [Math.cos(a) * rFoot, 0, Math.sin(a) * rFoot];
    const { rot, len } = aim(foot, top);
    parts.push({
      key: `leg${i}`,
      slot: "legs",
      sig: `leg${r3(len)}`,
      make: () => cyl(0.019, 0.013, len, 24),
      threshold: 40,
      hull: "smooth",
      pos: foot,
      rot,
      explode: [Math.cos(a) * 0.14, -0.03, Math.sin(a) * 0.14],
    });
  }
  if (H >= 0.6) {
    const ry = H * 0.36;
    const rr = rFoot + (rTop - rFoot) * (ry / seatY) - 0.002;
    parts.push({
      key: "ring",
      slot: "legs",
      sig: `ring${r3(rr)}`,
      make: () => {
        const g = new THREE.TorusGeometry(rr, 0.008, 12, 72);
        g.rotateX(Math.PI / 2);
        return boxUV(g);
      },
      edges: "none",
      pos: [0, ry, 0],
      explode: [0, 0.1, 0],
    });
  }
  return {
    parts,
    height: H,
    width: rFoot * 2 + 0.05,
    depth: rFoot * 2,
    explodeLift: 0.3,
    anchors: {
      seat: { part: "seat", pos: [0.08, H, 0.1], label: "Seat" },
      legs: { part: "leg0", pos: [0, H * 0.45, rFoot * 0.7], label: "Legs" },
    },
    dims: [{ param: "h", axis: "y", a: [rFoot + 0.12, 0, 0], b: [rFoot + 0.12, H, 0] }],
  };
}

/* ------------------------------------------------------------------- GRID */
const CELL_W = 0.4, CELL_H = 0.34, GD = 0.34, TH = 0.02, PLINTH = 0.05;
const merge = (gs) => mergeGeometries(gs.map((g) => (g.index ? g.toNonIndexed() : g)));

function grid(p) {
  const cols = Math.round(p.cols), rows = Math.round(p.rows);
  const W = cols * CELL_W + (cols + 1) * TH;
  const H = PLINTH + rows * CELL_H + (rows + 1) * TH;
  const parts = [];
  const x0 = -W / 2;
  for (let c = 0; c <= cols; c++) {
    parts.push({
      key: `post${c}`,
      slot: "body",
      sig: `post${rows}`,
      make: () => rbox(TH, H - PLINTH, GD, 0.002),
      edges: () => boxEdges(TH, H - PLINTH, GD),
      pos: [x0 + TH / 2 + c * (CELL_W + TH), PLINTH, 0],
      explode: [(c - cols / 2) * 0.08, 0, 0],
    });
  }
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const top = r === rows - 1;
      const back = p.back === "backed";
      parts.push({
        key: `cell${c}-${r}`,
        slot: "body",
        sig: `cell${top ? "t" : ""}${back ? "b" : ""}`,
        make: () => {
          const gs = [rbox(CELL_W, TH, GD, 0.002)];
          if (top) gs.push(rbox(CELL_W, TH, GD, 0.002).translate(0, CELL_H + TH, 0));
          if (back) gs.push(rbox(CELL_W, CELL_H, 0.008, 0.001).translate(0, TH, -GD / 2 + 0.004));
          return merge(gs);
        },
        edges: () => {
          const gs = [boxEdges(CELL_W, TH, GD)];
          if (top) gs.push(boxEdges(CELL_W, TH, GD).translate(0, CELL_H + TH, 0));
          if (back) gs.push(boxEdges(CELL_W, CELL_H, 0.008).translate(0, TH, -GD / 2 + 0.004));
          return merge(gs);
        },
        pos: [x0 + TH + CELL_W / 2 + c * (CELL_W + TH), PLINTH + r * (CELL_H + TH), 0],
        explode: [(c - (cols - 1) / 2) * 0.08, r * 0.1, 0.1],
        pop: true,
      });
    }
  }
  parts.push({
    key: "plinth",
    slot: "body",
    sig: `plinth${cols}`,
    make: () => rbox(W - 0.04, PLINTH, GD - 0.05, 0.002),
    edges: () => boxEdges(W - 0.04, PLINTH, GD - 0.05),
    pos: [0, 0, -0.01],
    explode: [0, -0.08, 0],
  });
  return {
    parts,
    height: H,
    width: W,
    depth: GD,
    explodeLift: rows * 0.1,
    anchors: {
      body: { part: "cell0-0", pos: [x0 + 0.2, PLINTH + 0.1, GD / 2], label: "Body" },
    },
    dims: [
      { param: "cols", axis: "x", a: [-W / 2, H + 0.08, GD / 2], b: [W / 2, H + 0.08, GD / 2], unitSize: CELL_W + TH, side: "b" },
      { param: "rows", axis: "y", a: [W / 2 + 0.1, 0, GD / 2], b: [W / 2 + 0.1, H, GD / 2], unitSize: CELL_H + TH, side: "b" },
    ],
  };
}

/* ------------------------------------------------------------------- SLAB */
function slab(p) {
  const R = mm(p.dia) / 2, H = p.height === "side" ? 0.52 : 0.38, T = 0.03;
  const parts = [];
  parts.push({
    key: "top",
    slot: "top",
    sig: `top${r3(R)}`,
    make: () => puck(R, T, 0.006, 96),
    edges: () => cylEdges(R, T, 96),
    threshold: 40,
    pos: [0, H - T, 0],
    explode: [0, 0.32, 0],
  });
  const BH = H - T;
  if (p.base === "pillar") {
    parts.push({ key: "pillar", slot: "frame", sig: `pil${r3(R)}${BH}`, make: () => cyl(R * 0.36, R * 0.4, BH, 64), threshold: 40, hull: "smooth", pos: [0, 0, 0], explode: [0, -0.04, 0] });
  } else if (p.base === "tripod") {
    for (let i = 0; i < 3; i++) {
      const a = Math.PI / 6 + (i * Math.PI * 2) / 3;
      const top = [Math.cos(a) * R * 0.5, BH, Math.sin(a) * R * 0.5];
      const foot = [Math.cos(a) * R * 0.72, 0, Math.sin(a) * R * 0.72];
      const { rot, len } = aim(foot, top);
      parts.push({ key: `rod${i}`, slot: "frame", sig: `rod${r3(len)}`, make: () => cyl(0.0095, 0.0095, len, 16), threshold: 40, hull: "smooth", pos: foot, rot, explode: [Math.cos(a) * 0.12, -0.02, Math.sin(a) * 0.12] });
    }
  } else {
    for (const [k, ry] of [["crossA", 0], ["crossB", Math.PI / 2]]) {
      parts.push({
        key: k,
        slot: "frame",
        sig: `cross${r3(R)}${BH}`,
        make: () => rbox(R * 1.25, BH, 0.024, 0.003),
        edges: () => boxEdges(R * 1.25, BH, 0.024),
        pos: [0, 0, 0],
        rot: [0, ry, 0],
        explode: ry ? [0, 0, 0] : [0, -0.06, 0],
      });
    }
  }
  return {
    parts,
    height: H,
    width: 2 * R,
    depth: 2 * R,
    explodeLift: 0.32,
    anchors: {
      top: { part: "top", pos: [R * 0.4, H, R * 0.45], label: "Top" },
      base: { part: parts[1].key, pos: [R * 0.3, BH * 0.4, R * 0.25], label: "Base" },
    },
    dims: [{ param: "dia", axis: "x", a: [-R, H + 0.08, 0], b: [R, H + 0.08, 0] }],
  };
}

export const BUILDERS = { atlas, mira, orbit, tripod, grid, slab };
