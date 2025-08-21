'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
  type ScriptableContext,
} from 'chart.js';
import { MatrixController, MatrixElement } from 'chartjs-chart-matrix';
import { Chart } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  MatrixController,
  MatrixElement,
  Tooltip,
  Legend
);

interface Props {
  labels: string[];
  matrix: number[][]; // matrix[i][j]
}

export default function CorrelationChart({ labels, matrix }: Props) {
  const data = {
    datasets: [
      {
        label: 'Correlation Matrix',
        data: labels.flatMap((_, y) =>
          labels.map((_, x) => ({ x, y, v: matrix[y][x] }))
        ),
        width: (ctx: ScriptableContext<'matrix'>) =>
          ((ctx.chart.chartArea?.width ?? 0) / labels.length) - 1,
        height: (ctx: ScriptableContext<'matrix'>) =>
          ((ctx.chart.chartArea?.height ?? 0) / labels.length) - 1,
        backgroundColor: (ctx: ScriptableContext<'matrix'>) => {
          const value = (ctx.raw as { v: number }).v;
          const normalized = (value + 1) / 2; // map [-1,1] -> [0,1]
          const r = 255;
          const g = Math.round(255 * normalized);
          const b = 0;
          const alpha = Math.abs(value);
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        },
      },
    ],
  };

  const options: ChartOptions<'matrix'> = {
    responsive: true,
    scales: {
      x: {
        type: 'category',
        labels,
        offset: true,
        ticks: {
          color: '#FFA500',
          font: { family: 'Helvetica' },
        },
        grid: { color: '#333' },
      },
      y: {
        type: 'category',
        labels: [...labels],
        offset: true,
        ticks: {
          color: '#FFA500',
          font: { family: 'Helvetica' },
        },
        grid: { color: '#333' },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items) => {
            const item = items[0].raw as { x: number; y: number; v: number };
            return `${labels[item.y]} vs ${labels[item.x]}`;
          },
          label: (ctx) => (ctx.raw as { v: number }).v.toFixed(2),
        },
        titleFont: { family: 'Helvetica' },
        bodyFont: { family: 'Helvetica' },
      },
    },
  };

  return (
    <Chart
      type="matrix"
      data={data}
      options={options}
      style={{ backgroundColor: '#000', fontFamily: 'Helvetica' }}
    />
  );
}

