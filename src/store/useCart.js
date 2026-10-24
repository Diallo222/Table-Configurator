import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

let seq = Date.now() % 10000;

export const useCart = create(
  persist(
    (set) => ({
      items: [],
      ref: null,
      add: (item) => {
        seq += 1;
        const no = String(seq % 10000).padStart(4, "0");
        set((st) => ({ items: [...st.items, { ...item, id: `${item.slug}-${Date.now()}`, no, qty: 1 }] }));
        return no;
      },
      remove: (id) => set((st) => ({ items: st.items.filter((i) => i.id !== id) })),
      qty: (id, qty) => set((st) => ({ items: st.items.map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i)) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "etabli:ticket",
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem("etabli:probe", "1");
          localStorage.removeItem("etabli:probe");
          return localStorage;
        } catch {
          const mem = new Map();
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v), removeItem: (k) => mem.delete(k) };
        }
      }),
      partialize: (st) => ({ items: st.items }),
    }
  )
);
