// Collection 01. Numeric params are in millimetres (or units noted), materials reference data/materials.js.

const WOODS = ["oak", "ash", "walnut", "black-oak"];
const STONES = ["travertine", "carrara", "terrazzo"];
const COATS = ["graphite", "bone", "signal", "vermilion"];
const METALS = ["steel", "brass"];
const TEXTILES = ["boucle", "linen-sand", "linen-sage", "velvet-rust", "cognac"];

const finish = (slots, labels = ["Matte", "Satin", "Gloss"]) => ({
  type: "finish",
  slots,
  label: "Finish",
  options: [
    { id: "matte", label: labels[0] },
    { id: "satin", label: labels[1] },
    { id: "gloss", label: labels[2] },
  ],
  default: "satin",
});

export const CATALOG = [
  {
    slug: "atlas",
    no: "01",
    name: "Atlas",
    type: "Dining table",
    category: "tables",
    story: "A long table for long dinners. Solid top, three ways to stand.",
    lead: "6 weeks",
    params: {
      w: { type: "num", label: "Width", min: 900, max: 2400, step: 10, default: 1800, unit: "mm" },
      d: { type: "num", label: "Depth", min: 750, max: 1100, step: 10, default: 900, unit: "mm" },
      base: {
        type: "enum",
        label: "Base",
        options: [
          { id: "splay", label: "Splay" },
          { id: "trestle", label: "Trestle" },
          { id: "arc", label: "Arc" },
        ],
        default: "splay",
      },
      top: { type: "material", slot: "top", label: "Top", options: [...WOODS, ...STONES], default: "oak" },
      frame: { type: "material", slot: "frame", label: "Base", options: [...COATS, "steel", "oak", "black-oak"], default: "graphite" },
      finish: finish(["top"]),
    },
    pricing: { base: 1480, perMm: { w: 0.85, d: 0.7 }, variants: { trestle: 180, arc: 320 } },
  },
  {
    slug: "mira",
    no: "02",
    name: "Mira",
    type: "Lounge chair",
    category: "seating",
    story: "Low, deep and forgiving. A chair for the second half of the evening.",
    lead: "8 weeks",
    params: {
      frameStyle: {
        type: "enum",
        label: "Frame",
        options: [
          { id: "tube", label: "Bent" },
          { id: "sled", label: "Sled" },
        ],
        default: "tube",
      },
      seat: { type: "material", slot: "seat", label: "Upholstery", options: TEXTILES, default: "boucle" },
      frame: { type: "material", slot: "frame", label: "Frame", options: [...WOODS, "graphite", ...METALS], default: "walnut" },
      finish: finish(["frame"]),
    },
    pricing: { base: 1890, variants: { sled: 140 } },
  },
  {
    slug: "orbit",
    no: "03",
    name: "Orbit",
    type: "Desk lamp",
    category: "light",
    story: "Two arms, one hinge, any angle. Grab the head and put the light where you need it.",
    lead: "4 weeks",
    params: {
      reach: { type: "num", label: "Reach", min: 180, max: 640, step: 10, default: 430, unit: "mm" },
      lift: { type: "num", label: "Height", min: 260, max: 760, step: 10, default: 560, unit: "mm" },
      kelvin: { type: "num", label: "Light", min: 2700, max: 4000, step: 50, default: 2900, unit: "K" },
      shade: {
        type: "enum",
        label: "Shade",
        options: [
          { id: "cone", label: "Cone" },
          { id: "dome", label: "Dome" },
        ],
        default: "cone",
      },
      body: { type: "material", slot: "body", label: "Body", options: [...COATS, ...METALS], default: "signal" },
      finish: finish(["body"]),
    },
    pricing: { base: 420, variants: { dome: 40 }, materials: { brass: 1.35, steel: 1.15 } },
  },
  {
    slug: "tripod",
    no: "04",
    name: "Tripod",
    type: "Stool",
    category: "seating",
    story: "Three legs never wobble. Counter, bar or something in between.",
    lead: "3 weeks",
    params: {
      h: { type: "num", label: "Height", min: 450, max: 800, step: 10, default: 650, unit: "mm" },
      seatShape: {
        type: "enum",
        label: "Seat",
        options: [
          { id: "round", label: "Round" },
          { id: "square", label: "Square" },
        ],
        default: "round",
      },
      seat: { type: "material", slot: "seat", label: "Seat", options: [...WOODS, "cognac"], default: "oak" },
      legs: { type: "material", slot: "legs", label: "Legs", options: [...WOODS, ...COATS, "steel"], default: "oak" },
      finish: finish(["seat", "legs"]),
    },
    pricing: { base: 290, perMm: { h: 0.12 }, variants: { square: 30 } },
  },
  {
    slug: "grid",
    no: "05",
    name: "Grid",
    type: "Modular shelving",
    category: "storage",
    story: "Add a column, add a row. It grows with the books.",
    lead: "5 weeks",
    params: {
      cols: { type: "num", label: "Columns", min: 1, max: 6, step: 1, default: 3, unit: "×", int: true },
      rows: { type: "num", label: "Rows", min: 1, max: 5, step: 1, default: 3, unit: "×", int: true },
      back: {
        type: "enum",
        label: "Back",
        options: [
          { id: "open", label: "Open" },
          { id: "backed", label: "Backed" },
        ],
        default: "backed",
      },
      body: { type: "material", slot: "body", label: "Body", options: [...WOODS, "bone", "graphite", "signal", "vermilion"], default: "ash" },
      finish: finish(["body"]),
    },
    pricing: { base: 260, perUnit: { cells: 165 }, variants: { backed: 0 } },
  },
  {
    slug: "slab",
    no: "06",
    name: "Slab",
    type: "Side table",
    category: "tables",
    story: "One piece of stone, resting on almost nothing.",
    lead: "7 weeks",
    params: {
      dia: { type: "num", label: "Diameter", min: 400, max: 900, step: 10, default: 620, unit: "mm" },
      height: {
        type: "enum",
        label: "Height",
        options: [
          { id: "coffee", label: "Coffee 380" },
          { id: "side", label: "Side 520" },
        ],
        default: "coffee",
      },
      base: {
        type: "enum",
        label: "Base",
        options: [
          { id: "pillar", label: "Pillar" },
          { id: "tripod", label: "Rods" },
          { id: "cross", label: "Cross" },
        ],
        default: "pillar",
      },
      top: { type: "material", slot: "top", label: "Top", options: [...STONES, "black-oak"], default: "travertine" },
      frame: { type: "material", slot: "frame", label: "Base", options: [...STONES, ...COATS, ...METALS], default: "travertine" },
      finish: finish(["top"], ["Honed", "Satin", "Polished"]),
    },
    pricing: { base: 690, perMm: { dia: 0.9 }, variants: { tripod: 60, cross: 90 } },
  },
];

export const SLUGS = CATALOG.map((c) => c.slug);
export const BY_SLUG = Object.fromEntries(CATALOG.map((c) => [c.slug, c]));

export function defaults(slug) {
  const out = {};
  for (const [k, p] of Object.entries(BY_SLUG[slug].params)) out[k] = p.default;
  return out;
}

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "tables", label: "Tables" },
  { id: "seating", label: "Seating" },
  { id: "light", label: "Light" },
  { id: "storage", label: "Storage" },
];
