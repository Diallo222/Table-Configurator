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
      const markColor = css.getPropertyValue("--ink").trim();
      g.strokeStyle = ink;
      g.fillStyle = ink;
      g.lineWidth = 1;
      g.font = "500 9px 'Archivo Variable', sans-serif";
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
          const label = String(Math.round(u * scale));
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
      g.fillStyle = markColor;
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

/* ---------------- scroll progress as a strip of tape ---------------- */
function Progress() {
  const ref = useRef(null);
  useEffect(
    () =>
      onFrame(() => {
        if (ref.current) ref.current.style.transform = `scaleX(${scroll.progress.toFixed(4)})`;
      }),
    []
  );
  return <span ref={ref} className="progress" aria-hidden="true" />;
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
        ÉTABLI
      </TLink>
      <nav className="nav" aria-label="Main">
        {link("/objects", "Objects")}
        {link(
          "/commission",
          "Commission",
          <span className={`nav-count t-data ${count ? "is-full" : ""}`} aria-label={`${count} items`}>
            <Odometer value={String(count)} />
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
      <Progress />
    </div>
  );
}
