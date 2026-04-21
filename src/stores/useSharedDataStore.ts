import { create } from "zustand";

interface SharedDataState {
  /** URL received from Web Share Target or detected in clipboard */
  sharedUrl: string;
  /** Job description text extracted from clipboard */
  sharedJd: string;
  /** True when data was received via the share/clipboard pipeline */
  isSharedEntry: boolean;

  setSharedData: (url: string, jd: string) => void;
  clearSharedData: () => void;
}

export const useSharedDataStore = create<SharedDataState>((set) => ({
  sharedUrl: "",
  sharedJd: "",
  isSharedEntry: false,

  setSharedData: (url, jd) =>
    set({ sharedUrl: url, sharedJd: jd, isSharedEntry: true }),

  clearSharedData: () =>
    set({ sharedUrl: "", sharedJd: "", isSharedEntry: false }),
}));
