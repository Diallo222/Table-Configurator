import { useLayoutEffect, useRef } from "react";
import { usePage } from "./usePage";
import { TLink } from "../ui/TLink";
import { SLUGS } from "../../data/catalog";
import { rigs, cam } from "../../webgl/rigs";
import gsap from "gsap";

export default function NotFound() {
  const ref = useRef(null);
  usePage(ref, { index: "404", label: "OFF THE PLAN", title: "Off the plan — ÉTABLI" });
  useLayoutEffect(() => {
    for (const s of SLUGS) gsap.to(rigs[s], { sweep: 0, duration: 0.6, onComplete: () => (rigs[s].visible = 0) });
    gsap.to(cam, { x: 0, y: 1.1, z: 6, tx: 0, ty: 0.45, tz: 0, fov: 28, duration: 1 });
  }, []);
  return (
    <div ref={ref} className="page notfound">
      <p className="t-mono t-pencil">Error 404</p>
      <h1 className="t-display t-h2">
        Off the <em>plan.</em>
      </h1>
      <p className="t-body t-dim">This drawing doesn’t exist. Perhaps it was never measured.</p>
      <TLink to="/" className="btn btn--primary" data-cursor="link">
        <span>Back to the atelier</span>
        <span aria-hidden="true">→</span>
      </TLink>
    </div>
  );
}
