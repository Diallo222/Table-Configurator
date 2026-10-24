import { useEffect, useRef } from "react";
import gsap from "gsap";
import { onFrame } from "../../core/clock";
import { pointer } from "../../core/pointer";
import { useUI } from "../../store/useUI";
import { draft, setLens } from "../../webgl/draft/uniforms";

// The X-ray lens (CONCEPT §4.2). Inside the circle objects render as drawings (shader side,
// via draft.uLens) and the drafting grid shows through (this DOM layer sits behind the canvas).

const lens = { x: 0, y: 0, r: 0, plan: 0, shown: 0 };

export function LensLayer() {
  const ref = useRef(null);
  useEffect(
    () =>
      onFrame(() => {
        if (!ref.current) return;
        const R = Math.max(lens.r, lens.plan);
        ref.current.style.clipPath =
          document.documentElement.classList.contains("is-plan") ? "none" : `circle(${R.toFixed(1)}px at ${lens.x.toFixed(1)}px ${lens.y.toFixed(1)}px)`;
      }),
    []
  );
  return <div ref={ref} className="lens-grid" aria-hidden="true" />;
}

export function LensRing() {
  const svg = useRef(null);
  const circle = useRef(null);
  const label = useRef(null);
  useEffect(
    () =>
      onFrame(() => {
        if (!svg.current) return;
        const R = Math.max(lens.r, lens.plan);
        const visible = R > 2 && lens.plan < 1;
        svg.current.style.opacity = visible ? 1 : 0;
        if (!visible) return;
        circle.current.setAttribute("cx", lens.x);
        circle.current.setAttribute("cy", lens.y);
        circle.current.setAttribute("r", Math.max(0, R - 0.5));
        label.current.style.transform = `translate3d(${lens.x + R * 0.72 + 8}px, ${lens.y - R * 0.72 - 14}px, 0)`;
        label.current.style.opacity = lens.r > 60 ? 1 : 0;
      }),
    []
  );
  return (
    <div className="lens-ring" aria-hidden="true">
      <svg ref={svg} width="100%" height="100%">
        <circle ref={circle} fill="none" stroke="var(--pencil)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
      </svg>
      <span ref={label} className="lens-ring__label t-mono">
        Section · 1:20
      </span>
    </div>
  );
}

export function LensController() {
  useEffect(() => {
    lens.x = pointer.x;
    lens.y = pointer.y;
    const diag = () => Math.hypot(window.innerWidth, window.innerHeight);
    let planTween = null;

    const unsub = useUI.subscribe((s, p) => {
      if (s.mode === p.mode) return;
      planTween?.kill();
      if (s.mode === "plan") {
        planTween = gsap.to(lens, {
          plan: diag(),
          duration: 0.9,
          ease: "expo.inOut",
          onComplete: () => {
            draft.uPlan.value = 1;
            document.documentElement.classList.add("is-plan");
            lens.plan = 0;
          },
        });
      } else {
        draft.uPlan.value = 0;
        document.documentElement.classList.remove("is-plan");
        lens.plan = diag();
        planTween = gsap.to(lens, { plan: 0, duration: 0.8, ease: "expo.inOut" });
      }
    });

    const off = onFrame((t, dt) => {
      const ui = useUI.getState();
      const want = ui.hover && ui.lens > 0 && !ui.dragging && ui.mode === "studio" && pointer.type !== "touch" ? ui.lens : 0;
      const k = 1 - Math.pow(0.001, dt * 2.5);
      lens.r += (want - lens.r) * (1 - Math.pow(0.0005, dt * 1.6));
      if (lens.r < 0.5 && want === 0) lens.r = 0;
      if (lens.plan <= 0) {
        lens.x += (pointer.x - lens.x) * k;
        lens.y += (pointer.y - lens.y) * k;
      }
      setLens(lens.x, lens.y, Math.max(lens.r, lens.plan));
    });
    return () => {
      unsub();
      off();
    };
  }, []);
  return null;
}
