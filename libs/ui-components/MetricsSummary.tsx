import React from 'react';

export interface Metric {
  label: string;
  value: string | number;
}

export interface Props {
  metrics: Metric[];
}

/**
 * Display a simple grid of metrics.
 */
export default function MetricsSummary({ metrics }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
      {metrics.map((m) => (
        <div key={m.label} className="p-2 bg-gray-100 rounded-md">
          <div className="text-gray-500">{m.label}</div>
          <div className="font-semibold">{m.value}</div>
        </div>
      ))}
    </div>
  );
}
