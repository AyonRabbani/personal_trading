import { NextApiRequest, NextApiResponse } from 'next';
import {
  registerPolygonProvider,
  getMarketData,
  MarketData,
} from '@workspace/data-providers/polygon';
import { getIndustryFlows } from '@workspace/data-providers/industry-flows';
import { assets, equitySymbols } from '@workspace/assets';

registerPolygonProvider({ symbols: equitySymbols });

function calcStdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

function rank(values: number[], ascending = false): number[] {
  const sorted = [...values].sort((a, b) => (ascending ? a - b : b - a));
  const max = sorted.length - 1;
  return values.map((v) => 1 - sorted.indexOf(v) / (max === 0 ? 1 : max));
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const [data, flows] = await Promise.all([getMarketData(), getIndustryFlows()]);

    const industryFlowRank: Record<string, number> = {};
    const flowRanks = rank(flows.map((f) => f.flow));
    flows.forEach((f, idx) => {
      industryFlowRank[f.name] = flowRanks[idx];
    });

    const bySymbol: Record<string, MarketData[]> = {};
    for (const d of data) {
      (bySymbol[d.symbol] ||= []).push(d);
    }

    interface Temp {
      symbol: string;
      industry: string;
      momentum: number;
      volatility: number;
      valueScore: number;
    }

    const temp: Temp[] = [];
    for (const asset of assets.filter((a) => a.type === 'equity')) {
      const arr = (bySymbol[asset.symbol] || []).sort((a, b) => a.timestamp - b.timestamp);
      if (arr.length === 0) continue;
      const first = arr[0];
      const last = arr[arr.length - 1];
      const momentum = (last.close - first.close) / first.close;
      const returns: number[] = [];
      for (let i = 1; i < arr.length; i++) {
        returns.push((arr[i].close - arr[i - 1].close) / arr[i - 1].close);
      }
      const volatility = calcStdDev(returns);
      const valueScore = 1 / last.close;
      temp.push({ symbol: asset.symbol, industry: asset.industry || 'Other', momentum, volatility, valueScore });
    }

    interface Result {
      symbol: string;
      industry: string;
      score: number;
      momentum: number;
      volatility: number;
      industryFlow: number;
      peerValueRank: number;
    }
    const final: Result[] = [];
    const industryGroups: Record<string, Temp[]> = {};
    for (const t of temp) {
      (industryGroups[t.industry] ||= []).push(t);
    }
    for (const [industry, list] of Object.entries(industryGroups)) {
      const valRanks = rank(list.map((l) => l.valueScore));
      const momRanks = rank(list.map((l) => l.momentum));
      list.forEach((l, idx) => {
        const flowRank = industryFlowRank[industry] ?? 0.5;
        const peerValue = valRanks[idx];
        const momRank = momRanks[idx];
        const score = 0.4 * flowRank + 0.3 * peerValue + 0.3 * momRank;
        final.push({
          symbol: l.symbol,
          industry,
          score,
          momentum: l.momentum,
          volatility: l.volatility,
          industryFlow: flowRank,
          peerValueRank: peerValue,
        });
      });
    }

    final.sort((a, b) => b.score - a.score);

    res.status(200).json(final);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate cash parking candidates' });
  }
}
