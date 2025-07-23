import React, { useState } from 'react';

export interface Holding {
  symbol: string;
  quantity: number;
  costBasis: number;
  purchaseDate?: string;
  currentPrice: number;
}

export interface Metrics {
  totalValue: number;
  dailyChange: number;
  totalReturn: number;
}

export interface Props {
  holdings: Holding[];
  cash: number;
  metrics: Metrics;
}

/**
 * Render a portfolio overview with expandable holdings table.
 */
export default function PortfolioOverview({
  holdings,
  cash,
  metrics,
}: Props) {
  const [showHoldings, setShowHoldings] = useState(false);
  return (
    <div className="p-4 bg-gray-100 rounded-md">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold">Portfolio</h2>
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={() => setShowHoldings((s) => !s)}
        >
          {showHoldings ? 'Hide' : 'Show'} Holdings
        </button>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm mb-2">
        <div>Total Value: ${metrics.totalValue.toFixed(2)}</div>
        <div>Daily P/L: {metrics.dailyChange.toFixed(2)}</div>
        <div>Total Return: {metrics.totalReturn.toFixed(2)}%</div>
      </div>
      {showHoldings && (
        <table className="min-w-full text-sm bg-white mt-2">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-1 text-left">Symbol</th>
              <th className="px-2 py-1 text-left">Qty</th>
              <th className="px-2 py-1 text-left">Cost</th>
              <th className="px-2 py-1 text-left">Price</th>
              <th className="px-2 py-1 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {holdings.map((h) => (
              <tr key={h.symbol + h.purchaseDate} className="border-t">
                <td className="px-2 py-1">{h.symbol}</td>
                <td className="px-2 py-1">{h.quantity}</td>
                <td className="px-2 py-1">{h.costBasis.toFixed(2)}</td>
                <td className="px-2 py-1">{h.currentPrice.toFixed(2)}</td>
                <td className="px-2 py-1">{h.purchaseDate}</td>
              </tr>
            ))}
            <tr className="border-t font-semibold">
              <td className="px-2 py-1">Cash</td>
              <td className="px-2 py-1" colSpan={4}>${cash.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
