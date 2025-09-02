import test from 'node:test';
import assert from 'node:assert/strict';
import { computeMetrics } from './math';

test('computeMetrics basic stats', () => {
  const res = computeMetrics([0.1, -0.05]);
  const expectedTotal = (1 + 0.1) * (1 - 0.05) - 1;
  assert.ok(Math.abs(res.totalReturn - expectedTotal) < 1e-9);
  assert.equal(res.hitRate, 0.5);
});
