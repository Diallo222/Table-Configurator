import { create } from "zustand";

// Create the zustand store
export const useConfiguratorStore = create((set) => ({
  legs: 0,
  setLegs: (legs) => set({ legs }),
  
  legsColor: "#777777",
  setLegsColor: (legsColor) => set({ legsColor }),
  
  tableWidth: 100,
  setTableWidth: (tableWidth) => set({ tableWidth }),
}));

