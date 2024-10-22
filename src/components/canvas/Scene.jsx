import {
  OrbitControls,
  Environment,
  Lightformer,
  AccumulativeShadows,
  RandomizedLight,
} from "@react-three/drei";
import { Table } from "./Table";
import { useConfiguratorStore } from "../../store/hooks";

function Scene() {
  const { legs } = useConfiguratorStore();

  return (
    <>
      <color attach="background" args={["#e0e0e0"]} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[-10, 10, 5]}
        shadow-mapSize={[256, 256]}
        shadow-bias={-0.0001}
        castShadow
      >
        <orthographicCamera attach="shadow-camera" args={[-10, 10, -10, 10]} />
      </directionalLight>
      <Environment resolution={1024} preset="city">
        <Lightformer position={[10, 10, 10]} scale={10} intensity={4} />
        <Lightformer
          position={[10, 0, -10]}
          scale={10}
          color="red"
          intensity={6}
        />
        <Lightformer position={[-10, -10, -10]} scale={10} intensity={4} />
      </Environment>
      <Table />

      <AccumulativeShadows
        temporal
        frames={Infinity}
        alphaTest={1}
        blend={200}
        limit={1500}
        scale={25}
        position={[0, -1, 0]}
      >
        <RandomizedLight
          amount={1}
          mapSize={512}
          radius={5}
          ambient={0.5}
          position={[-10, 10, 5]}
          size={10}
          bias={0.001}
        />
      </AccumulativeShadows>
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />
    </>
  );
}

export default Scene;
