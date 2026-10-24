import { create } from "zustand";

const read = (k, fallback) => {
  try {
    const v = localStorage.getItem(k);
    return v === null ? fallback : JSON.parse(v);
  } catch {
    return fallback;
  }
};
const write = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {
    /* storage unavailable: preference just won't persist */
  }
};

export const reducedMotion =
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const useUI = create((set, get) => ({
  theme: "day",
  setTheme: (theme) => set({ theme }),

  sound: read("etabli:sound", false),
  toggleSound: () => {
    const sound = !get().sound;
    write("etabli:sound", sound);
    set({ sound });
  },

  // loader → intro → ready
  phase: "loading",
  setPhase: (phase) => set({ phase }),

  // cursor: default | lens | handle | drag | link | rotate | hidden
  cursor: { state: "default", label: "" },
  setCursor: (state, label = "") => {
    const c = get().cursor;
    if (c.state !== state || c.label !== label) set({ cursor: { state, label } });
  },

  // lens radius target in CSS px (0 = closed); "plan" is the lens at full screen
  lens: 0,
  setLens: (lens) => set({ lens }),
  mode: "studio",
  setMode: (mode) => set({ mode }),

  // the object open in the Workbench (slug or null) and whether a handle is being dragged
  focus: null,
  setFocus: (focus) => set({ focus }),
  dragging: false,
  setDragging: (dragging) => set({ dragging }),

  // which object the pointer is over (slug or null)
  hover: null,
  setHover: (hover) => get().hover !== hover && set({ hover }),

  // live announcements for screen readers
  announce: "",
  say: (announce) => set({ announce }),

  // ruler scale: mm per CSS px (null = neutral page ruler)
  ruler: null,
  setRuler: (ruler) => set({ ruler }),

  section: { index: "00", label: "" },
  setSection: (index, label) => set({ section: { index, label } }),
}));
