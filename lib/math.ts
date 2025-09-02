import { Metrics } from "./types";

// Compute performance metrics from an equity series and corresponding dates
export function computeMetrics(series: number[], dates: string[]): Metrics {
  const values = series.filter((v) => Number.isFinite(v));
  if (values.length < 2) {
    return {
      totalReturn: 0,
      cagr: 0,
      volAnn: 0,
      sharpe: 0,
      sortino: 0,
      maxDD: 0,
      hitRate: 0,
    };
  }

  const rets: number[] = [];
  for (let i = 1; i < values.length; i++) {
    const prev = values[i - 1];
    const curr = values[i];
    if (prev !== 0) {
      rets.push(curr / prev - 1);
    } else {
      rets.push(0);
    }
  }

  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance =
    rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rets.length;
  const std = Math.sqrt(variance);
  const negRets = rets.filter((r) => r < 0);
  const negMean =
    negRets.length > 0 ? negRets.reduce((a, b) => a + b, 0) / negRets.length : 0;
  const negVar =
    negRets.length > 0
      ? negRets.reduce((a, b) => a + Math.pow(b - negMean, 2), 0) / negRets.length
      : 0;
  const stdNeg = Math.sqrt(negVar);

  const volAnn = std * Math.sqrt(252);
  const sharpe = volAnn !== 0 ? (mean * 252) / volAnn : 0;
  const sortino = stdNeg !== 0 ? (mean * 252) / (stdNeg * Math.sqrt(252)) : 0;

  let peak = values[0];
  let maxDD = 0;
  values.forEach((v) => {
    if (v > peak) peak = v;
    const dd = v / peak - 1;
    if (dd < maxDD) maxDD = dd;
  });

  const hitRate = rets.filter((r) => r > 0).length / rets.length;
  const totalReturn = values[values.length - 1] / values[0] - 1;

  const first = new Date(dates[0]).getTime();
  const last = new Date(dates[dates.length - 1]).getTime();
  const days = (last - first) / (1000 * 60 * 60 * 24);
  const cagr = Math.pow(values[values.length - 1] / values[0], 365.25 / days) - 1;

  return {
    totalReturn,
    cagr,
    volAnn,
    sharpe,
    sortino,
    maxDD,
    hitRate,
  };
}
