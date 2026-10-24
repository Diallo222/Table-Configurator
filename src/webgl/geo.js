import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// All builders work in metres. UVs are written in metres so materials tile by real size.

/** Box-projected UVs (in metres): grain runs along X on tops/fronts, along Z on the sides. */
export function boxUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal;
  const uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    let u, v;
    if (ay >= ax && ay >= az) [u, v] = [p.getX(i), p.getZ(i)];
    else if (az >= ax) [u, v] = [p.getX(i), p.getY(i)];
    else [u, v] = [p.getZ(i), p.getY(i)];
    uv[i * 2] = u;
    uv[i * 2 + 1] = v;
  }
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  return geo;
}

/** Rounded box, base at y = 0 unless `centered`. */
export function rbox(w, h, d, r = 0.004, seg = 3, centered = false) {
  const rr = Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4);
  const g = new RoundedBoxGeometry(w, h, d, seg, Math.max(rr, 1e-4));
  if (!centered) g.translate(0, h / 2, 0);
  return boxUV(g);
}

/** Sharp box used only as an edge proxy for rounded boxes. */
export function boxEdges(w, h, d, centered = false) {
  const g = new THREE.BoxGeometry(w, h, d);
  if (!centered) g.translate(0, h / 2, 0);
  return g;
}

/** Tapered cylinder along +Y from y = 0. UVs: u around (m), v along (m). Grain along length. */
export function cyl(rTop, rBot, h, seg = 32) {
  const g = new THREE.CylinderGeometry(rTop, rBot, h, seg, 1);
  g.translate(0, h / 2, 0);
  const uv = g.attributes.uv;
  const circ = Math.PI * (rTop + rBot);
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getY(i) * h, uv.getX(i) * circ);
  return g;
}

/** Tube along a curve. UVs in metres, grain along the curve. */
export function tube(curve, radius, tubular = 96, radial = 16) {
  const g = new THREE.TubeGeometry(curve, tubular, radius, radial, false);
  const len = curve.getLength();
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len, uv.getY(i) * Math.PI * 2 * radius);
  return g;
}

/** Polyline with rounded corners, as a CurvePath (for bent tubes and frames). */
export function roundedPath(points, radius) {
  const path = new THREE.CurvePath();
  const v = points.map((p) => new THREE.Vector3(...p));
  let prev = v[0].clone();
  for (let i = 1; i < v.length - 1; i++) {
    const a = v[i - 1], b = v[i], c = v[i + 1];
    const r = Math.min(radius, a.distanceTo(b) / 2, b.distanceTo(c) / 2);
    const p1 = b.clone().add(a.clone().sub(b).normalize().multiplyScalar(r));
    const p2 = b.clone().add(c.clone().sub(b).normalize().multiplyScalar(r));
    path.add(new THREE.LineCurve3(prev, p1));
    path.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  path.add(new THREE.LineCurve3(prev, v[v.length - 1]));
  return path;
}

/** Disc / puck with rounded edge, base at y = 0. */
export function puck(radius, h, r = 0.006, seg = 64) {
  const pts = [];
  const steps = 6;
  pts.push(new THREE.Vector2(0, 0));
  for (let i = 0; i <= steps; i++) {
    const a = -Math.PI / 2 + (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, r + Math.sin(a) * r));
  }
  for (let i = 0; i <= steps; i++) {
    const a = (i / steps) * (Math.PI / 2);
    pts.push(new THREE.Vector2(radius - r + Math.cos(a) * r, h - r + Math.sin(a) * r));
  }
  pts.push(new THREE.Vector2(0, h));
  const g = new THREE.LatheGeometry(pts, seg);
  return boxUV(g);
}

/** Sharp cylinder edge proxy (cap rims) for pucks. */
export function cylEdges(radius, h, seg = 64) {
  const g = new THREE.CylinderGeometry(radius, radius, h, seg, 1);
  g.translate(0, h / 2, 0);
  return g;
}

/** Copy with welded, averaged normals so an inverted hull has no cracks at hard edges. */
export function smoothNormals(geo) {
  const g = geo.clone();
  g.deleteAttribute("normal");
  g.deleteAttribute("uv");
  const m = mergeVertices(g, 1e-4);
  m.computeVertexNormals();
  g.dispose();
  return m;
}
