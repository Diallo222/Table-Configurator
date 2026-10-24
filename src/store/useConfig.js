import { create } from "zustand";
import { BY_SLUG, SLUGS, defaults } from "../data/catalog";

export const useConfig = create((set, get) => ({
  configs: Object.fromEntries(SLUGS.map((s) => [s, defaults(s)])),
  // world point of the last material drop, consumed by the ink-bleed
  drop: null,

  set: (slug, key, value, drop = null) =>
    set((st) => ({
      configs: { ...st.configs, [slug]: { ...st.configs[slug], [key]: value } },
      drop,
    })),
  replace: (slug, cfg) => set((st) => ({ configs: { ...st.configs, [slug]: { ...defaults(slug), ...cfg } }, drop: null })),
  reset: (slug) => get().replace(slug, {}),
}));

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/** Config ⇄ URL query (?w=1840&base=splay…). Unknown or invalid values fall back to defaults. */
export function encodeConfig(slug, cfg) {
  const d = defaults(slug);
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(cfg)) if (v !== d[k]) q.set(k, String(v));
  return q.toString();
}

export function decodeConfig(slug, search) {
  const q = new URLSearchParams(search);
  const out = {};
  for (const [k, p] of Object.entries(BY_SLUG[slug].params)) {
    const raw = q.get(k);
    if (raw === null) continue;
    if (p.type === "num") {
      const n = Number(raw);
      if (Number.isFinite(n)) out[k] = clamp(Math.round(n / p.step) * p.step, p.min, p.max);
    } else {
      const ids = p.type === "material" ? p.options : p.options.map((o) => o.id);
      if (ids.includes(raw)) out[k] = raw;
    }
  }
  return out;
}
