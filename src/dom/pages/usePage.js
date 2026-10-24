import { useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { bindPage } from "../../core/transitions";
import { useUI } from "../../store/useUI";

/** Registers a page root for transitions and sets page-level chrome state. */
export function usePage(ref, { index = "00", label = "", lens = 0, title } = {}) {
  useLayoutEffect(() => {
    bindPage(ref.current);
    gsap.set(ref.current, { autoAlpha: 1 });
    const ui = useUI.getState();
    ui.setSection(index, label);
    ui.setLens(lens);
    if (title) document.title = title;
    requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => {
      ui.setHover(null);
      ui.setCursor("default");
    };
  }, [ref, index, label, lens, title]);
}

/** Resolves when the loader has handed over (phase intro/ready). */
export function whenStarted(cb) {
  const ui = useUI.getState();
  if (ui.phase !== "loading") {
    cb(false);
    return () => {};
  }
  return useUI.subscribe((s, p) => {
    if (p.phase === "loading" && s.phase !== "loading") cb(true);
  });
}
