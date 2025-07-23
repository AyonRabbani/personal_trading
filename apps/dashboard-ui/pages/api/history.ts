import type { NextApiRequest, NextApiResponse } from 'next';
import { DEFAULT_POLYGON_API_KEY } from '../../../../libs/data-providers/polygon';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const symbol = Array.isArray(req.query.symbol) ? req.query.symbol[0] : req.query.symbol;
  if (!symbol) {
    res.status(400).json({ error: 'symbol required' });
    return;
  }

  const end = new Date();
  const start = new Date();
  start.setFullYear(end.getFullYear() - 10);
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  const apiKey = process.env.POLYGON_API_KEY || DEFAULT_POLYGON_API_KEY;
  try {
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/1/day/${startStr}/${endStr}?apiKey=${apiKey}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      res.status(500).json({ error: 'failed to fetch' });
      return;
    }
    const json = await resp.json();
    res.status(200).json(json);
  } catch (err) {
    res.status(500).json({ error: 'request error' });
  }
}
