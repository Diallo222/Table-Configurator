import { useMemo, useRef } from "react";
import gsap from "gsap";
import { MATERIALS } from "../../data/materials";
import { proceduralCanvas } from "../../utils/procedural";
import { useUI } from "../../store/useUI";
import { pick, slotCenter } from "../../webgl/bridge";
import { sound, haptic } from "../../core/audio";

const bgCache = new Map();
export function swatchStyle(id) {
  if (bgCache.has(id)) return bgCache.get(id);
  const m = MATERIALS[id];
  let style = { backgroundColor: m.color };
  if (m.tex?.startsWith("proc:")) {
    const url = proceduralCanvas(m.tex.slice(5)).toDataURL("image/jpeg", 0.7);
    style = { ...style, backgroundImage: `url(${url})`, backgroundSize: "220%", backgroundBlendMode: "multiply" };
  } else if (m.tex) {
    style = { ...style, backgroundImage: `url(/textures/${m.tex}_diff.webp)`, backgroundSize: m.kind === "fabric" ? "60%" : "240%", backgroundBlendMode: m.kind === "fabric" ? "soft-light" : "luminosity" };
  } else if (m.kind === "metal") {
    style = { ...style, backgroundImage: "linear-gradient(135deg, rgb(255 255 255 / .55), transparent 45%, rgb(0 0 0 / .25))" };
  }
  bgCache.set(id, style);
  return style;
}

/**
 * Material chip. Click applies (bleeding from the part's centre); drag it onto the object to apply
 * from the exact drop point (CONCEPT §4.4).
 */
export function Swatch({ id, active, slug, slot, onApply }) {
  const ref = useRef(null);
  const m = MATERIALS[id];
  const style = useMemo(() => swatchStyle(id), [id]);

  const onPointerDown = (e) => {
    if (e.button !== 0) return;
    const start = { x: e.clientX, y: e.clientY };
    let ghost = null;
    let hit = null;
    const ui = useUI.getState();

    const move = (ev) => {
      if (!ghost && Math.hypot(ev.clientX - start.x, ev.clientY - start.y) > 6) {
        ghost = ref.current.cloneNode(true);
        ghost.className = "swatch swatch--ghost";
        ghost.removeAttribute("aria-pressed");
        const r = ref.current.getBoundingClientRect();
        Object.assign(ghost.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` });
        document.body.appendChild(ghost);
        gsap.to(ghost, { scale: 1.35, duration: 0.3, ease: "back.out(2)" });
        ui.setDragging(true);
      }
      if (!ghost) return;
      const r = ref.current.getBoundingClientRect();
      gsap.set(ghost, { x: ev.clientX - r.left - r.width / 2, y: ev.clientY - r.top - r.height / 2 });
      hit = pick(ev.clientX, ev.clientY, slug);
      ui.setCursor("drag", hit ? `Drop · ${m.name}` : "Drag onto the object");
    };
    const up = (ev) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      ui.setDragging(false);
      ui.setCursor("default");
      if (!ghost) {
        onApply(id, slotCenter(slug, slot));
        return;
      }
      if (hit) {
        sound("pat");
        haptic(10);
        onApply(id, hit.slot === slot ? hit.point : slotCenter(slug, slot));
        gsap.to(ghost, { scale: 0, opacity: 0, duration: 0.35, ease: "power3.in", onComplete: () => ghost.remove() });
      } else {
        gsap.to(ghost, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "expo.out", onComplete: () => ghost.remove() });
      }
      ev.preventDefault();
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <button
      ref={ref}
      className={`swatch ${active ? "is-active" : ""}`}
      style={style}
      aria-pressed={active}
      aria-label={m.name}
      title={m.name}
      data-cursor="link"
      data-cursor-label={m.name}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onApply(id, slotCenter(slug, slot));
        }
      }}
    />
  );
}
