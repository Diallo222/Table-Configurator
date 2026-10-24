import { useEffect, useRef } from "react";
import { onFrame } from "../../core/clock";
import { pointer } from "../../core/pointer";
import { useUI } from "../../store/useUI";

/**
 * Drafting crosshair. State comes from useUI.cursor, or from `data-cursor` / `data-cursor-label`
 * attributes on hovered DOM elements (DOM wins over WebGL).
 */
export function Cursor() {
  const el = useRef(null);
  const label = useRef(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    let x = pointer.x, y = pointer.y;
    let domState = null;

    const over = (e) => {
      const t = e.target.closest?.("[data-cursor]");
      domState = t ? { state: t.dataset.cursor, label: t.dataset.cursorLabel ?? "" } : null;
    };
    window.addEventListener("pointerover", over, { passive: true });
    const leave = () => el.current?.classList.add("is-out");
    const enter = () => el.current?.classList.remove("is-out");
    document.documentElement.addEventListener("pointerleave", leave);
    document.documentElement.addEventListener("pointerenter", enter);

    let lastState = "", lastLabel = "";
    const off = onFrame((t, dt) => {
      const k = 1 - Math.pow(0.0001, dt * 2.2);
      x += (pointer.x - x) * k;
      y += (pointer.y - y) * k;
      if (!el.current) return;
      el.current.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const ui = useUI.getState();
      const s = domState ?? (ui.dragging ? { state: "handle", label: ui.cursor.label } : ui.cursor);
      const state = s.state || "default";
      if (state !== lastState) {
        el.current.dataset.state = state;
        lastState = state;
      }
      const text = s.label || "";
      if (text !== lastLabel) {
        label.current.textContent = text;
        lastLabel = text;
      }
      el.current.classList.toggle("is-down", pointer.down);
    });
    return () => {
      off();
      window.removeEventListener("pointerover", over);
      document.documentElement.removeEventListener("pointerleave", leave);
      document.documentElement.removeEventListener("pointerenter", enter);
    };
  }, []);

  return (
    <div ref={el} className="cursor" data-state="default" aria-hidden="true">
      <span className="cursor__h" />
      <span className="cursor__v" />
      <span className="cursor__ring" />
      <span ref={label} className="cursor__label t-mono" />
    </div>
  );
}
