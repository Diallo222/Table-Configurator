import { Environment, Lightformer } from "@react-three/drei";

/** Art-directed studio light: a big soft key, a strip rim and a warm floor bounce. Rendered once. */
export function Studio() {
  return (
    <>
      <ambientLight intensity={0.15} />
      <directionalLight position={[-3, 5, 4]} intensity={0.9} color="#fff6ea" />
      <Environment resolution={256} frames={1} environmentIntensity={1}>
        <color attach="background" args={["#d9d4c8"]} />
        <Lightformer form="rect" intensity={3.2} position={[-3, 4, 3]} scale={[6, 4, 1]} target={[0, 0, 0]} color="#fffaf2" />
        <Lightformer form="rect" intensity={2.2} position={[4, 2, -3]} scale={[1.2, 6, 1]} target={[0, 0, 0]} color="#ffffff" />
        <Lightformer form="rect" intensity={0.9} position={[3, 0.5, 4]} scale={[4, 2, 1]} target={[0, 0, 0]} color="#ffe9d2" />
        <Lightformer form="rect" intensity={0.6} position={[0, -3, 0]} rotation-x={Math.PI / 2} scale={[10, 10, 1]} color="#e9dcc6" />
        <Lightformer form="ring" intensity={1.4} position={[0, 6, 0]} rotation-x={Math.PI / 2} scale={3} color="#ffffff" />
      </Environment>
    </>
  );
}
