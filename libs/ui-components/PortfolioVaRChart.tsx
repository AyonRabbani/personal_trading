import React from 'react';

export interface Props {
  returns: number[];
  varValue: number;
}

export default function PortfolioVaRChart({ returns, varValue }: Props) {
  const bins = 20;
  const min = Math.min(...returns, 0);
  const max = Math.max(...returns, 0);
  const step = (max - min) / bins || 1;
  const counts = new Array(bins).fill(0);
  for (const r of returns) {
    const idx = Math.min(bins - 1, Math.floor((r - min) / step));
    counts[idx]++;
  }
  const height = 100;
  const width = 200;
  const maxCount = Math.max(...counts, 1);
  const barWidth = width / bins;

  const bars = counts.map((c, i) => {
    const h = (c / maxCount) * height;
    return (
      <rect
        key={i}
        x={i * barWidth}
        y={height - h}
        width={barWidth - 1}
        height={h}
        fill="#93c5fd"
      />
    );
  });

  const varX = ((varValue / (max - min)) * width) - ((min / (max - min)) * width);

  return (
    <div className="p-4 bg-gray-100 rounded-md text-sm">
      <div className="mb-1 font-semibold">Portfolio VaR</div>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}
        className="w-full">
        {bars}
        <line
          x1={varX}
          x2={varX}
          y1={0}
          y2={height}
          stroke="red"
          strokeWidth={2}
        />
      </svg>
      <div className="mt-1">VaR(95%): {varValue.toFixed(2)}</div>
    </div>
  );
}
