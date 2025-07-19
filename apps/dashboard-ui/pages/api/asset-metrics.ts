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
  peerRank: number;
}

function rankScores(values: number[], ascending = false): number[] {
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const max = sorted.length - 1;
  return values.map((v) => 1 - sorted.indexOf(v) / (max === 0 ? 1 : max));
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

    const temp: Array<Metric & { valueScore: number }> = [];
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
      const valueScore = 1 / last.close;

      temp.push({ symbol, momentum, risk, sentiment, peerRank: 0, valueScore });
    }

    const valueRanks = rankScores(temp.map((t) => t.valueScore));
    const momentumRanks = rankScores(temp.map((t) => t.momentum));
    const volRanks = rankScores(temp.map((t) => t.risk), true);

    const results: Metric[] = temp.map((t, idx) => ({
      symbol: t.symbol,
      momentum: t.momentum,
      risk: t.risk,
      sentiment: t.sentiment,
      peerRank: (valueRanks[idx] + momentumRanks[idx] + volRanks[idx]) / 3,
    }));

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to compute metrics' });
  }
}
