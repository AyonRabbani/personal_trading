import React from 'react';

export interface MacroMetrics {
  yieldCurve: number;
  realRate: number;
  unemployment: number;
  gdpGrowth: number;
  vix: number;
  dxyMomentum: number;
}

export interface Props {
  metrics: MacroMetrics;
}

/**
 * Display a grid of macroeconomic metrics.
 */
export default function MacroMetrics({ metrics }: Props) {
  const items = [
    { label: 'Yield Curve (10y-2y)', value: metrics.yieldCurve.toFixed(2) },
    { label: 'Real Rate (10y-CPI)', value: metrics.realRate.toFixed(2) },
    { label: 'Unemployment %', value: metrics.unemployment.toFixed(2) },
    { label: 'GDP QoQ %', value: metrics.gdpGrowth.toFixed(2) },
    { label: 'VIX Level', value: metrics.vix.toFixed(2) },
    { label: 'USD 30d Momentum', value: (metrics.dxyMomentum * 100).toFixed(2) + '%' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
      {items.map((m) => (
        <div key={m.label} className="p-2 bg-gray-100 rounded-md">
          <div className="text-gray-500">{m.label}</div>
          <div className="font-semibold">{m.value}</div>
        </div>
      ))}
    </div>
  );
}
