import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Flip } from "gsap/Flip";
import * as THREE from "three";
import { usePage } from "./usePage";
import { CATALOG, CATEGORIES, defaults } from "../../data/catalog";
import { price, formatPrice } from "../../data/pricing";
import { onFrame } from "../../core/clock";
import { pointer } from "../../core/pointer";
import { sound } from "../../core/audio";
import { useTransition } from "../../core/transitions";
import { useUI } from "../../store/useUI";
import { rigs, cam } from "../../webgl/rigs";
import { getEntity } from "../../webgl/objects/registry";
import { TLink } from "../ui/TLink";
import { Odometer } from "../ui/Odometer";
import { LINE, applyCam, applyObjects, centring, claim, mixObjects, mixPose } from "./scene";

gsap.registerPlugin(Flip);

const CAM = { dir: new THREE.Vector3(0, 0.22, 1).normalize(), dist: 9, fov: 20, ty: 0.6 };
const right = new THREE.Vector3(1, 0, 0);
const up = new THREE.Vector3().crossVectors(CAM.dir, right).normalize();

function specs(c) {
  const num = Object.values(c.params).find((p) => p.type === "num");
  const mats = new Set(Object.values(c.params).flatMap((p) => (p.type === "material" ? p.options : [])));
  return [
    num
      ? ["Range", `${num.label} ${num.min}–${num.max}${num.unit === "×" ? "" : ` ${num.unit}`}`]
      : ["Variants", Object.values(c.params).filter((p) => p.type === "enum").map((p) => p.options.map((o) => o.label).join(" / ")).join(", ")],
    ["Materials", String(mats.size)],
    ["Lead time", c.lead],
  ];
}

/** Every frame: place each object inside its card's media box (screen rect → world plane). */
function startIndex({ media, view, hover }) {
  claim();
  const fromFlight = useTransition.getState().type === "flight";
  const snap = {
    cam: { x: cam.x, y: cam.y, z: cam.z, tx: cam.tx, ty: cam.ty, tz: cam.tz, fov: cam.fov },
    objects: Object.fromEntries(
      CATALOG.filter(({ slug }) => rigs[slug].visible).map(({ slug }) => {
        const r = rigs[slug];
        return [slug, { x: r.x, y: r.y, z: r.z, rx: r.rx, ry: r.ry + r.spin, scale: r.scale, explode: r.explode, sweep: r.sweep, line: r.line }];
      })
    ),
  };
  const arrive = { k: 0 };
  gsap.to(arrive, { k: 1, duration: fromFlight ? 1.3 : 0.9, ease: "expo.inOut" });

  // drawn in, then filled, one after another
  const appear = {};
  CATALOG.forEach(({ slug }, i) => {
    const was = snap.objects[slug] && snap.objects[slug].sweep > 0.4;
    appear[slug] = { line: was ? 1 : 0, sweep: was ? 1 : 0, shown: 1, hot: 0, ry: -0.6 };
    if (!was) {
      gsap.to(appear[slug], { line: 1, duration: 0.7, delay: 0.15 + i * 0.07, ease: "power2.out" });
      gsap.to(appear[slug], { sweep: 1, duration: 1.4, delay: 0.5 + i * 0.1, ease: "power2.inOut" });
    }
  });

  const pos = new THREE.Vector3();
  const rects = {};
  const off = onFrame((t, dt) => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const tanH = Math.tan(THREE.MathUtils.degToRad(CAM.fov / 2));
    const perPx = (2 * CAM.dist * tanH) / vh;
    const target = new THREE.Vector3(0, CAM.ty, 0);
    const pose = { x: CAM.dir.x * CAM.dist, y: CAM.ty + CAM.dir.y * CAM.dist, z: CAM.dir.z * CAM.dist, tx: 0, ty: CAM.ty, tz: 0, fov: CAM.fov };
    const list = view.current === "plan";
    const k = 1 - Math.pow(0.004, dt);

    const objects = {};
    CATALOG.forEach(({ slug }, i) => {
      const el = media.current[slug];
      if (!el) return;
      const a = appear[slug];
      const visible = el.offsetParent !== null;
      a.shown += ((visible ? 1 : 0) - a.shown) * k;
      if (visible) rects[slug] = el.getBoundingClientRect();
      const r = rects[slug];
      if (!r || a.shown < 0.01) return;
      if (r.bottom < -200 || r.top > vh + 200) return; // off screen

      const hot = hover.current === slug;
      a.hot += ((hot ? 1 : 0) - a.hot) * k;
      const b = getEntity(slug).bounds();
      const W = b.max.x - b.min.x, H = b.max.y, D = b.max.z - b.min.z;
      const fillH = list ? 0.72 : 0.62, fillW = list ? 0.7 : 0.66;
      const span = list ? W : Math.max(W, D) * 0.92;
      const scale = Math.min((r.height * fillH * perPx) / H, (r.width * fillW * perPx) / span);
      const cx = r.left + r.width / 2, by = r.bottom - r.height * (list ? 0.14 : 0.12);
      pos.copy(target).addScaledVector(right, (cx - vw / 2) * perPx).addScaledVector(up, (vh / 2 - by) * perPx);

      // idle sway; turns toward the cursor on hover; plan rows face front like an elevation drawing
      const want = list ? 0 : -0.6 + Math.sin(t * 0.35 + i * 1.7) * 0.18 + a.hot * gsap.utils.clamp(-0.9, 0.9, ((pointer.x - cx) / r.width) * 1.6);
      a.ry += (want - a.ry) * (1 - Math.pow(0.02, dt));
      // objects aren't all built around their origin (the lamp reaches sideways): centre the box
      const [dx, dz] = centring(getEntity(slug), a.ry, scale);
      pos.x += dx;
      pos.z += dz;
      const sweep = a.sweep * (list ? a.hot : 1);
      objects[slug] = { x: pos.x, y: pos.y, z: pos.z, ry: a.ry, scale, sweep: sweep * a.shown, line: LINE * (list ? 0.85 : 1) * a.line * a.shown };
    });

    if (arrive.k < 1) {
      applyCam(mixPose(snap.cam, pose, arrive.k), { parallax: 0, fit: 0 });
      applyObjects(mixObjects(snap.objects, objects, arrive.k));
    } else {
      applyCam(pose, { parallax: 0, fit: 0 });
      applyObjects(objects);
    }
  });

  return () => {
    off();
    gsap.killTweensOf(arrive);
    for (const a of Object.values(appear)) gsap.killTweensOf(a);
    cam.fit = 1;
  };
}

export default function Index() {
  const ref = useRef(null);
  const media = useRef({});
  const hover = useRef(null);
  const viewRef = useRef("studio");
  const flip = useRef(null);
  const [view, setView] = useState("studio");
  const [cat, setCat] = useState("all");
  usePage(ref, { index: "02", label: "INDEX", title: "Objects | ÉTABLI" });

  useLayoutEffect(() => startIndex({ media, view: viewRef, hover }), []);

  useLayoutEffect(() => {
    gsap.fromTo(ref.current.querySelectorAll(".index__reveal"), { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.06, ease: "expo.out", delay: 0.15 });
  }, []);

  // GSAP Flip between layouts (grid ⇄ archive, and filters)
  useLayoutEffect(() => {
    viewRef.current = view;
    if (!flip.current) return;
    Flip.from(flip.current, {
      duration: 0.9,
      ease: "expo.inOut",
      stagger: 0.025,
      nested: true,
      onEnter: (els) => gsap.fromTo(els, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.6, delay: 0.3 }),
    });
    flip.current = null;
  }, [view, cat]);

  const change = (fn) => {
    flip.current = Flip.getState(ref.current.querySelectorAll(".card, .card__media, .card__name, .card__price"));
    sound("click");
    fn();
  };

  const visible = CATALOG.filter((c) => cat === "all" || c.category === cat);
  useEffect(() => {
    if (cat !== "all") useUI.getState().say(`${visible.length} objects in ${cat}`);
  }, [cat, visible.length]);

  return (
    <div ref={ref} className="page index pad">
      <header className="index__head">
        <div className="index__reveal">
          <h1 className="t-display t-h2">
            Objects
            <span className="index__count t-data t-accent" aria-label={`${visible.length} shown`}>
              <Odometer value={String(visible.length)} />
            </span>
          </h1>
        </div>
        <div className="index__tools index__reveal">
          <div className="seg seg--bar filters" role="radiogroup" aria-label="Category">
            {CATEGORIES.map((c) => {
              const n = c.id === "all" ? CATALOG.length : CATALOG.filter((x) => x.category === c.id).length;
              return (
                <button key={c.id} role="radio" aria-checked={cat === c.id} className={`seg__opt ${cat === c.id ? "is-active" : ""}`} onClick={() => cat !== c.id && change(() => setCat(c.id))} data-cursor="link">
                  {c.label}
                  <small>{n}</small>
                </button>
              );
            })}
          </div>
          <div className="seg seg--bar" role="radiogroup" aria-label="View">
            {[
              ["studio", "Studio"],
              ["plan", "Plan"],
            ].map(([id, label]) => (
              <button key={id} role="radio" aria-checked={view === id} className={`seg__opt ${view === id ? "is-active" : ""}`} onClick={() => view !== id && change(() => setView(id))} data-cursor="link">
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <ul className={`cards index__reveal ${view === "plan" ? "is-list" : ""}`}>
        {CATALOG.map((c) => {
          const shown = cat === "all" || c.category === cat;
          return (
            <li key={c.slug} className={`card ${shown ? "" : "is-hidden"}`} data-flip-id={`card-${c.slug}`}>
              <TLink
                to={`/objects/${c.slug}`}
                type="flight"
                className="card__link"
                data-cursor="link"
                data-cursor-label="Open"
                onPointerEnter={() => (hover.current = c.slug)}
                onPointerLeave={() => hover.current === c.slug && (hover.current = null)}
                onFocus={() => (hover.current = c.slug)}
                onBlur={() => hover.current === c.slug && (hover.current = null)}
                aria-label={`${c.name}, ${c.type}, from ${formatPrice(price(c.slug, defaults(c.slug)))}`}
              >
                <div className="card__top t-data">
                  <span className="card__type t-dim">{c.type}</span>
                  <span className="card__lead t-faint">{c.lead}</span>
                </div>
                <div ref={(el) => (media.current[c.slug] = el)} className="card__media" data-flip-id={`media-${c.slug}`} />
                <div className="card__bottom">
                  <h2 className="card__name t-display" data-flip-id={`name-${c.slug}`}>
                    {c.name}
                  </h2>
                  <dl className="card__specs t-data">
                    {specs(c).map(([k, v]) => (
                      <div key={k}>
                        <dt>{k}</dt>
                        <dd>{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <span className="card__price t-data" data-flip-id={`price-${c.slug}`}>
                    from {formatPrice(price(c.slug, defaults(c.slug)))}
                  </span>
                </div>
              </TLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
