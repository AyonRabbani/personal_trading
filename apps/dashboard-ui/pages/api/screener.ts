import { NextApiRequest, NextApiResponse } from 'next';
import { registerPolygonProvider, getMarketData, MarketData } from '@workspace/data-providers/polygon';
import { sp500, sp500Symbols } from '@workspace/assets';

interface ScreenResult {
  symbol: string;
  industry: string;
  momentum: number;
  volatility: number;
  valuation: number;
  rank: number;
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

registerPolygonProvider({ symbols: sp500Symbols });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getMarketData();
    const bySymbol: Record<string, MarketData[]> = {};
    for (const d of data) {
      (bySymbol[d.symbol] ||= []).push(d);
    }

    const temp: Array<ScreenResult & { valueScore: number }> = [];
    for (const { symbol, industry } of sp500) {
      const arr = (bySymbol[symbol] || []).sort((a, b) => a.timestamp - b.timestamp);
      if (arr.length < 2) continue;
      const first = arr[0].close;
      const last = arr[arr.length - 1].close;
      const momentum = (last - first) / first;
      const returns: number[] = [];
      for (let i = 1; i < arr.length; i++) {
        const prev = arr[i - 1].close;
        const curr = arr[i].close;
        returns.push((curr - prev) / prev);
      }
      const volatility = calcStdDev(returns);
      const valueScore = 1 / last;
      temp.push({ symbol, industry, momentum, volatility, valuation: 0, rank: 0, valueScore });
    }

    const industryTotals: Record<string, { sum: number; count: number }> = {};
    for (const t of temp) {
      const obj = (industryTotals[t.industry] ||= { sum: 0, count: 0 });
      obj.sum += t.valueScore;
      obj.count += 1;
    }
    const industryAvgs: Record<string, number> = {};
    for (const ind of Object.keys(industryTotals)) {
      const { sum, count } = industryTotals[ind];
      industryAvgs[ind] = sum / (count || 1);
    }

    for (const t of temp) {
      t.valuation = t.valueScore / (industryAvgs[t.industry] || 1);
    }

    const momentumRanks = rankScores(temp.map((t) => t.momentum));
    const volRanks = rankScores(temp.map((t) => t.volatility), true);
    const valRanks = rankScores(temp.map((t) => t.valuation));

    const results: ScreenResult[] = temp.map((t, idx) => ({
      symbol: t.symbol,
      industry: t.industry,
      momentum: t.momentum,
      volatility: t.volatility,
      valuation: t.valuation,
      rank: (momentumRanks[idx] + volRanks[idx] + valRanks[idx]) / 3,
    })).sort((a, b) => b.rank - a.rank);

    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ error: 'Failed to screen' });
  }
}
