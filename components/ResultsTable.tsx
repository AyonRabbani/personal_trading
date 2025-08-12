import React from 'react';

export interface Result {
  strategy: string;
  expiry: string;
  strikes: string;
  credit: number;
  maxLoss: number;
  ror: number;
  annualized: number;
  pop: number;
  ivr: number;
  quality: boolean;
}

interface ResultsTableProps {
  results: Result[];
  onSelect?: (r: Result) => void;
}

export default function ResultsTable({ results, onSelect }: ResultsTableProps) {
  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className="text-left p-2">Strategy</th>
          <th className="text-left p-2">Expiry</th>
          <th className="text-left p-2">Strikes</th>
          <th className="text-right p-2">Credit</th>
          <th className="text-right p-2">Max Loss</th>
          <th className="text-right p-2">ROR</th>
          <th className="text-right p-2">Annualized</th>
          <th className="text-right p-2">POP</th>
          <th className="text-right p-2">IVR</th>
          <th className="text-center p-2">Quality</th>
        </tr>
      </thead>
      <tbody>
        {results.map((r, i) => (
          <tr
            key={i}
            className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => onSelect?.(r)}
          >
            <td className="p-2">{r.strategy}</td>
            <td className="p-2">{r.expiry}</td>
            <td className="p-2">{r.strikes}</td>
            <td className="p-2 text-right">{r.credit.toFixed(2)}</td>
            <td className="p-2 text-right">{r.maxLoss.toFixed(2)}</td>
            <td className="p-2 text-right">{(r.ror * 100).toFixed(1)}%</td>
            <td className="p-2 text-right">{(r.annualized * 100).toFixed(1)}%</td>
            <td className="p-2 text-right">{(r.pop * 100).toFixed(1)}%</td>
            <td className="p-2 text-right">{(r.ivr * 100).toFixed(1)}%</td>
            <td className="p-2 text-center">{r.quality ? '✅' : '⚠️'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
