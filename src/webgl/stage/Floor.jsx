import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { stage } from "../rigs";
import { useUI } from "../../store/useUI";

/** Soft contact shadow on the (invisible) paper floor. Opacity follows stage.shadow. */
export function Floor() {
  const ref = useRef();
  useFrame(() => {
    const mesh = ref.current?.children?.[0];
    if (!mesh) return;
    const night = useUI.getState().theme === "night";
    mesh.material.opacity = stage.shadow * (night ? 0.75 : 0.5);
    ref.current.position.y = stage.floorY + 0.0005;
    ref.current.visible = stage.shadow > 0.01;
  });
  return <ContactShadows ref={ref} frames={Infinity} resolution={512} scale={7} blur={2.6} far={1.4} color="#2b2318" />;
}
