import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { usePage, whenStarted } from "./usePage";
import { startHome, useHome } from "./home/director";
import { CATALOG, BY_SLUG } from "../../data/catalog";
import { MATERIALS } from "../../data/materials";
import { useConfig } from "../../store/useConfig";
import { useUI, reducedMotion } from "../../store/useUI";
import { lenis } from "../../core/scroll";
import { go } from "../../core/transitions";
import { sound } from "../../core/audio";
import { project } from "../../webgl/bridge";
import { getEntity } from "../../webgl/objects/registry";
import { toggleNight } from "../chrome/night";
import { TLink } from "../ui/TLink";
import { Odometer } from "../ui/Odometer";
import { Swatch } from "../ui/Swatch";
import * as THREE from "three";

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

const MANIFESTO = ["Every object", "begins as", "a line. Then", <>it gains <em>matter.</em></>];

const STEPS = [
  {
    title: "Sketch",
    text: "Your measurements become a drawing, checked by hand within two days.",
    art: (
      <>
        <rect x="40" y="18" width="180" height="16" />
        <path d="M58 34 L50 86 M202 34 L210 86" />
        <path d="M222 10 l36 -6 M40 6 h180 M40 2 v8 M220 2 v8" className="is-pencil" />
      </>
    ),
  },
  {
    title: "Joinery",
    text: "Mortise and tenon, dry-fitted first. No metal where wood will do.",
    art: (
      <>
        <path d="M150 20 h120 v56 h-120 v-18 h30 v-20 h-30 z" className="fill" />
        <g className="joint-tenon">
          <path d="M30 20 h100 v18 h30 v20 h-30 v18 h-100 z" />
        </g>
        <path d="M150 12 v-6 M180 12 v-6 M150 9 h30" className="is-pencil" />
      </>
    ),
  },
  {
    title: "Finish",
    text: "Oiled, waxed or lacquered in three coats, sanded between each.",
    art: (
      <>
        <rect x="30" y="30" width="240" height="40" />
        <path d="M40 46 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0" className="is-pencil" />
        <path d="M40 58 q20 -8 40 0 t40 0 t40 0 t40 0 t40 0" />
      </>
    ),
  },
  {
    title: "Delivered",
    text: "Crated, carried in and placed. We take the crate back with us.",
    art: (
      <>
        <path d="M60 34 l90 -22 l90 22 v46 l-90 14 l-90 -14 z M60 34 l90 14 l90 -14 M150 48 v46" />
        <path d="M95 26 l90 18" className="is-pencil" />
      </>
    ),
  },
];

const ANNOS = [
  { no: "01", anchor: "top", title: "Top", text: (c) => `Solid ${MATERIALS[c.top].name.toLowerCase()}, 32 mm` },
  { no: "02", anchor: "base", title: "Base", text: (c) => `${BY_SLUG.atlas.params.base.options.find((o) => o.id === c.base)?.label} in ${MATERIALS[c.frame].name.toLowerCase()}` },
  { no: "03", anchor: "joint", title: "Joint", text: () => "Dry-fit, bolted M8, no glue" },
];

function Headline({ className, hidden }) {
  const Tag = hidden ? "div" : "h1";
  return (
    <Tag className={`hero__title ${className}`} aria-hidden={hidden || undefined}>
      <span className="t-display">
        Drawn to <em>measure.</em>
      </span>
    </Tag>
  );
}

function CollectionMeta() {
  const i = useHome((s) => s.coll);
  const spec = CATALOG[i];
  return (
    <>
      <p className="sec-tag kicker t-mono">
        <span>§03 — Collection 01</span>
        <span className="t-dim">
          {spec.no} / 0{CATALOG.length}
        </span>
      </p>
      <div className="coll__meta">
        <div className="coll__desc">
          <p className="t-mono t-dim">
            N°{spec.no} — {spec.type}
          </p>
          <p className="t-body">{spec.story}</p>
          <TLink to={`/objects/${spec.slug}`} type="flight" className="btn btn--ghost" data-cursor="link">
            Configure {spec.name} →
          </TLink>
        </div>
        <div className="coll__dots" aria-hidden="true">
          {CATALOG.map((c, k) => (
            <i key={c.slug} className={k === i ? "is-on" : ""} />
          ))}
        </div>
      </div>
      <button
        className="coll__hit"
        aria-label={`Open ${spec.name}`}
        data-cursor="link"
        data-cursor-label={`Open ${spec.name}`}
        onClick={() => go(`/objects/${spec.slug}`, { type: "flight" })}
      />
      <div className="coll__name layer-back" aria-hidden="true">
        <div className="coll__roll t-display">
          <div className="coll__strip" style={{ transform: `translateY(${(-i * 100) / CATALOG.length}%)` }}>
            {CATALOG.map((c) => (
              <span key={c.slug}>{c.name}</span>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function MeasureRead() {
  const mm = useHome((s) => s.mm);
  const seats = useHome((s) => s.seats);
  return (
    <div className="measure__read">
      <Odometer value={String(mm).padStart(4, "0")} className="t-display" />
      <span className="t-mono t-dim">mm — width</span>
      <span className="measure__seats t-mono">
        <span className="t-pencil">
          <Odometer value={String(seats).padStart(2, "0")} />
        </span>{" "}
        seats
      </span>
    </div>
  );
}

function MaterialTray() {
  const cfg = useConfig((s) => s.configs.tripod);
  const [card, setCard] = useState(cfg.seat);
  const cardRef = useRef(null);
  const m = MATERIALS[card];
  const p = BY_SLUG.tripod.params;

  useEffect(() => {
    if (!cardRef.current || reducedMotion) return;
    const dds = cardRef.current.querySelectorAll("dd[data-text]");
    dds.forEach((dd) => gsap.to(dd, { duration: 0.7, scrambleText: { text: dd.dataset.text, chars: "0123456789ABCDEFX/", speed: 0.6 } }));
  }, [card]);

  const row = (k) => (
    <div className="controls__row" key={k}>
      <h3 className="controls__label t-mono">{p[k].label}</h3>
      <div className="swatches">
        {p[k].options.map((id) => (
          <Swatch
            key={id}
            id={id}
            slug="tripod"
            slot={p[k].slot}
            active={cfg[k] === id}
            onApply={(mid, point) => {
              useConfig.getState().set("tripod", k, mid, point);
              useUI.getState().say(`Tripod ${p[k].label.toLowerCase()}: ${MATERIALS[mid].name}`);
              setCard(mid);
            }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="mat__tray">
      {row("seat")}
      {row("legs")}
      <dl ref={cardRef} className="mat__card t-mono">
        <div className="is-name">
          <dt>Sample</dt>
          <dd>{m.name}</dd>
        </div>
        <div>
          <dt>Origin</dt>
          <dd data-text={m.card.origin}>{m.card.origin}</dd>
        </div>
        <div>
          <dt>Finish</dt>
          <dd data-text={m.card.note}>{m.card.note}</dd>
        </div>
        <div>
          <dt>{m.card.density ? "Density" : "Kind"}</dt>
          <dd data-text={m.card.density ?? m.kind}>{m.card.density ?? m.kind}</dd>
        </div>
      </dl>
    </div>
  );
}

const bulbPoint = () => {
  const b = getEntity("orbit").extra.bulb;
  return b ? project(b.getWorldPosition(new THREE.Vector3())) : null;
};

export default function Home() {
  const ref = useRef(null);
  const secs = useRef([]);
  const annos = useRef(null);
  const chairs = useRef([]);
  const theme = useUI((s) => s.theme);
  const atlasCfg = useConfig((s) => s.configs.atlas);
  usePage(ref, { index: "01", label: "HERO", lens: 130, title: "ÉTABLI — Drawn to measure" });

  useLayoutEffect(() => {
    const root = ref.current;
    const dir = startHome({
      sections: secs.current,
      annos: {
        items: [...annos.current.querySelectorAll(".anno")],
        dots: [...annos.current.querySelectorAll("circle")],
        lines: [...annos.current.querySelectorAll("line")],
      },
      chairs: chairs.current,
    });

    // headline: characters arrive blurred, in random order, on both type layers
    const splits = [...root.querySelectorAll(".hero__title .t-display")].map((el) => new SplitText(el, { type: "chars", charsClass: "char" }));
    const n = splits[0].chars.length;
    const order = gsap.utils.shuffle([...Array(n).keys()]);
    gsap.set(splits.flatMap((s) => s.chars), { autoAlpha: 0 });
    const foot = root.querySelectorAll(".hero__foot > *");
    gsap.set(foot, { autoAlpha: 0, y: 14 });

    const stop = whenStarted((handoff) => {
      dir.startIntro(handoff);
      const delay = handoff ? 0.9 : 0.35;
      splits.forEach((s) =>
        gsap.fromTo(
          s.chars,
          { autoAlpha: 0, filter: "blur(14px)", yPercent: 18 },
          { autoAlpha: 1, filter: "blur(0px)", yPercent: 0, duration: 1.1, ease: "expo.out", delay: (i) => delay + order[i % n] * 0.045, clearProps: "filter" }
        )
      );
      gsap.to(foot, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: "expo.out", delay: delay + 0.6 });
    });

    return () => {
      stop();
      dir.stop();
      splits.forEach((s) => s.revert());
    };
  }, []);

  const sec = (i) => (el) => (secs.current[i] = el);

  const backToTop = () => {
    sound("scratch", 1.4);
    lenis ? lenis.scrollTo(0, { duration: 2.2, easing: (t) => 1 - Math.pow(1 - t, 4) }) : window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lamp = (e) => {
    sound("click");
    const p = bulbPoint();
    toggleNight(p?.x ?? e.clientX, p?.y ?? e.clientY);
  };

  return (
    <div ref={ref} className="page home">
      {/* §01 hero */}
      <section ref={sec(0)} className="hero" aria-label="Introduction">
        <Headline className="layer-back" />
        <Headline className="hero__title--front" hidden />
        <div className="hero__foot">
          <p className="hero__lede t-body">Six objects, made to the millimetre in Lyon. Pick one, pull its edges, choose what it’s made of.</p>
          <div className="scroll-hint t-mono t-faint" aria-hidden="true">
            <i />
            Scroll
          </div>
          <TLink to="/objects" className="btn btn--ghost" data-cursor="link">
            Collection 01 →
          </TLink>
        </div>
      </section>

      {/* §02 the line */}
      <section ref={sec(1)} className="line-sec" data-sticky aria-label="The line">
        <div className="sticky">
          <p className="sec-tag kicker t-mono">
            <span>§02 — The line</span>
          </p>
          <h2 className="manifesto t-display">
            {MANIFESTO.map((l, i) => (
              <span key={i} className="reveal-line" style={{ "--at": 0.06 + i * 0.08 }}>
                <span>{l}</span>
              </span>
            ))}
          </h2>
          <div ref={annos} className="annos" aria-hidden="true">
            <svg>
              {ANNOS.map((a) => (
                <g key={a.no}>
                  <line x1="0" y1="0" x2="0" y2="0" />
                  <circle cx="0" cy="0" r="0" />
                </g>
              ))}
            </svg>
            {ANNOS.map((a) => (
              <div key={a.no} className="anno t-mono" data-anchor={a.anchor}>
                <span>
                  <span className="t-pencil">{a.no}</span> {a.title}
                </span>
                <span className="t-dim">{a.text(atlasCfg)}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* §03 collection */}
      <section ref={sec(2)} className="coll-sec" data-sticky aria-label="Collection 01">
        <div className="sticky">
          <CollectionMeta />
        </div>
      </section>

      {/* §04 measure */}
      <section ref={sec(3)} className="measure-sec" data-sticky aria-label="Measure">
        <div className="sticky">
          <p className="sec-tag kicker t-mono">
            <span>§04 — Measure</span>
            <span className="t-dim">Plan view · 1:40</span>
          </p>
          <div className="chairs" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <svg key={i} ref={(el) => (chairs.current[i] = el)} className="chair" viewBox="0 0 40 40">
                <path d="M12 8 H28 V26 H12 Z M10 31 H30" pathLength="1" />
              </svg>
            ))}
          </div>
          <div className="measure__copy">
            <h2 className="t-display t-h3">
              We don’t do sizes. We do <em>measurements.</em>
            </h2>
            <p className="t-body t-dim">Keep scrolling: Atlas stretches from 900 to 2&nbsp;400&nbsp;mm, and the room around it follows.</p>
          </div>
          <MeasureRead />
        </div>
      </section>

      {/* §05 materials */}
      <section ref={sec(4)} className="mat-sec pad" aria-label="Material library">
        <div className="mat__panel">
          <p className="kicker t-mono">
            <span>§05 — Material library</span>
          </p>
          <h2 className="t-display t-h2">
            Drop it <em>on.</em>
          </h2>
          <p className="t-body t-dim">Drag a sample onto the stool. The finish soaks in from wherever it lands.</p>
          <MaterialTray />
        </div>
      </section>

      {/* §06 atelier */}
      <section ref={sec(5)} className="atelier-sec pad" aria-label="The atelier">
        <div className="atelier__head">
          <p className="kicker t-mono">
            <span>§06 — The atelier</span>
          </p>
          <h2 className="t-display t-h2">
            Made slowly, <em>in Lyon.</em>
          </h2>
          <p className="t-body t-dim">Four steps between your measurements and your door.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="t-mono t-pencil">0{i + 1}</span>
              <svg viewBox="0 0 300 96" aria-hidden="true">
                {s.art}
              </svg>
              <h3 className="t-display t-h3">{s.title}</h3>
              <p className="t-body t-dim">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="atelier__switch">
          <button className="btn btn--ghost" onClick={lamp} data-cursor="link">
            {theme === "night" ? "Lights off ○" : "Switch it on ●"}
          </button>
          <span className="t-mono t-faint">N°03 Orbit — 2 900 K</span>
        </div>
      </section>

      {/* §07 footer */}
      <section ref={sec(6)} className="foot-sec pad" aria-label="Footer">
        <div className="foot__cta">
          <h2 className="t-display t-h2">
            Start with <em>a line.</em>
          </h2>
          <TLink to="/objects" className="btn btn--primary" data-cursor="link">
            <span>Start a commission</span>
            <span aria-hidden="true">→</span>
          </TLink>
        </div>
        <p className="wordmark t-display" aria-label="ÉTABLI">
          {"ÉTABLI".split("").map((c, i) => (
            <span key={i} aria-hidden="true">
              {c}
            </span>
          ))}
        </p>
        <div className="foot__base t-mono t-dim">
          <span>© 2026 ÉTABLI — a fictional atelier</span>
          <span>Textures: Poly Haven, CC0</span>
          <button className="link-btn t-mono" onClick={backToTop} data-cursor="link">
            Back to top ↑
          </button>
        </div>
      </section>
    </div>
  );
}
