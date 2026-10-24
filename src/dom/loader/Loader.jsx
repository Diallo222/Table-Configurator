import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { useUI, reducedMotion } from "../../store/useUI";
import { preloadMaterials } from "../../webgl/draft/textures";
import { useConfig } from "../../store/useConfig";
import { sound } from "../../core/audio";
import { MATERIALS } from "../../data/materials";

gsap.registerPlugin(DrawSVGPlugin);

const seen = (() => {
  try {
    return sessionStorage.getItem("etabli:seen") === "1";
  } catch {
    return false;
  }
})();

/** "Drafting" loader: a pencil draws the first object in elevation while the counter measures it. */
export function Loader() {
  const root = useRef(null);
  const counter = useRef(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const el = root.current;
    const paths = el.querySelectorAll(".loader__draw path, .loader__draw line");
    const dims = el.querySelectorAll(".loader__dim");
    const value = { mm: 0 };
    const fast = seen || reducedMotion;

    // everything the first frames need: fonts + materials in use on the home page
    const cfg = useConfig.getState().configs;
    const ready = Promise.all([
      document.fonts?.ready,
      preloadMaterials([...new Set(Object.values(cfg).flatMap((c) => Object.values(c)))].filter((v) => v in MATERIALS)),
      new Promise((r) => setTimeout(r, fast ? 500 : 2400)),
    ]).catch(() => {});

    const tl = gsap.timeline();
    tl.from(paths, { drawSVG: "0%", duration: fast ? 0.5 : 1.6, ease: "power2.inOut", stagger: fast ? 0.02 : 0.12 })
      .from(dims, { autoAlpha: 0, duration: 0.4, stagger: 0.1 }, fast ? 0.2 : 0.9)
      .to(value, {
        mm: 1800,
        duration: fast ? 0.6 : 2.1,
        ease: "power3.inOut",
        onUpdate: () => {
          if (counter.current) counter.current.textContent = String(Math.round(value.mm));
        },
      }, 0.2);
    if (!fast) setTimeout(() => sound("scratch", 1), 200);

    ready.then(() => {
      gsap
        .timeline({
          delay: fast ? 0 : 0.3,
          onComplete: () => {
            setDone(true);
            try {
              sessionStorage.setItem("etabli:seen", "1");
            } catch {
              /* ignore */
            }
          },
        })
        .to(el.querySelector(".loader__inner"), { autoAlpha: 0, y: -12, duration: 0.5, ease: "power2.in" })
        .add(() => useUI.getState().setPhase("intro"))
        .to(el, { clipPath: "inset(0% 0% 100% 0%)", duration: 0.9, ease: "expo.inOut" }, "-=0.1")
        .add(() => setTimeout(() => useUI.getState().setPhase("ready"), 1400));
    });
    return () => tl.kill();
  }, []);

  if (done) return null;
  return (
    <div ref={root} className="loader" role="progressbar" aria-label="Loading ÉTABLI">
      <div className="loader__inner">
        <svg className="loader__draw" viewBox="0 0 600 260" aria-hidden="true">
          {/* ATLAS in front elevation */}
          <path d="M60 70 H540 V84 H60 Z" />
          <path d="M108 84 L96 232" />
          <path d="M126 84 L118 232" />
          <path d="M492 84 L504 232" />
          <path d="M474 84 L482 232" />
          <path d="M126 98 H474" />
          <line x1="30" y1="232" x2="570" y2="232" className="loader__floor" />
          <g className="loader__dim">
            <path d="M60 40 H540 M60 32 V48 M540 32 V48" className="is-dim" />
          </g>
          <g className="loader__dim">
            <path d="M562 70 V232 M554 70 H570 M554 232 H570" className="is-dim" />
          </g>
        </svg>
        <div className="loader__meta t-data">
          <span>
            <b ref={counter}>0</b> mm
          </span>
          <span className="t-dim">Atlas, front view</span>
        </div>
        <p className="loader__word t-display">ÉTABLI</p>
      </div>
    </div>
  );
}
