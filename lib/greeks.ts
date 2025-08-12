export interface GreeksInput {
  s: number; // underlying price
  k: number; // strike
  t: number; // time to expiry in years
  r: number; // risk-free rate
  q: number; // dividend yield
  iv: number; // implied volatility (as decimal)
  type: 'call' | 'put';
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const sign = x < 0 ? -1 : 1;
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const absX = Math.abs(x);
  const t = 1 / (1 + p * absX);
  const y =
    1 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absX * absX);
  return sign * y;
}

function normCdf(x: number): number {
  return 0.5 * (1 + erf(x / Math.SQRT2));
}

function normPdf(x: number): number {
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
}

export function blackScholes(input: GreeksInput) {
  const { s, k, t, r, q, iv, type } = input;
  const sqrtT = Math.sqrt(t);
  const d1 = (Math.log(s / k) + (r - q + 0.5 * iv * iv) * t) / (iv * sqrtT);
  const d2 = d1 - iv * sqrtT;

  const delta =
    type === 'call'
      ? Math.exp(-q * t) * normCdf(d1)
      : Math.exp(-q * t) * (normCdf(d1) - 1);

  const gamma = (Math.exp(-q * t) * normPdf(d1)) / (s * iv * sqrtT);

  const theta =
    type === 'call'
      ?
        (-s * iv * Math.exp(-q * t) * normPdf(d1)) / (2 * sqrtT) -
        r * k * Math.exp(-r * t) * normCdf(d2) +
        q * s * Math.exp(-q * t) * normCdf(d1)
      :
        (-s * iv * Math.exp(-q * t) * normPdf(d1)) / (2 * sqrtT) +
        r * k * Math.exp(-r * t) * normCdf(-d2) -
        q * s * Math.exp(-q * t) * normCdf(-d1);

  const vega = s * Math.exp(-q * t) * sqrtT * normPdf(d1);

  return { delta, gamma, theta, vega, d1, d2 };
}
