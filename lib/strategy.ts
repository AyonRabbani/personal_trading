import { SeriesMap, TimePoint, Metrics } from "./types";
import { computeMetrics } from "./math";

interface RunResult {
  equity: TimePoint[];
  metrics: Metrics;
}

function calcPortfolioReturns(prices: SeriesMap): { dates: string[]; returns: number[] } {
  const tickers = Object.keys(prices);
  if (tickers.length === 0) return { dates: [], returns: [] };
  const length = prices[tickers[0]].length;
  const returns: number[] = [];
  const dates: string[] = [];
  for (let i = 1; i < length; i++) {
    let sum = 0;
    for (const t of tickers) {
      const series = prices[t];
      const r = series[i].close / series[i - 1].close - 1;
      sum += r;
    }
    returns.push(sum / tickers.length);
    dates.push(prices[tickers[0]][i].date);
  }
  return { dates, returns };
}

// core engine (levered and unlevered runs)
export function runUnlevered(prices: SeriesMap): RunResult {
  const { dates, returns } = calcPortfolioReturns(prices);
  let equity = 1;
  const equityCurve: TimePoint[] = [];
  for (let i = 0; i < returns.length; i++) {
    equity *= 1 + returns[i];
    equityCurve.push({ date: dates[i], value: equity });
  }
  return { equity: equityCurve, metrics: computeMetrics(returns) };
}

export function runLevered(prices: SeriesMap, leverage = 2) {
  const { dates, returns } = calcPortfolioReturns(prices);
  let equity = 1;
  const equityCurve: TimePoint[] = [];
  for (let i = 0; i < returns.length; i++) {
    equity *= 1 + returns[i] * leverage;
    equityCurve.push({ date: dates[i], value: equity });
  }
  const marginRatio: TimePoint[] = equityCurve.map((p) => ({
    date: p.date,
    value: 1 / leverage,
  }));
  return {
    equity: equityCurve,
    marginRatio,
    metrics: computeMetrics(returns.map((r) => r * leverage)),
  };
}
