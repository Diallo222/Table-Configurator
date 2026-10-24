import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { Studio } from "./stage/Studio";
import { Entities } from "./stage/Entities";
import { CameraRig } from "./stage/CameraRig";
import { Floor } from "./stage/Floor";
import { Sync } from "./stage/Sync";
import { DimensionHandles } from "./stage/DimensionHandles";

export default function Experience({ eventSource }) {
  return (
    <Canvas
      className="webgl"
      frameloop="never"
      dpr={[1, 2]}
      eventSource={eventSource}
      eventPrefix="client"
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: false }}
      camera={{ fov: 28, near: 0.05, far: 60, position: [0, 1.1, 6] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.localClippingEnabled = false;
      }}
      aria-hidden="true"
    >
      <Sync />
      <Studio />
      <CameraRig />
      <Entities />
      <Floor />
      <DimensionHandles />
    </Canvas>
  );
}
