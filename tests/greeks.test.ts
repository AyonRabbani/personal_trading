import { describe, expect, it } from 'vitest';
import { blackScholes } from '../lib/greeks';

describe('blackScholes', () => {
  it('computes call option greeks', () => {
    const res = blackScholes({
      s: 100,
      k: 105,
      t: 30 / 365,
      r: 0.01,
      q: 0,
      iv: 0.2,
      type: 'call',
    });
    expect(res.delta).toBeCloseTo(0.2096, 4);
    expect(res.gamma).toBeCloseTo(0.0502, 4);
    expect(res.vega).toBeCloseTo(8.2525, 4);
  });
});
