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

const MANIFESTO = ["Every piece", "starts as", "a drawing", "you can edit."];

const STEPS = [
  {
    title: "Drawing",
    text: "We redraw your piece at your sizes and send it back within two days.",
    art: (
      <>
        <rect x="40" y="18" width="180" height="16" />
        <path d="M58 34 L50 86 M202 34 L210 86" />
        <path d="M40 6 h180 M40 1 v10 M220 1 v10" className="is-dim" />
      </>
    ),
  },
  {
    title: "Joinery",
    text: "Mortise and tenon, dry-fitted before any glue.",
    art: (
      <>
        <path d="M150 20 h120 v56 h-120 v-18 h30 v-20 h-30 z" className="fill" />
        <g className="joint-tenon">
          <path d="M30 20 h100 v18 h30 v20 h-30 v18 h-100 z" />
        </g>
      </>
    ),
  },
  {
    title: "Finish",
    text: "Oil, wax or lacquer. Three coats, sanded between each.",
    art: (
      <>
        <rect x="30" y="30" width="240" height="40" />
        <path d="M30 30 h120 v40 h-120 z" className="fill" />
      </>
    ),
  },
  {
    title: "Delivery",
    text: "Carried in and set down by the people who made it.",
    art: (
      <>
        <path d="M60 34 l90 -22 l90 22 v46 l-90 14 l-90 -14 z M60 34 l90 14 l90 -14 M150 48 v46" />
      </>
    ),
  },
];

// numbered balloons, as on an assembly drawing
const ANNOS = [
  { no: "1", anchor: "top", title: "Top", text: (c) => `Solid ${MATERIALS[c.top].name.toLowerCase()}, 32 mm` },
  { no: "2", anchor: "base", title: "Base", text: (c) => `${BY_SLUG.atlas.params.base.options.find((o) => o.id === c.base)?.label} legs, ${MATERIALS[c.frame].name.toLowerCase()}` },
  { no: "3", anchor: "joint", title: "Rail", text: () => "Bolted M8, comes apart for moving" },
];

function Headline({ className, hidden, text }) {
  const Tag = hidden ? "div" : "h1";
  return (
    <Tag className={`hero__title ${className}`} aria-hidden={hidden || undefined}>
      <span className="t-display">{text}</span>
    </Tag>
  );
}

function CollectionMeta() {
  const i = useHome((s) => s.coll);
  const spec = CATALOG[i];
  return (
    <>
      <div className="coll__meta">
        <div className="coll__desc">
          <p className="label">{spec.type}</p>
          <p className="t-body">{spec.story}</p>
          <TLink to={`/objects/${spec.slug}`} type="flight" className="btn btn--ghost" data-cursor="link">
            Configure {spec.name}
          </TLink>
        </div>
        <div className="coll__count">
          <span className="t-data">
            {i + 1} / {CATALOG.length}
          </span>
          <div className="coll__dots" aria-hidden="true">
            {CATALOG.map((c, k) => (
              <i key={c.slug} className={k === i ? "is-on" : ""} />
            ))}
          </div>
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
      <Odometer value={String(mm)} className="t-display" />
      <span className="t-data t-dim">mm wide</span>
      <span className="measure__seats t-data t-accent">
        Seats <Odometer value={String(seats)} />
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
    dds.forEach((dd) => gsap.to(dd, { duration: 0.6, scrambleText: { text: dd.dataset.text, chars: "0123456789", speed: 0.6 } }));
  }, [card]);

  const row = (k) => (
    <div className="controls__row" key={k}>
      <h3 className="controls__label">{p[k].label}</h3>
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
      <dl ref={cardRef} className="mat__card t-data">
        <div className="is-name">
          <dt className="sr-only">Sample</dt>
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
  // the headline is the table's own size, as configured
  const [dims] = useState(() => `${atlasCfg.w}×${atlasCfg.d}`);
  usePage(ref, { index: "01", label: "HERO", lens: 130, title: "ÉTABLI, furniture made to measure" });

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

    // headline digits count up on both type layers, then settle
    const splits = [...root.querySelectorAll(".hero__title .t-display")].map((el) => new SplitText(el, { type: "chars", charsClass: "char" }));
    gsap.set(splits.flatMap((s) => s.chars), { yPercent: 105 });
    const foot = root.querySelectorAll(".hero__foot > *");
    gsap.set(foot, { autoAlpha: 0, y: 14 });

    const stop = whenStarted((handoff) => {
      dir.startIntro(handoff);
      const delay = handoff ? 0.8 : 0.3;
      splits.forEach((s) => gsap.to(s.chars, { yPercent: 0, duration: 0.9, ease: "expo.out", stagger: 0.05, delay }));
      gsap.to(foot, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expo.out", delay: delay + 0.5 });
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
      {/* 1. hero: the headline is the table's measurements, the table stands in it */}
      <section ref={sec(0)} className="hero" aria-label="Introduction">
        <Headline className="layer-back" text={dims} />
        <Headline className="hero__title--front" hidden text={dims} />
        <div className="hero__foot">
          <div className="hero__lede">
            <p className="label">Atlas dining table, {atlasCfg.w} × {atlasCfg.d} mm</p>
            <p className="t-body t-dim">Six pieces of furniture, built in Lyon to the millimetre you choose.</p>
          </div>
          <TLink to="/objects" className="btn btn--ghost" data-cursor="link">
            See all six
          </TLink>
        </div>
      </section>

      {/* 2. exploded view */}
      <section ref={sec(1)} className="line-sec" data-sticky aria-label="How it goes together">
        <div className="sticky">
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
              <div key={a.no} className="anno" data-anchor={a.anchor}>
                <span className="anno__no t-data">{a.no}</span>
                <span className="anno__text">
                  <b>{a.title}</b>
                  <span className="t-data t-dim">{a.text(atlasCfg)}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. the collection on a rail */}
      <section ref={sec(2)} className="coll-sec" data-sticky aria-label="The collection">
        <div className="sticky">
          <CollectionMeta />
        </div>
      </section>

      {/* 4. stretch the table in plan view */}
      <section ref={sec(3)} className="measure-sec" data-sticky aria-label="Sizes">
        <div className="sticky">
          <div className="chairs" aria-hidden="true">
            {Array.from({ length: 10 }, (_, i) => (
              <svg key={i} ref={(el) => (chairs.current[i] = el)} className="chair" viewBox="0 0 40 40">
                <path d="M12 8 H28 V26 H12 Z M10 31 H30" pathLength="1" />
              </svg>
            ))}
          </div>
          <div className="measure__copy">
            <h2 className="t-display t-h3">Any width from 900 to 2400&nbsp;mm</h2>
            <p className="t-body t-dim">Keep scrolling to stretch Atlas. The seat count follows the length.</p>
          </div>
          <MeasureRead />
        </div>
      </section>

      {/* 5. materials */}
      <section ref={sec(4)} className="mat-sec pad" aria-label="Materials">
        <div className="mat__panel">
          <h2 className="t-display t-h2">Try the materials</h2>
          <p className="t-body t-dim">Drag a sample onto the stool, or click it. The finish spreads from where it lands.</p>
          <MaterialTray />
        </div>
      </section>

      {/* 6. how it's made */}
      <section ref={sec(5)} className="atelier-sec pad" aria-label="How it is made">
        <div className="atelier__head">
          <h2 className="t-display t-h2">Six to eight weeks</h2>
          <p className="t-body t-dim">From your measurements to your floor, in four steps.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <li key={s.title} className="step">
              <svg viewBox="0 0 300 96" aria-hidden="true">
                {s.art}
              </svg>
              <h3 className="step__title">
                <span className="t-data">{i + 1}</span> {s.title}
              </h3>
              <p className="t-body t-dim">{s.text}</p>
            </li>
          ))}
        </ol>
        <div className="atelier__switch">
          <button className="btn btn--ghost" onClick={lamp} data-cursor="link">
            {theme === "night" ? "Lamp off" : "Lamp on"}
          </button>
          <span className="t-data t-faint">Orbit desk lamp, 2900 K</span>
        </div>
      </section>

      {/* 7. footer */}
      <section ref={sec(6)} className="foot-sec pad" aria-label="Footer">
        <div className="foot__cta">
          <h2 className="t-display t-h2">Choose one. Set its size.</h2>
          <TLink to="/objects" className="btn btn--primary" data-cursor="link">
            <span>Browse the objects</span>
            <span className="btn__key">6</span>
          </TLink>
        </div>
        <p className="wordmark t-display" aria-label="ÉTABLI">
          {"ÉTABLI".split("").map((c, i) => (
            <span key={i} aria-hidden="true">
              {c}
            </span>
          ))}
        </p>
        <div className="foot__base t-data t-dim">
          <span>ÉTABLI is a fictional furniture workshop.</span>
          <span>Textures by Poly Haven, CC0.</span>
          <button className="link-btn t-data" onClick={backToTop} data-cursor="link">
            Back to top
          </button>
        </div>
      </section>
    </div>
  );
}
