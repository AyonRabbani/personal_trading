import { SeriesMap, TimePoint, Metrics } from "./types";
import { computeMetrics } from "./math";

interface RunResult {
  equity: TimePoint[];
  metrics: Metrics;
}

interface LeveredResult extends RunResult {
  nmv: TimePoint[];
  loan: TimePoint[];
  marginRatio: TimePoint[];
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
export function runUnlevered(
  prices: SeriesMap,
  initialCapital = 6000,
  monthlyDeposit = 0
): RunResult {
  const { dates, returns } = calcPortfolioReturns(prices);
  let equity = initialCapital;
  const equityCurve: TimePoint[] = [];
  let lastMonth = dates[0] ? new Date(dates[0]).getMonth() : -1;
  for (let i = 0; i < returns.length; i++) {
    const date = dates[i];
    const month = new Date(date).getMonth();
    if (month !== lastMonth) {
      equity += monthlyDeposit;
      lastMonth = month;
    }
    equity *= 1 + returns[i];
    equityCurve.push({ date, value: equity });
  }
  return { equity: equityCurve, metrics: computeMetrics(returns) };
}

export function runLevered(
  prices: SeriesMap,
  initialCapital = 6000,
  monthlyDeposit = 0,
  bufferPts = 0.05
): LeveredResult {
  const { dates, returns } = calcPortfolioReturns(prices);
  const target = 0.25 + bufferPts; // equity / nmv target
  const leverage = 1 / target;
  let equity = initialCapital;
  let nmv = equity / target;
  let loan = nmv - equity;
  let lastMonth = dates[0] ? new Date(dates[0]).getMonth() : -1;

  const equityCurve: TimePoint[] = [];
  const nmvCurve: TimePoint[] = [];
  const loanCurve: TimePoint[] = [];
  const marginCurve: TimePoint[] = [];

  for (let i = 0; i < returns.length; i++) {
    const date = dates[i];
    const month = new Date(date).getMonth();
    if (month !== lastMonth) {
      equity += monthlyDeposit;
      nmv = equity / target;
      loan = nmv - equity;
      lastMonth = month;
    }
    equity *= 1 + returns[i] * leverage;
    nmv = equity / target;
    loan = nmv - equity;
    equityCurve.push({ date, value: equity });
    nmvCurve.push({ date, value: nmv });
    loanCurve.push({ date, value: loan });
    marginCurve.push({ date, value: equity / nmv });
  }

  return {
    equity: equityCurve,
    nmv: nmvCurve,
    loan: loanCurve,
    marginRatio: marginCurve,
    metrics: computeMetrics(returns.map((r) => r * leverage)),
  };
}
