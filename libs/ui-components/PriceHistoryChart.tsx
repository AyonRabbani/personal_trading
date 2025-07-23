import React from 'react';

export interface PriceHistoryChartProps {
  symbol: string;
  prices: number[];
}

export default function PriceHistoryChart({ symbol, prices }: PriceHistoryChartProps) {
  if (prices.length === 0) return null;
  const width = 200;
  const height = 100;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const scaleX = width / (prices.length - 1);
  const scaleY = max === min ? 1 : height / (max - min);
  const points = prices
    .map((p, i) => `${i * scaleX},${height - (p - min) * scaleY}`)
    .join(' ');

  return (
    <div className="p-4 bg-gray-100 rounded-md text-sm">
      <div className="mb-1 font-semibold">{symbol} History</div>
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
