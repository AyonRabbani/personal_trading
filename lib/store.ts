"use client";

import { create } from "zustand";
import { TimePoint, Metrics, SeriesMap } from "./types";

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
  prices: SeriesMap;
  dividends: TimePoint[];
  dividendTax: { date: string; dividends: number; taxes: number }[];
  divTotal: number;
  taxTotal: number;
}

// Inputs used by the backtest. Keeping them in the global store allows every
// widget to react immediately when the user adjusts parameters in the Controls
// component.
export interface BacktestInputs {
  tickers: string;
  rangeIdx: number; // index into RANGES array defined in Controls
  initialCapital: number;
  monthlyDeposit: number;
  leverage: number;
}

interface BacktestState {
  data?: BacktestResult;
  inputs: BacktestInputs;
  setData: (d: BacktestResult) => void;
  setInputs: (i: Partial<BacktestInputs>) => void;
}

const DEFAULT_INPUTS: BacktestInputs = {
  tickers: "AAPL,MSFT,GOOGL,AMZN,META",
  rangeIdx: 1, // default to 1y
  initialCapital: 6000,
  monthlyDeposit: 2000,
  leverage: 2,
};

export const useBacktestStore = create<BacktestState>((set) => ({
  data: undefined,
  inputs: DEFAULT_INPUTS,
  setData: (d) => set({ data: d }),
  setInputs: (i) =>
    set((s) => ({ inputs: { ...s.inputs, ...i } })),
}));
