import { useEffect, useRef } from "react";
import { bindCurtain } from "../../core/transitions";

export function Curtain() {
  const panel = useRef(null);
  const line = useRef(null);
  useEffect(() => {
    bindCurtain({ panel: panel.current, line: line.current });
  }, []);
  return (
    <div className="curtain" aria-hidden="true">
      <div ref={panel} className="curtain__panel">
        <span className="curtain__mark t-display">É</span>
      </div>
      <span ref={line} className="curtain__line" />
    </div>
  );
}
