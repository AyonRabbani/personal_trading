/**
 * Portfolio risk calculations including Value at Risk and simple
 * price path simulations.
 */

/**
 * Calculate historical Value at Risk (VaR) from a series of portfolio
 * returns. Returns should be expressed as decimal percentages, e.g. 0.02
 * for a 2% gain.
 */
export function historicalVaR(returns: number[], confidence = 0.95): number {
  if (returns.length === 0) return 0;
  const sorted = [...returns].sort((a, b) => a - b);
  const idx = Math.floor((1 - confidence) * sorted.length);
  const varPct = sorted[Math.max(0, Math.min(sorted.length - 1, idx))];
  return Math.abs(Math.min(varPct, 0));
}

export interface Position {
  quantity: number;
  prices: number[]; // ordered oldest -> newest
}

/**
 * Compute portfolio VaR using historical simulation on position price history.
 * Prices arrays should all be the same length.
 */
export function portfolioVaR(positions: Position[], confidence = 0.95): number {
  if (positions.length === 0 || positions[0].prices.length < 2) return 0;
  const n = positions[0].prices.length;
  const values: number[] = [];
  for (let i = 0; i < n; i++) {
    const val = positions.reduce((sum, p) => sum + p.quantity * p.prices[i], 0);
    values.push(val);
  }
  const returns: number[] = [];
  for (let i = 1; i < values.length; i++) {
    returns.push((values[i] - values[i - 1]) / values[i - 1]);
  }
  const varPct = historicalVaR(returns, confidence);
  return values[values.length - 1] * varPct;
}

function randn(): number {
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Simulate a single price path using geometric Brownian motion.
 */
export function simulatePricePath(
  start: number,
  mu: number,
  sigma: number,
  days: number
): number[] {
  const dt = 1 / 252; // daily step
  const prices = [start];
  for (let i = 0; i < days; i++) {
    const last = prices[prices.length - 1];
    const shock = (mu - 0.5 * sigma * sigma) * dt + sigma * Math.sqrt(dt) * randn();
    prices.push(last * Math.exp(shock));
  }
  return prices;
}
