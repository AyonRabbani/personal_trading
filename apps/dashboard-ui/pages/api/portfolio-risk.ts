import { NextApiRequest, NextApiResponse } from 'next';
import {
  registerPolygonProvider,
  getMarketData,
} from '@workspace/data-providers/polygon';
import { assetSymbols } from '@workspace/assets';
import {
  portfolioVaR,
  Position,
  simulatePricePath,
} from '@workspace/risk/var';

registerPolygonProvider({ symbols: assetSymbols });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const holdings = [
      { symbol: 'AAPL', quantity: 20 },
      { symbol: 'MSFT', quantity: 15 },
      { symbol: 'AMZN', quantity: 5 },
      { symbol: 'BTCUSD', quantity: 0.2 },
      { symbol: 'ES_F', quantity: 1 },
    ];

    const data = await getMarketData();
    const bySymbol: Record<string, number[]> = {};
    for (const d of data) {
      (bySymbol[d.symbol] ||= []).push(d.close);
    }
    // ensure price arrays sorted oldest -> newest
    for (const arr of Object.values(bySymbol)) {
      arr.reverse();
    }

    const positions: Position[] = holdings.map((h) => ({
      quantity: h.quantity,
      prices: bySymbol[h.symbol] || [],
    }));

    const varValue = portfolioVaR(positions, 0.95);

    // also return portfolio returns for plotting
    const n = positions[0].prices.length;
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      const val = positions.reduce((sum, p) => sum + p.quantity * p.prices[i], 0);
      values.push(val);
    }
    const returns: number[] = [];
    for (let i = 1; i < values.length; i++) {
      returns.push((values[i] - values[i - 1]) / values[i - 1]);
    }

    const projections = holdings.map((h) => {
      const prices = bySymbol[h.symbol] || [];
      if (prices.length < 2) return { symbol: h.symbol, path: [] };
      const rets: number[] = [];
      for (let i = 1; i < prices.length; i++) {
        rets.push((prices[i] - prices[i - 1]) / prices[i - 1]);
      }
      const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
      const std = Math.sqrt(
        rets.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / rets.length
      );
      const path = simulatePricePath(prices[prices.length - 1], mean, std, 10);
      return { symbol: h.symbol, path };
    });

    res.status(200).json({ var: varValue, returns, projections });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to compute portfolio risk' });
  }
}
