import { lazy, Suspense, useEffect, useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { initScroll } from "../core/scroll";
import { startClock } from "../core/clock";
import { bindNavigate } from "../core/transitions";
import { useUI } from "../store/useUI";
import { Chrome } from "../dom/chrome/Chrome";
import { Cursor } from "../dom/chrome/Cursor";
import { LensLayer, LensRing, LensController } from "../dom/chrome/Lens";
import { Curtain } from "../dom/chrome/Curtain";
import { Loader } from "../dom/loader/Loader";
import { Announcer } from "../dom/chrome/Announcer";
import Home from "../dom/pages/Home";
import Index from "../dom/pages/Index";
import Workbench from "../dom/pages/Workbench";
import Commission from "../dom/pages/Commission";
import NotFound from "../dom/pages/NotFound";

const Experience = lazy(() => import("../webgl/Experience"));

export default function App() {
  const root = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  bindNavigate(navigate);

  useEffect(() => {
    initScroll();
    startClock();
    if (window.matchMedia("(pointer: fine)").matches) document.documentElement.classList.add("has-cursor");
  }, []);

  useEffect(() => {
    const apply = (theme) => {
      document.documentElement.dataset.theme = theme;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "night" ? "#12120F" : "#EEEBE4");
    };
    apply(useUI.getState().theme);
    return useUI.subscribe((s, p) => s.theme !== p.theme && apply(s.theme));
  }, []);

  return (
    <div ref={root} className="app">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <LensLayer />
      <Suspense fallback={null}>
        <Experience eventSource={root} />
      </Suspense>
      <main id="main" className="pages">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/objects" element={<Index />} />
          <Route path="/objects/:slug" element={<Workbench />} />
          <Route path="/commission" element={<Commission />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <LensRing />
      <LensController />
      <Chrome />
      <Curtain />
      <Loader />
      <Cursor />
      <Announcer />
    </div>
  );
}
