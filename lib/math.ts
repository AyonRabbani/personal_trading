// math utilities: metrics, rolling stats, drawdowns
import { Metrics } from "./types";

// compute performance metrics from a series of daily returns
export function computeMetrics(returns: number[]): Metrics {
  const n = returns.length;
  if (n === 0) {
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

  const totalReturn = returns.reduce((acc, r) => acc * (1 + r), 1) - 1;
  const mean = returns.reduce((a, b) => a + b, 0) / n;
  const variance = returns.reduce((a, r) => a + Math.pow(r - mean, 2), 0) / n;
  const std = Math.sqrt(variance);
  const volAnn = std * Math.sqrt(252);
  const cagr = Math.pow(1 + totalReturn, 252 / n) - 1;
  const sharpe = volAnn === 0 ? 0 : (mean * 252) / volAnn;
  const downside = returns.filter((r) => r < 0);
  const ddStd = Math.sqrt(
    downside.reduce((a, r) => a + r * r, 0) / (downside.length || 1)
  );
  const sortino = ddStd === 0 ? 0 : (mean * 252) / (ddStd * Math.sqrt(252));

  // max drawdown using equity path
  let equity = 1;
  let peak = 1;
  let maxDD = 0;
  for (const r of returns) {
    equity *= 1 + r;
    if (equity > peak) peak = equity;
    const dd = (equity - peak) / peak;
    if (dd < maxDD) maxDD = dd;
  }

  const hitRate = returns.filter((r) => r >= 0).length / n;

  return {
    totalReturn,
    cagr,
    volAnn,
    sharpe,
    sortino,
    maxDD: Math.abs(maxDD),
    hitRate,
  };
}
