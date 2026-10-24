import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { TLink } from "../ui/TLink";
import { useUI } from "../../store/useUI";
import { useCart } from "../../store/useCart";
import { onFrame } from "../../core/clock";
import { pointer } from "../../core/pointer";
import { scroll } from "../../core/scroll";
import { sound } from "../../core/audio";
import { toggleNight } from "./night";
import { Odometer } from "../ui/Odometer";

/* ---------------- rulers (canvas, redrawn only when something moved) ---------------- */
function Rulers() {
  const top = useRef(null);
  const left = useRef(null);

  useEffect(() => {
    const css = getComputedStyle(document.documentElement);
    let last = "";
    const draw = (c, horizontal, offset, mark, scale) => {
      const dpr = Math.min(window.devicePixelRatio, 2);
      const w = horizontal ? window.innerWidth : 22;
      const h = horizontal ? 22 : window.innerHeight;
      if (c.width !== w * dpr || c.height !== h * dpr) {
        c.width = w * dpr;
        c.height = h * dpr;
      }
      const g = c.getContext("2d");
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      const ink = css.getPropertyValue("--ink-3").trim();
      const pencil = css.getPropertyValue("--pencil").trim();
      g.strokeStyle = ink;
      g.fillStyle = ink;
      g.lineWidth = 1;
      g.font = "9px 'Geist Mono Variable', monospace";
      const len = horizontal ? w : h;
      const step = 10;
      const startUnit = Math.floor(offset / step) * step;
      g.beginPath();
      for (let u = startUnit; u < offset + len + step; u += step) {
        const p = Math.round(u - offset) + 0.5;
        const major = u % 100 === 0;
        const mid = u % 50 === 0;
        const t = major ? 9 : mid ? 6 : 3;
        if (horizontal) {
          g.moveTo(p, 22);
          g.lineTo(p, 22 - t);
        } else {
          g.moveTo(22, p);
          g.lineTo(22 - t, p);
        }
        if (major && u > 0) {
          const label = String(Math.round(u * scale)).padStart(4, "0");
          if (horizontal) g.fillText(label, p + 3, 9);
          else {
            g.save();
            g.translate(9, p - 3);
            g.rotate(-Math.PI / 2);
            g.fillText(label, 0, 0);
            g.restore();
          }
        }
      }
      g.stroke();
      // cursor marker
      g.fillStyle = pencil;
      g.beginPath();
      if (horizontal) {
        g.moveTo(mark - 4, 0);
        g.lineTo(mark + 4, 0);
        g.lineTo(mark, 7);
      } else {
        g.moveTo(0, mark - 4);
        g.lineTo(0, mark + 4);
        g.lineTo(7, mark);
      }
      g.fill();
    };
    const off = onFrame(() => {
      if (!top.current) return;
      const theme = document.documentElement.dataset.theme;
      const scale = useUI.getState().ruler ?? 1;
      const key = `${pointer.x | 0},${pointer.y | 0},${scroll.y | 0},${window.innerWidth},${window.innerHeight},${theme},${scale}`;
      if (key === last) return;
      last = key;
      draw(top.current, true, 0, pointer.x, scale);
      draw(left.current, false, scroll.y, pointer.y, scale);
    });
    return off;
  }, []);

  return (
    <div className="rulers" aria-hidden="true">
      <canvas ref={top} className="ruler ruler--top" />
      <canvas ref={left} className="ruler ruler--left" />
      <span className="ruler-corner" />
    </div>
  );
}

/* ---------------- live coordinates + section meter ---------------- */
function Meter() {
  const coords = useRef(null);
  const pct = useRef(null);
  const section = useUI((s) => s.section);
  useEffect(
    () =>
      onFrame(() => {
        if (!coords.current) return;
        const s = useUI.getState().ruler ?? 1;
        const x = String(Math.round(pointer.x * s)).padStart(4, "0");
        const y = String(Math.round((pointer.y + scroll.y) * s)).padStart(4, "0");
        coords.current.textContent = `X ${x}  Y ${y}`;
        pct.current.textContent = `${String(Math.round(scroll.progress * 100)).padStart(2, "0")}%`;
      }),
    []
  );
  return (
    <>
      <div className="meter meter--left t-mono" aria-hidden="true">
        <span ref={coords}>X 0000 Y 0000</span>
      </div>
      <div className="meter meter--right t-mono" aria-hidden="true">
        <span>
          §{section.index} {section.label && `— ${section.label}`}
        </span>
        <span ref={pct} className="t-faint">
          00%
        </span>
      </div>
    </>
  );
}

function Header() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const theme = useUI((s) => s.theme);
  const soundOn = useUI((s) => s.sound);
  const { pathname } = useLocation();
  const link = (to, label, extra) => (
    <TLink to={to} className={`nav-link ${pathname.startsWith(to) && to !== "/" ? "is-active" : ""}`} data-cursor="link">
      <span className="nav-link__text">{label}</span>
      {extra}
    </TLink>
  );
  return (
    <header className="header">
      <TLink to="/" className="logo" aria-label="ÉTABLI, home" data-cursor="link">
        ÉTABLI<sup>®</sup>
      </TLink>
      <span className="header__tag t-mono t-dim">Collection 01 — Drawn to measure</span>
      <nav className="nav" aria-label="Main">
        {link("/objects", "Objects")}
        {link(
          "/commission",
          "Commission",
          <span className="nav-count t-mono" aria-label={`${count} items`}>
            (<Odometer value={String(count).padStart(2, "0")} />)
          </span>
        )}
        <button
          className="icon-btn"
          onClick={(e) => {
            sound("click");
            toggleNight(e.clientX, e.clientY);
          }}
          aria-label={theme === "night" ? "Switch to day" : "Switch to night"}
          data-cursor="link"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
            <path d="M12 5a7 7 0 0 1 0 14z" fill="currentColor" />
          </svg>
        </button>
        <button
          className={`icon-btn sound-btn ${soundOn ? "is-on" : ""}`}
          onClick={() => {
            useUI.getState().toggleSound();
            setTimeout(() => sound("chime"), 30);
          }}
          aria-pressed={soundOn}
          aria-label="Sound"
          data-cursor="link"
        >
          <span className="sound-bars" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
        </button>
      </nav>
    </header>
  );
}

export function Chrome() {
  return (
    <div className="chrome">
      <Rulers />
      <Header />
      <Meter />
      <i className="crop crop--tl" />
      <i className="crop crop--tr" />
      <i className="crop crop--bl" />
      <i className="crop crop--br" />
      <div className="grain" aria-hidden="true" />
    </div>
  );
}
