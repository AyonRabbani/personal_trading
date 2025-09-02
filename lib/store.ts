import { create } from "zustand";
import { TimePoint, Metrics } from "./types";

export interface BacktestResult {
  unlevered: { equity: TimePoint[]; metrics: Metrics };
  levered: {
    equity: TimePoint[];
    marginRatio: TimePoint[];
    metrics: Metrics;
  };
}

interface BacktestState {
  data?: BacktestResult;
  setData: (d: BacktestResult) => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  data: undefined,
  setData: (d) => set({ data: d }),
}));
