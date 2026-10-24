import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { reducedMotion } from "../store/useUI";

gsap.registerPlugin(ScrollTrigger);

/** Snapshot read by WebGL each frame (written once per tick, before render). */
export const scroll = { y: 0, velocity: 0, progress: 0 };

export let lenis = null;

export function initScroll() {
  if (lenis) return lenis;
  lenis = new Lenis({
    autoRaf: false,
    lerp: reducedMotion ? 1 : 0.095,
    smoothWheel: !reducedMotion,
    wheelMultiplier: 0.9,
  });
  lenis.on("scroll", ScrollTrigger.update);
  return lenis;
}

export function stepScroll(ms) {
  if (!lenis) return;
  lenis.raf(ms);
  scroll.y = lenis.scroll;
  scroll.velocity = lenis.velocity;
  scroll.progress = lenis.progress || 0;
}

export function scrollTop(immediate = true) {
  lenis?.scrollTo(0, { immediate, force: true });
  if (!lenis) window.scrollTo(0, 0);
}

export const lockScroll = () => lenis?.stop();
export const unlockScroll = () => lenis?.start();
