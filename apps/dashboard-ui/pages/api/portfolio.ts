import { NextApiRequest, NextApiResponse } from 'next';

interface Holding {
  symbol: string;
  quantity: number;
  costBasis: number;
  purchaseDate: string;
  currentPrice: number;
}

const holdings: Holding[] = [
  {
    symbol: 'AAPL',
    quantity: 20,
    costBasis: 150,
    purchaseDate: '2024-01-01',
    currentPrice: 170,
  },
  {
    symbol: 'MSFT',
    quantity: 15,
    costBasis: 220,
    purchaseDate: '2024-01-15',
    currentPrice: 210,
  },
];

const cash = 5000;

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { symbol, quantity, costBasis, purchaseDate } = req.body as {
      symbol: string;
      quantity: number;
      costBasis: number;
      purchaseDate: string;
    };
    holdings.push({
      symbol,
      quantity,
      costBasis,
      purchaseDate,
      currentPrice: costBasis * (1 + (Math.random() - 0.5) * 0.1),
    });

    const totalCost =
      cash + holdings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0);
    const marketValue =
      cash + holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);

    const metrics = {
      totalValue: marketValue,
      dailyChange: (Math.random() - 0.5) * 200,
      totalReturn: ((marketValue - totalCost) / totalCost) * 100,
    };

    return res.status(200).json({ holdings, cash, metrics });
  }

  const totalCost =
    cash + holdings.reduce((sum, h) => sum + h.costBasis * h.quantity, 0);
  const marketValue =
    cash + holdings.reduce((sum, h) => sum + h.currentPrice * h.quantity, 0);

  const metrics = {
    totalValue: marketValue,
    dailyChange: (Math.random() - 0.5) * 200,
    totalReturn: ((marketValue - totalCost) / totalCost) * 100,
  };

  res.status(200).json({ holdings, cash, metrics });
}
