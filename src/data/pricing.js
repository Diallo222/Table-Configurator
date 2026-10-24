import { BY_SLUG } from "./catalog";

// Material price multipliers (applied to the base price).
const MATERIAL_RATE = {
  walnut: 1.18,
  "black-oak": 1.12,
  carrara: 1.32,
  travertine: 1.2,
  terrazzo: 1.15,
  "velvet-rust": 1.08,
  cognac: 1.22,
  brass: 1.25,
  steel: 1.1,
};

const round10 = (n) => Math.round(n / 10) * 10;

/** Price in euros for a configuration. Pure function. */
export function price(slug, cfg) {
  const item = BY_SLUG[slug];
  const p = item.pricing;
  let total = p.base;
  for (const [k, rate] of Object.entries(p.perMm ?? {})) {
    const def = item.params[k];
    total += (cfg[k] - def.min) * rate;
  }
  if (p.perUnit?.cells) total += cfg.cols * cfg.rows * p.perUnit.cells;
  for (const v of Object.values(cfg)) total += p.variants?.[v] ?? 0;
  let mult = 1;
  for (const [k, def] of Object.entries(item.params)) {
    if (def.type !== "material") continue;
    const r = p.materials?.[cfg[k]] ?? MATERIAL_RATE[cfg[k]] ?? 1;
    mult = Math.max(mult, r);
  }
  return round10(total * mult);
}

export const formatPrice = (n) => `€ ${Math.round(n).toLocaleString("fr-FR").replace(/[\u00a0\u202f]/g, "\u00a0")}`;
