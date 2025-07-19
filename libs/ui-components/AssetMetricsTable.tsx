import React from 'react';

export interface AssetMetric {
  symbol: string;
  momentum: number;
  risk: number;
  sentiment: number;
}

export interface Props {
  metrics: AssetMetric[];
}

/**
 * Display a table of asset metrics.
 */
export default function AssetMetricsTable({ metrics }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left">Symbol</th>
            <th className="px-2 py-1 text-left">Momentum</th>
            <th className="px-2 py-1 text-left">Risk</th>
            <th className="px-2 py-1 text-left">Sentiment</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {metrics.map((m) => (
            <tr key={m.symbol}>
              <td className="px-2 py-1">{m.symbol}</td>
              <td className="px-2 py-1">{m.momentum.toFixed(4)}</td>
              <td className="px-2 py-1">{m.risk.toFixed(4)}</td>
              <td className="px-2 py-1">{m.sentiment.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
