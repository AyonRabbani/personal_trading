"use client";
import { create } from "zustand";
import { TimePoint, Metrics } from "./types";

export interface TickerStat {
  ticker: string;
  totalDividend: number;
  dailyReturn: number;
}

export interface BacktestResult {
  unlevered: { equity: TimePoint[]; metrics: Metrics };
  levered: {
    equity: TimePoint[];
    nmv: TimePoint[];
    loan: TimePoint[];
    marginRatio: TimePoint[];
    marginCalls: TimePoint[];
    metrics: Metrics;
  };
  tickerStats: TickerStat[];
}

interface BacktestState {
  data?: BacktestResult;
  setData: (d: BacktestResult) => void;
}

export const useBacktestStore = create<BacktestState>((set) => ({
  data: undefined,
  setData: (d) => set({ data: d }),
}));
