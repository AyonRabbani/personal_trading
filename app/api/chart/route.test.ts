import test from 'node:test';
import assert from 'node:assert/strict';
import { POST } from './route';

const base = 'http://localhost/api/chart';

test('chart route validates input', async () => {
  const req = new Request(base, {
    method: 'POST',
    body: JSON.stringify({ tickers: [] }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res = await POST(req);
  assert.equal(res.status, 400);
});
