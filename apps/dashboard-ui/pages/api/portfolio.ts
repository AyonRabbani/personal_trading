import { NextApiRequest, NextApiResponse } from 'next';

interface Holding {
  symbol: string;
  quantity: number;
  costBasis: number;
  currentPrice: number;
}

/**
 * Return dummy portfolio holdings and summary metrics.
 * In a real application this would query a database or brokerage API.
 */
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const holdings: Holding[] = [
    { symbol: 'AAPL', quantity: 20, costBasis: 150, currentPrice: 170 },
    { symbol: 'MSFT', quantity: 15, costBasis: 220, currentPrice: 210 },
    { symbol: 'AMZN', quantity: 5, costBasis: 115, currentPrice: 130 },
    { symbol: 'BTCUSD', quantity: 0.2, costBasis: 30000, currentPrice: 34000 },
    { symbol: 'ES_F', quantity: 1, costBasis: 4500, currentPrice: 4550 },
  ];

  const cash = 5000;
  const totalCost =
    cash + holdings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0);
  const marketValue =
    cash + holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);

  const metrics = {
    totalValue: marketValue,
    dailyChange: 1,
    totalReturn: ((marketValue - totalCost) / totalCost) * 100,
  };

  res.status(200).json({ holdings, cash, metrics });
}
