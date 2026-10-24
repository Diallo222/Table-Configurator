import { flushSync } from "react-dom";
import { useUI, reducedMotion } from "../../store/useUI";

/** Day ⇄ night with a radial wipe expanding from (x, y) — the light source or the toggle. */
export function setTheme(theme, x = window.innerWidth / 2, y = 0) {
  const ui = useUI.getState();
  if (ui.theme === theme) return;
  const apply = () => flushSync(() => ui.setTheme(theme));
  if (!document.startViewTransition || reducedMotion) return apply();
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const t = document.startViewTransition(apply);
  t.ready
    .then(() =>
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 1000, easing: "cubic-bezier(0.7, 0, 0.2, 1)", pseudoElement: "::view-transition-new(root)" }
      )
    )
    .catch(() => {});
}

export function toggleNight(x, y) {
  setTheme(useUI.getState().theme === "night" ? "day" : "night", x, y);
}
