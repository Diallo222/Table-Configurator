import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";
import { cam } from "../rigs";
import { pointer } from "../../core/pointer";

const target = new THREE.Vector3();
const offset = new THREE.Vector3();
const par = { x: 0, y: 0 };

/** Camera follows the tweened `cam` rig, with damped pointer parallax and portrait-safe framing. */
export function CameraRig() {
  useFrame((state, dt) => {
    const c = state.camera;
    c.layers.enable(1);
    easing.damp(par, "x", pointer.nx * cam.parallax, 0.35, dt);
    easing.damp(par, "y", pointer.ny * cam.parallax, 0.35, dt);

    const aspect = state.size.width / state.size.height;
    const fit = cam.fit && aspect < 1.15 ? Math.min(2.4, 1.15 / aspect) : 1;

    target.set(cam.tx, cam.ty, cam.tz);
    offset.set(cam.x - cam.tx, cam.y - cam.ty, cam.z - cam.tz).multiplyScalar(fit);
    offset.applyAxisAngle(THREE.Object3D.DEFAULT_UP, cam.orbit + par.x * 0.06);
    c.position.copy(target).add(offset);
    c.position.y += par.y * 0.06 * offset.length() * 0.2;
    c.lookAt(target);

    if (Math.abs(c.fov - cam.fov) > 1e-3) {
      c.fov = cam.fov;
      c.updateProjectionMatrix();
    }
  }, -8);
  return null;
}
