import { describe, expect, it } from 'vitest';
import chain from './fixtures/chain.json';
import {
  credit,
  spreadWidth,
  maxLoss,
  ror,
  annualized,
  mid,
} from '../lib/metrics';

describe('metrics', () => {
  it('computes spread metrics correctly', () => {
    const c = credit(chain.legs);
    expect(c).toBeCloseTo(0.825, 3);
    const width = spreadWidth(chain.legs[0].strike, chain.legs[1].strike);
    expect(width).toBe(5);
    const loss = maxLoss(c, width);
    expect(loss).toBeCloseTo(4.175, 3);
    const r = ror(c, loss);
    expect(r).toBeCloseTo(0.1976, 3);
    const ann = annualized(r, chain.dte);
    expect(ann).toBeCloseTo((0.1976 * 365) / 30, 3);
  });

  it('computes mid price', () => {
    expect(mid(1, 2)).toBe(1.5);
  });
});
