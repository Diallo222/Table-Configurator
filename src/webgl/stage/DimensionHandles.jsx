import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { LineSegments2 } from "three/examples/jsm/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/examples/jsm/lines/LineSegmentsGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";
import { getEntity } from "../objects/registry";
import { useUI } from "../../store/useUI";
import { useConfig } from "../../store/useConfig";
import { BY_SLUG } from "../../data/catalog";
import { haptic, sound } from "../../core/audio";
import { capture } from "../bridge";

const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3(), D = new THREE.Vector3();
const N = new THREE.Vector3(), W = new THREE.Vector3();

/** Closest-point parameter on line (p + s·a) to ray (o + t·d). */
function rayAxis(o, d, p, a) {
  W.copy(o).sub(p);
  const aa = a.dot(a), ab = a.dot(d), dd = d.dot(d), aw = a.dot(W), dw = d.dot(W);
  const den = aa * dd - ab * ab;
  return Math.abs(den) < 1e-6 ? null : (ab * dw - dd * aw) / den;
}

function Dimension({ slug, index }) {
  const entity = getEntity(slug);
  const spec = BY_SLUG[slug];
  const handle = useRef();
  const label = useRef(0);
  const drag = useRef(null);
  const [hot, setHot] = useState(false);

  const { line, material } = useMemo(() => {
    const material = new LineMaterial({ color: "#ff4a1c", linewidth: 1.25, toneMapped: false, transparent: true, depthTest: false });
    const line = new LineSegments2(new LineSegmentsGeometry(), material);
    line.renderOrder = 10;
    line.layers.set(1);
    return { line, material };
  }, []);

  useFrame((state) => {
    const dim = entity.out.dims[index];
    const ui = useUI.getState();
    const show = dim && !capture.on && ui.focus === slug && ui.mode === "studio" && entity.rig.sweep > 0.95 && entity.rig.explode < 0.02;
    line.visible = !!show;
    if (handle.current) handle.current.visible = !!show;
    if (!show) return;

    A.set(...dim.a);
    B.set(...dim.b);
    entity.root.localToWorld(A);
    entity.root.localToWorld(B);
    // extension ticks perpendicular to the dimension, facing the camera
    N.copy(B).sub(A).normalize();
    D.copy(state.camera.position).sub(A).cross(N).normalize().multiplyScalar(0.035);
    const pts = [
      A.x, A.y, A.z, B.x, B.y, B.z,
      A.x - D.x, A.y - D.y, A.z - D.z, A.x + D.x, A.y + D.y, A.z + D.z,
      B.x - D.x, B.y - D.y, B.z - D.z, B.x + D.x, B.y + D.y, B.z + D.z,
    ];
    line.geometry.setPositions(pts);
    material.resolution.set(state.size.width, state.size.height);
    material.opacity = hot ? 1 : 0.85;
    handle.current.position.copy(B);
    const s = state.camera.position.distanceTo(B) * 0.012;
    handle.current.scale.setScalar(s);

    // live mm label for the cursor while hovering / dragging
    const value = useConfig.getState().configs[slug][dim.param];
    if ((hot || drag.current) && value !== label.current) {
      label.current = value;
      const p = spec.params[dim.param];
      ui.setCursor("handle", `${p.label} ${Math.round(value)}${p.unit === "mm" ? " mm" : ` ${p.unit}`}`);
    }
  });

  const onDown = (e) => {
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    const dim = entity.out.dims[index];
    drag.current = { dim };
    useUI.getState().setDragging(true);
  };
  const onMove = (e) => {
    if (!drag.current) return;
    e.stopPropagation();
    const { dim } = drag.current;
    const p = spec.params[dim.param];
    A.set(...dim.a);
    B.set(...dim.b);
    entity.root.localToWorld(A);
    entity.root.localToWorld(B);
    N.copy(B).sub(A);
    const len0 = N.length();
    N.normalize();
    const sym = dim.axis !== "y";
    C.copy(A).add(B).multiplyScalar(0.5);
    const origin = sym ? C : A;
    const s = rayAxis(e.ray.origin, e.ray.direction, origin, N);
    if (s === null) return;
    let len = (sym ? 2 * s : s) / entity.rig.scale;
    if (!Number.isFinite(len) || len0 <= 0) return;
    let v = dim.unitSize ? Math.round((len - 0.02) / dim.unitSize) : Math.round((len * 1000) / p.step) * p.step;
    v = Math.min(p.max, Math.max(p.min, v));
    const cur = useConfig.getState().configs[slug][dim.param];
    if (v !== cur) {
      useConfig.getState().set(slug, dim.param, v);
      sound("tick", (v - p.min) / (p.max - p.min));
      haptic(4);
    }
  };
  const onUp = (e) => {
    if (!drag.current) return;
    e.target.releasePointerCapture?.(e.pointerId);
    drag.current = null;
    useUI.getState().setDragging(false);
    const dim = entity.out.dims[index];
    const p = spec.params[dim.param];
    const v = useConfig.getState().configs[slug][dim.param];
    useUI.getState().say(`${p.label} ${v} ${p.unit === "mm" ? "millimetres" : ""}`);
  };

  return (
    <>
      <primitive object={line} />
      <group ref={handle}>
        <mesh ref={(m) => m?.layers.set(1)} renderOrder={11}>
          <sphereGeometry args={[0.55, 20, 14]} />
          <meshBasicMaterial color="#ff4a1c" toneMapped={false} depthTest={false} transparent />
        </mesh>
        <mesh
          onPointerOver={(e) => {
            e.stopPropagation();
            setHot(true);
            label.current = null;
          }}
          onPointerOut={() => {
            setHot(false);
            if (!drag.current) useUI.getState().setCursor("default");
          }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
        >
          <sphereGeometry args={[2.4, 12, 8]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
    </>
  );
}

export function DimensionHandles() {
  const focus = useUI((s) => s.focus);
  if (!focus) return null;
  const dims = BY_SLUG[focus] ? getEntity(focus).spec.build(getEntity(focus).params).dims : [];
  return dims.map((_, i) => <Dimension key={`${focus}-${i}`} slug={focus} index={i} />);
}
