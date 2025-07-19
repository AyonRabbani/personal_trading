import React from 'react';
import { Signal } from './SignalList';
import { Holding } from './PortfolioOverview';

export interface Props {
  signals: Signal[];
  holdings: Holding[];
}

/**
 * Very simple risk overview showing open positions and top signal risk.
 */
export default function RiskDashboard({ signals, holdings }: Props) {
  const openPositions = holdings.length;
  const maxRisk = signals.reduce((max, s) => Math.max(max, Math.abs(s.risk)), 0);
  return (
    <div className="p-4 bg-gray-100 rounded-md text-sm space-y-2">
      <div className="font-semibold">Risk Overview</div>
      <div>Open Positions: {openPositions}</div>
      <div>Max Signal Risk: {maxRisk.toFixed(2)}</div>
    </div>
  );
}
