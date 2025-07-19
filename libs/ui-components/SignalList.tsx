import React from 'react';
import { sizePosition } from '@workspace/risk/hold';

export interface Signal {
  symbol: string;
  score: number;
  risk: number;
  timestamp: number;
}

export interface Props {
  signals: Signal[];
  availableCapital: number;
}

/**
 * Render a table of trading signals.
 * New widgets can be added inside libs/ui-components and imported dynamically.
 */
export const SignalList: React.FC<Props> = ({ signals, availableCapital }) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Symbol
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Score
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Risk
          </th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Allocation
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {signals.map((sig) => (
          <tr key={sig.symbol + sig.timestamp}>
            <td className="px-6 py-4 whitespace-nowrap">{sig.symbol}</td>
            <td className="px-6 py-4 whitespace-nowrap">{sig.score.toFixed(2)}</td>
            <td className="px-6 py-4 whitespace-nowrap">{sig.risk.toFixed(2)}</td>
            <td className="px-6 py-4 whitespace-nowrap">
              {sizePosition(sig.score, availableCapital).toFixed(2)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default SignalList;
