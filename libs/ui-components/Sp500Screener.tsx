import React from 'react';

export interface ScreenResult {
  symbol: string;
  industry: string;
  momentum: number;
  volatility: number;
  valuation: number;
  rank: number;
}

export default function Sp500Screener({ results }: { results: ScreenResult[] }) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left">Symbol</th>
            <th className="px-2 py-1 text-left">Industry</th>
            <th className="px-2 py-1 text-right">Momentum</th>
            <th className="px-2 py-1 text-right">Volatility</th>
            <th className="px-2 py-1 text-right">Value vs Industry</th>
            <th className="px-2 py-1 text-right">Rank</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {results.map((r) => (
            <tr key={r.symbol}>
              <td className="px-2 py-1">{r.symbol}</td>
              <td className="px-2 py-1">{r.industry}</td>
              <td className="px-2 py-1 text-right">{r.momentum.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{r.volatility.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{r.valuation.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{(r.rank * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
