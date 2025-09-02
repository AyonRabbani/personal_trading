import { Metrics, StrategyParams, TimePoint, PicksPoint, MarginEvent } from "./types";
import { computeMetrics } from "./math";

interface StrategyResult {
  equity: TimePoint[];
  nmv: TimePoint[];
  loan: TimePoint[];
  marginRatio: TimePoint[];
  bucketA: TimePoint[];
  bucketB: TimePoint[];
  dailyDiv: TimePoint[];
  picks: PicksPoint[];
  marginEvents: MarginEvent[];
  metrics: Metrics;
}

function rankBestWorst(
  prices: number[][],
  divs: number[][],
  dates: string[],
  t: number,
  lookback: number
) {
  const n = prices[0].length;
  const startDate = new Date(dates[t]);
  const startIdx = (() => {
    for (let i = t; i >= 0; i--) {
      const dt = (startDate.getTime() - new Date(dates[i]).getTime()) / (1000 * 3600 * 24);
      if (dt >= lookback) return i;
    }
    return 0;
  })();

  const px0 = prices[startIdx];
  const pxt = prices[t];
  const divSum = new Array(n).fill(0);
  for (let i = startIdx; i <= t; i++) {
    for (let j = 0; j < n; j++) divSum[j] += divs[i][j];
  }
  const priceRet = pxt.map((p, i) => (px0[i] ? p / px0[i] - 1 : 0));
  const totalRet = pxt.map((p, i) => (px0[i] ? (p + divSum[i]) / px0[i] - 1 : 0));

  const ranks = priceRet.map((_, i) => ({ i, score: 0 }));
  const priceOrder = [...priceRet].map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
  priceOrder.forEach((o, idx) => (ranks[o.i].score += idx + 1));
  const totalOrder = [...totalRet].map((v, i) => ({ i, v })).sort((a, b) => b.v - a.v);
  totalOrder.forEach((o, idx) => (ranks[o.i].score += idx + 1));

  const best = ranks.reduce((min, r) => (r.score < min.score ? r : min), ranks[0]).i;
  const worst = ranks.reduce((max, r) => (r.score > max.score ? r : max), ranks[0]).i;
  return { best, worst };
}

function runStrategy(
  prices: number[][],
  divs: number[][],
  dates: string[],
  tickers: string[],
  params: StrategyParams,
  levered: boolean
): StrategyResult {
  const n = tickers.length;
  const target = levered ? params.maintReq + params.bufferPts : 1;
  let equity = params.initialCapital;
  let nmv = levered ? equity / target : equity;
  let loan = nmv - equity;

  let shA = new Array(n).fill(0);
  let shB = new Array(n).fill(0);

  const equitySeries: TimePoint[] = [];
  const nmvSeries: TimePoint[] = [];
  const loanSeries: TimePoint[] = [];
  const mrSeries: TimePoint[] = [];
  const bucketASeries: TimePoint[] = [];
  const bucketBSeries: TimePoint[] = [];
  const divSeries: TimePoint[] = [];
  const picks: PicksPoint[] = [];
  const marginEvents: MarginEvent[] = [];

  const nDays = dates.length;

  function setToTargets(t: number, equityNow: number, best: number, worst: number | null) {
    const p = prices[t];
    const nmvTarget = levered ? equityNow / target : equityNow;
    const A = params.coreFrac * nmvTarget;
    const B = nmvTarget - A;
    shA = p.map((pi) => (pi > 0 ? A / n / pi : 0));
    shB = new Array(n).fill(0);
    if (B > 0) {
      const alloc: number[] = [];
      for (let i = 0; i < n; i++) if (i !== worst) alloc.push(i);
      const bestWeight = 0.5;
      const restWeight = 1 - bestWeight;
      shB[best] = (B * bestWeight) / p[best];
      const others = alloc.filter((i) => i !== best);
      const perRest = others.length > 0 ? (B * restWeight) / others.length : 0;
      others.forEach((i) => (shB[i] = perRest / p[i]));
    }
    return nmvTarget;
  }

  // initialise
  const { best: best0, worst: worst0 } = rankBestWorst(
    prices,
    divs,
    dates,
    0,
    params.lookbackDays
  );
  nmv = setToTargets(0, equity, best0, worst0);
  loan = nmv - equity;
  let currentMonth = dates[0].slice(0, 7);

  for (let t = 0; t < nDays; t++) {
    const p = prices[t];
    const d = divs[t];
    let dailyDiv = 0;
    for (let i = 0; i < n; i++) {
      const cashA = shA[i] * d[i];
      const cashB = shB[i] * d[i];
      dailyDiv += cashA + cashB;
      if (p[i] > 0) {
        shA[i] += p[i] ? cashA / p[i] : 0;
        shB[i] += p[i] ? cashB / p[i] : 0;
      }
    }

    const vA = shA.reduce((sum, s, i) => sum + s * p[i], 0);
    const vB = shB.reduce((sum, s, i) => sum + s * p[i], 0);
    nmv = vA + vB;
    equity = nmv - loan;
    const mr = nmv > 0 ? equity / nmv : 0;

    if (levered && mr < params.maintReq && nmv > 0) {
      const nmvStar = equity / target;
      const scale = nmvStar / nmv;
      if (scale < 1) {
        shA = shA.map((x) => x * scale);
        shB = shB.map((x) => x * scale);
        const vA2 = shA.reduce((sum, s, i) => sum + s * p[i], 0);
        const vB2 = shB.reduce((sum, s, i) => sum + s * p[i], 0);
        nmv = vA2 + vB2;
        loan = nmv - equity;
      }
      marginEvents.push({ date: dates[t], ratio: mr, type: "maintenance_breach" });
    } else if (levered && mr < target) {
      marginEvents.push({ date: dates[t], ratio: mr, type: "buffer_breach" });
    }

    // month change
    const month = dates[t].slice(0, 7);
    if (month !== currentMonth) {
      equity += params.monthlyDeposit;
      const { best, worst } = rankBestWorst(
        prices,
        divs,
        dates,
        t,
        params.lookbackDays
      );
      nmv = setToTargets(t, equity, best, worst);
      loan = nmv - equity;
      picks.push({ date: dates[t], selected: tickers[best] });
      currentMonth = month;
    }

    equitySeries.push({ date: dates[t], value: equity });
    nmvSeries.push({ date: dates[t], value: nmv });
    loanSeries.push({ date: dates[t], value: loan });
    mrSeries.push({ date: dates[t], value: nmv > 0 ? equity / nmv : 0 });
    bucketASeries.push({ date: dates[t], value: vA });
    bucketBSeries.push({ date: dates[t], value: vB });
    divSeries.push({ date: dates[t], value: dailyDiv });
  }

  const metrics = computeMetrics(
    equitySeries.map((p) => p.value),
    equitySeries.map((p) => p.date)
  );

  return {
    equity: equitySeries,
    nmv: nmvSeries,
    loan: loanSeries,
    marginRatio: mrSeries,
    bucketA: bucketASeries,
    bucketB: bucketBSeries,
    dailyDiv: divSeries,
    picks,
    marginEvents,
    metrics,
  };
}

export function runLevered(
  prices: number[][],
  divs: number[][],
  dates: string[],
  tickers: string[],
  params: StrategyParams
): StrategyResult {
  return runStrategy(prices, divs, dates, tickers, params, true);
}

export function runUnlevered(
  prices: number[][],
  divs: number[][],
  dates: string[],
  tickers: string[],
  params: StrategyParams
): StrategyResult {
  return runStrategy(prices, divs, dates, tickers, params, false);
}
