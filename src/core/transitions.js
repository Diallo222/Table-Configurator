import gsap from "gsap";
import { create } from "zustand";
import { scrollTop } from "./scroll";
import { reducedMotion } from "../store/useUI";
import { sound } from "./audio";

// Route transitions. Navigation is held until the "out" choreography finishes (PLAN P1.13).
//  - "wipe":   a pencil line draws across the screen, a paper panel follows, page swaps, panel exits.
//  - "flight": DOM fades, canvas stays live so the incoming page can fly objects from where they are.

export const useTransition = create(() => ({ busy: false, type: null, from: null }));

let navigateFn = null;
let curtain = null; // { panel, line }
let page = null; // current page root element

export const bindNavigate = (fn) => (navigateFn = fn);
export const bindCurtain = (els) => (curtain = els);
export const bindPage = (el) => (page = el);

const frames = (n = 2) => new Promise((r) => {
  const step = () => (n-- <= 0 ? r() : requestAnimationFrame(step));
  requestAnimationFrame(step);
});

function curtainIn() {
  if (!curtain) return Promise.resolve();
  const { panel, line } = curtain;
  sound("scratch", 0.8);
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .set(panel, { clipPath: "inset(0% 100% 0% 0%)", visibility: "visible" })
      .set(line, { scaleX: 0, transformOrigin: "0% 50%", visibility: "visible" })
      .to(line, { scaleX: 1, duration: 0.45, ease: "power2.inOut" })
      .to(panel, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: "expo.inOut" }, 0.15);
  });
}

function curtainOut() {
  if (!curtain) return Promise.resolve();
  const { panel, line } = curtain;
  return new Promise((resolve) => {
    gsap
      .timeline({ onComplete: resolve })
      .to(panel, { clipPath: "inset(0% 0% 0% 100%)", duration: 0.7, ease: "expo.inOut" })
      .to(line, { scaleX: 0, transformOrigin: "100% 50%", duration: 0.5, ease: "power2.inOut" }, 0.05)
      .set([panel, line], { visibility: "hidden" });
  });
}

function pageOut() {
  if (!page) return Promise.resolve();
  return new Promise((resolve) => gsap.to(page, { autoAlpha: 0, duration: 0.45, ease: "power2.in", onComplete: resolve }));
}

/** Navigate with a transition. Returns false when ignored (busy or same URL). */
export async function go(to, { type = "wipe", state } = {}) {
  const t = useTransition.getState();
  const here = window.location.pathname + window.location.search;
  if (t.busy || to === here || !navigateFn) return false;
  const kind = reducedMotion ? "fade" : type;
  useTransition.setState({ busy: true, type: kind, from: window.location.pathname });

  if (kind === "wipe") await curtainIn();
  else await pageOut();

  navigateFn(to, { state });
  scrollTop(true);
  await frames(3);

  if (kind === "wipe") await curtainOut();
  useTransition.setState({ busy: false });
  return true;
}
