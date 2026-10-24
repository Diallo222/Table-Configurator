import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import gsap from "gsap";
import { BY_SLUG, CATALOG } from "../../data/catalog";
import { price, formatPrice } from "../../data/pricing";
import { MATERIALS } from "../../data/materials";
import { useConfig, decodeConfig, encodeConfig } from "../../store/useConfig";
import { useUI } from "../../store/useUI";
import { useCart } from "../../store/useCart";
import { usePage, whenStarted } from "./usePage";
import { lockScroll, unlockScroll } from "../../core/scroll";
import { onFrame } from "../../core/clock";
import { sound } from "../../core/audio";
import { rigs } from "../../webgl/rigs";
import { snapshot } from "../../webgl/bridge";
import { getEntity } from "../../webgl/objects/registry";
import { TLink } from "../ui/TLink";
import { Odometer } from "../ui/Odometer";
import { Controls } from "../ui/Controls";
import { enter, frame } from "./workbench/stage";
import { downloadSpecSheet } from "./workbench/specSheet";
import { useTransition } from "../../core/transitions";
import NotFound from "./NotFound";

const VIEWS = ["front", "side", "top"];

function useRotate(slug, stageRef) {
  useEffect(() => {
    const el = stageRef.current;
    const r = rigs[slug];
    let drag = null;
    let vel = 0;
    let hold = null;
    const down = (e) => {
      if (e.button !== 0) return;
      drag = { x: e.clientX, y: e.clientY, last: e.clientX, moved: false };
      // press-and-hold on the object = Plan (the lens grows to fill the screen)
      if (useUI.getState().hover === slug && useUI.getState().mode === "studio") {
        hold = setTimeout(() => {
          if (drag && !drag.moved) {
            drag.hold = true;
            useUI.getState().setMode("plan");
            frame(slug, "front", 1.1);
            sound("scratch", 0.8);
          }
        }, 380);
      }
    };
    const move = (e) => {
      if (!drag || useUI.getState().dragging) return;
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
      if (!drag.moved || useUI.getState().mode !== "studio") return;
      const dx = e.clientX - drag.last;
      drag.last = e.clientX;
      vel = dx * 0.006;
      r.ry += vel;
      useUI.getState().setCursor("rotate", `↻ ${Math.round((((r.ry * 180) / Math.PI) % 360 + 360) % 360)}°`);
    };
    const up = () => {
      clearTimeout(hold);
      if (drag?.hold) {
        useUI.getState().setMode("studio");
        frame(slug, "studio", 1.1);
      }
      if (drag?.moved) useUI.getState().setCursor("default");
      drag = null;
    };
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    const off = onFrame((t, dt) => {
      if (drag) return;
      vel *= Math.pow(0.04, dt);
      if (Math.abs(vel) > 1e-4) r.ry += vel;
    });
    return () => {
      clearTimeout(hold);
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      off();
    };
  }, [slug, stageRef]);
}

function Price({ value }) {
  const prev = useRef(value);
  const ghost = useRef(null);
  useEffect(() => {
    const d = value - prev.current;
    prev.current = value;
    if (!d || !ghost.current) return;
    ghost.current.textContent = `${d > 0 ? "+" : "−"}€${Math.abs(d)}`;
    gsap.fromTo(ghost.current, { autoAlpha: 1, y: 0 }, { autoAlpha: 0, y: -26, duration: 1.2, ease: "power2.out" });
  }, [value]);
  return (
    <div className="bench__price">
      <Odometer value={formatPrice(value)} className="t-display" />
      <span ref={ghost} className="bench__delta t-data t-accent" aria-hidden="true" />
    </div>
  );
}

export default function Workbench() {
  const { slug } = useParams();
  const spec = BY_SLUG[slug];
  if (!spec) return <NotFound />;
  return <Bench key="bench" slug={slug} spec={spec} />;
}

function Bench({ slug, spec }) {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const location = useLocation();
  const cfg = useConfig((s) => s.configs[slug]);
  const mode = useUI((s) => s.mode);
  const [view, setView] = useState(0);
  const [toast, setToast] = useState("");
  const total = price(slug, cfg);

  usePage(ref, { index: spec.no, label: spec.name.toUpperCase(), lens: 140, title: `${spec.name} ${spec.type.toLowerCase()}, made to measure | ÉTABLI` });

  // URL → config on arrival
  useLayoutEffect(() => {
    const dec = decodeConfig(slug, location.search);
    if (Object.keys(dec).length) useConfig.getState().replace(slug, { ...useConfig.getState().configs[slug], ...dec });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // config → URL (shareable)
  useEffect(() => {
    const t = setTimeout(() => {
      const q = encodeConfig(slug, cfg);
      window.history.replaceState(window.history.state, "", `/objects/${slug}${q ? `?${q}` : ""}`);
    }, 250);
    return () => clearTimeout(t);
  }, [cfg, slug]);

  // stage choreography
  useLayoutEffect(() => {
    lockScroll();
    const ui = useUI.getState();
    ui.setFocus(slug);
    ui.setMode("studio");
    setView(0);
    const flight = useTransition.getState().type === "flight";
    const stop = whenStarted(() => enter(slug, { flight }));
    gsap.fromTo(
      ref.current.querySelectorAll(".bench__reveal"),
      { autoAlpha: 0, y: 18 },
      { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "expo.out", delay: flight ? 0.5 : 0.3 }
    );
    const onResize = () => frame(slug, useUI.getState().mode === "plan" ? VIEWS[0] : "studio", 0.6);
    window.addEventListener("resize", onResize);
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      unlockScroll();
      useUI.getState().setFocus(null);
      useUI.getState().setMode("studio");
    };
  }, [slug]);

  // re-frame when the object's size changes a lot (e.g. 900 → 2400 wide)
  const sizeKey = Object.entries(spec.params)
    .filter(([, p]) => p.type === "num" || p.type === "enum")
    .map(([k]) => cfg[k])
    .join(":");
  useEffect(() => {
    if (useUI.getState().focus !== slug) return;
    const t = setTimeout(() => frame(slug, mode === "plan" ? VIEWS[view] : "studio", 1.2), 450);
    return () => clearTimeout(t);
  }, [sizeKey, slug, mode, view]);

  useRotate(slug, stageRef);

  const i = CATALOG.findIndex((c) => c.slug === slug);
  const prev = CATALOG[(i + CATALOG.length - 1) % CATALOG.length];
  const next = CATALOG[(i + 1) % CATALOG.length];

  const setMode = (m) => {
    if (m === mode) return;
    sound("click");
    useUI.getState().setMode(m);
    frame(slug, m === "plan" ? VIEWS[view] : "studio", 1.2);
  };

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  const addToCommission = async (e) => {
    const btn = e.currentTarget.getBoundingClientRect();
    const canvas = await snapshot({ width: 420, crop: 0.72 });
    const thumb = canvas.toDataURL("image/jpeg", 0.82);
    const summary = Object.entries(spec.params)
      .map(([k, p]) => (p.type === "num" ? `${p.label} ${cfg[k]}${p.unit === "mm" ? "" : p.unit}` : p.type === "material" ? MATERIALS[cfg[k]].name : p.options.find((o) => o.id === cfg[k])?.label))
      .join(", ");
    const no = useCart.getState().add({ slug, name: spec.name, type: spec.type, config: { ...cfg }, price: total, thumb, summary });
    // the snapshot flies into the header counter
    const target = document.querySelector(".nav-count")?.getBoundingClientRect();
    const img = new Image();
    img.src = thumb;
    img.className = "fly-thumb";
    document.body.appendChild(img);
    gsap.set(img, { x: window.innerWidth / 2 - 90, y: window.innerHeight / 2 - 90, scale: 0.6, rotate: -4, autoAlpha: 0 });
    gsap
      .timeline({ onComplete: () => img.remove() })
      .to(img, { autoAlpha: 1, scale: 1, rotate: 2, duration: 0.45, ease: "back.out(1.6)" })
      .add(() => sound("stamp"))
      .to(img, {
        delay: 0.15,
        x: (target?.left ?? btn.left) - 70,
        y: (target?.top ?? 20) - 60,
        scale: 0.12,
        rotate: 0,
        autoAlpha: 0.2,
        duration: 0.9,
        ease: "expo.inOut",
      });
    useUI.getState().say(`${spec.name} added to your commission, reference ${no}`);
    flash(`Added to your commission (order ${no})`);
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) await navigator.share({ title: `ÉTABLI ${spec.name}`, url });
      else await navigator.clipboard.writeText(url);
      flash("Link copied. It opens this exact configuration.");
    } catch {
      flash(url);
    }
    sound("click");
  };

  const sheet = async () => {
    sound("scratch", 0.6);
    const canvas = await snapshot({ width: 1400, crop: 0.9 });
    downloadSpecSheet({ spec, cfg, price: total, image: canvas });
    flash("Spec sheet downloaded");
  };

  return (
    <div ref={ref} className="page bench">
      <div ref={stageRef} className="bench__stage" aria-hidden="true" />

      <aside className="bench__info">
        <TLink to="/objects" type="flight" className="back-link t-data bench__reveal" data-cursor="link">
          All objects
        </TLink>
        <p className="t-data t-dim bench__reveal">
          {spec.type}
        </p>
        <h1 className="t-display bench__name bench__reveal">{spec.name}</h1>
        <p className="t-body t-dim bench__reveal">{spec.story}</p>
        <div className="bench__reveal">
          <Price value={total} />
          <dl className="facts t-data">
            <div>
              <dt>Lead time</dt>
              <dd>{spec.lead}</dd>
            </div>
            <div>
              <dt>Made</dt>
              <dd>To order, in Lyon</dd>
            </div>
          </dl>
        </div>
        <div className="bench__actions bench__reveal">
          <button className="btn btn--primary" onClick={addToCommission} data-cursor="link">
            <span>Add to commission</span>
            <span className="btn__key">{formatPrice(total)}</span>
          </button>
          <div className="bench__secondary">
            <button className="btn btn--ghost" onClick={sheet} data-cursor="link">
              Spec sheet
            </button>
            <button className="btn btn--ghost" onClick={share} data-cursor="link">
              Copy link
            </button>
          </div>
        </div>
      </aside>

      <section className="bench__panel bench__reveal" aria-label={`${spec.name} configuration`}>
        <header className="bench__panel-head t-data">
          <span>Specification</span>
          <button className="t-data link-btn" onClick={() => useConfig.getState().reset(slug)} data-cursor="link">
            Reset
          </button>
        </header>
        <Controls slug={slug} spec={spec} cfg={cfg} />
      </section>

      <div className="bench__modes bench__reveal">
        <div className="seg seg--bar" role="radiogroup" aria-label="View">
          {["studio", "plan"].map((m) => (
            <button key={m} role="radio" aria-checked={mode === m} className={`seg__opt ${mode === m ? "is-active" : ""}`} onClick={() => setMode(m)} data-cursor="link">
              {m === "studio" ? "Studio" : "Plan"}
            </button>
          ))}
        </div>
        {mode === "plan" ? (
          <div className="seg seg--bar" role="radiogroup" aria-label="Elevation">
            {VIEWS.map((v, k) => (
              <button
                key={v}
                role="radio"
                aria-checked={view === k}
                className={`seg__opt ${view === k ? "is-active" : ""}`}
                onClick={() => {
                  setView(k);
                  frame(slug, v, 1.1);
                  sound("click");
                }}
                data-cursor="link"
              >
                {v[0].toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        ) : (
          <p className="bench__hint t-data t-faint">Drag to rotate. Hold to see the drawing.{getEntity(slug).out.dims.length ? " Pull the yellow handles to resize." : ""}</p>
        )}
      </div>

      <nav className="bench__rail bench__reveal t-data" aria-label="Other objects">
        <TLink to={`/objects/${prev.slug}`} type="flight" data-cursor="link">
          ← {prev.name}
        </TLink>
        <span className="t-faint">
          {i + 1} / {CATALOG.length}
        </span>
        <TLink to={`/objects/${next.slug}`} type="flight" data-cursor="link">
          {next.name} →
        </TLink>
      </nav>

      <p className={`toast t-data ${toast ? "is-on" : ""}`} role="status">
        {toast}
      </p>
    </div>
  );
}
