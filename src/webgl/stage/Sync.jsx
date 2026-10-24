import { useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { draft, setInk } from "../draft/uniforms";
import { useUI } from "../../store/useUI";
import { bindThree } from "../bridge";

/** Keeps the global draft uniforms in step with the renderer and the theme. */
export function Sync() {
  const gl = useThree((s) => s.gl);

  useEffect(() => {
    setInk(useUI.getState().theme);
    return useUI.subscribe((s, prev) => s.theme !== prev.theme && setInk(s.theme));
  }, []);

  useFrame((state) => {
    bindThree(state);
    draft.uTime.value = state.clock.elapsedTime;
    draft.uPx.value = state.viewport.dpr;
    gl.getDrawingBufferSize(draft.uRes.value);
  }, -10);

  return null;
}
