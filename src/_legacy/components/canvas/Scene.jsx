import {
  OrbitControls,
  Environment,
  Lightformer,
  AccumulativeShadows,
  RandomizedLight,
  useHelper,
  ContactShadows,
  Float,
  PresentationControls,
} from "@react-three/drei";
import { Table } from "./Table";
import { useConfiguratorStore } from "../../store/hooks";
import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  EffectComposer,
  Bloom,
  SSAO,
  Vignette,
} from "@react-three/postprocessing";

const Scene = () => {
  const { legs } = useConfiguratorStore();
  const directionalLightRef = useRef();

  // Light animation
  const lightPos = useRef(new THREE.Vector3(-10, 10, 5));

  useFrame((state, delta) => {
    // Subtle movement of the light
    const time = state.clock.getElapsedTime() * 0.5;
    lightPos.current.x = Math.sin(time) * 8;
    lightPos.current.z = Math.cos(time) * 5;
    directionalLightRef.current.position.copy(lightPos.current);
  });

  // Uncomment this to visualize the light position
  // useHelper(directionalLightRef, THREE.DirectionalLightHelper, 1, "red");

  return (
    <>
      <color attach="background" args={["#f5f5f5"]} />

      {/* Ambient lighting */}
      <ambientLight intensity={0.4} />

      {/* Main directional light */}
      <directionalLight
        ref={directionalLightRef}
        position={[-10, 10, 5]}
        intensity={1.5}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0001}
        castShadow
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10]} />
      </directionalLight>

      {/* Enhanced environment lighting */}
      <Environment resolution={512} preset="apartment">
        <Lightformer position={[10, 10, 10]} scale={10} intensity={4} />
        <Lightformer
          position={[10, 0, -10]}
          scale={10}
          color="#ff9f7f"
          intensity={2.5}
        />
        <Lightformer position={[-10, -10, -10]} scale={10} intensity={4} />
        <Lightformer
          position={[-10, 10, -10]}
          scale={10}
          color="#b3d9ff"
          intensity={2}
        />
      </Environment>

      {/* Table with gentle floating animation */}
      <PresentationControls
        global
        snap
        rotation={[0, 0, 0]}
        polar={[-Math.PI / 20, Math.PI / 20]}
        azimuth={[-Math.PI / 20, Math.PI / 20]}
      >
        <Float
          speed={2}
          rotationIntensity={0.2}
          floatIntensity={0.5}
          floatingRange={[-0.05, 0.05]}
        >
          <Table />
        </Float>
      </PresentationControls>

      {/* Enhanced shadows */}
      <AccumulativeShadows
        temporal
        frames={100}
        alphaTest={0.85}
        blend={200}
        limit={1500}
        scale={25}
        position={[0, -1, 0]}
        opacity={0.8}
      >
        <RandomizedLight
          amount={8}
          mapSize={1024}
          radius={5}
          ambient={0.5}
          position={[-10, 10, 5]}
          bias={0.001}
          size={10}
        />
      </AccumulativeShadows>

      {/* Contact shadows for better grounding */}
      <ContactShadows
        position={[0, -1.01, 0]}
        opacity={0.6}
        scale={20}
        blur={2}
        far={4.5}
      />

      {/* Floor */}
      {/* <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -1.05, 0]}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#f5f5f5" />
      </mesh> */}

      {/* Post-processing effects */}
      <EffectComposer>
        <Bloom luminanceThreshold={1} intensity={0.5} levels={3} />
        <SSAO radius={0.05} intensity={15} luminanceInfluence={0.6} />
        <Vignette eskil={false} offset={0.1} darkness={0.8} />
      </EffectComposer>

      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        minDistance={4}
        maxDistance={15}
        enablePan={false}
      />
    </>
  );
};

export default Scene;
