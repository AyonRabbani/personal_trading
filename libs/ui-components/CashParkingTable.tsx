import React from 'react';

export interface CashCandidate {
  symbol: string;
  industry: string;
  score: number;
  momentum: number;
  volatility: number;
  industryFlow: number;
  peerValueRank: number;
}

export default function CashParkingTable({ data }: { data: CashCandidate[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-2 py-1 text-left">Symbol</th>
            <th className="px-2 py-1 text-left">Industry</th>
            <th className="px-2 py-1 text-right">Score</th>
            <th className="px-2 py-1 text-right">Flow</th>
            <th className="px-2 py-1 text-right">Momentum</th>
            <th className="px-2 py-1 text-right">Volatility</th>
            <th className="px-2 py-1 text-right">Value Rank</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((d) => (
            <tr key={d.symbol}>
              <td className="px-2 py-1">{d.symbol}</td>
              <td className="px-2 py-1">{d.industry}</td>
              <td className="px-2 py-1 text-right">{d.score.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{d.industryFlow.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{d.momentum.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{d.volatility.toFixed(3)}</td>
              <td className="px-2 py-1 text-right">{(d.peerValueRank * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
