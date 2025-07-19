import { NextApiRequest, NextApiResponse } from 'next';
import { registerPolygonProvider, getMarketData } from '@workspace/data-providers/polygon';
import { fetchNewsScores } from '@workspace/data-providers/news';
import { assetSymbols } from '@workspace/assets';

registerPolygonProvider({ symbols: assetSymbols });

interface Metric {
  symbol: string;
  momentum: number;
  risk: number;
  sentiment: number;
}

function calcStdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getMarketData();
    const bySymbol: Record<string, typeof data> = {};
    for (const d of data) {
      (bySymbol[d.symbol] ||= []).push(d);
    }
    const news = await fetchNewsScores(Object.keys(bySymbol));

    const results: Metric[] = [];
    for (const symbol of Object.keys(bySymbol)) {
      const arr = bySymbol[symbol].sort((a, b) => a.timestamp - b.timestamp);
      const first = arr[0];
      const last = arr[arr.length - 1];
      const momentum = (last.close - first.close) / first.close;

      const returns: number[] = [];
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1].close;
        const curr = arr[i].close;
        returns.push((curr - prev) / prev);
      }
      const risk = calcStdDev(returns);
      const sentiment = news[symbol]?.sentiment ?? 0;

      results.push({ symbol, momentum, risk, sentiment });
    }

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
}
