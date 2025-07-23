import React from 'react';

export interface PortfolioMetricChartProps {
  title: string;
  values: number[];
}

export default function PortfolioMetricChart({ title, values }: PortfolioMetricChartProps) {
  if (values.length === 0) return null;
  const width = 200;
  const height = 100;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const scaleX = width / (values.length - 1);
  const scaleY = max === min ? 1 : height / (max - min);
  const points = values
    .map((v, i) => `${i * scaleX},${height - (v - min) * scaleY}`)
    .join(' ');

  return (
    <div className="p-4 bg-gray-100 rounded-md text-sm">
      <div className="mb-1 font-semibold">{title}</div>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
      >
        <polyline points={points} fill="none" stroke="#60a5fa" strokeWidth={2} />
      </svg>
    </div>
  );
}
