'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  type ChartOptions,
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

export default function CrossSectionalChart({ labels, matrix }: Props) {
  const data = {
    datasets: [
      {
        label: 'Correlation Matrix',
        data: labels.flatMap((_, y) =>
          labels.map((_, x) => ({ x, y, v: matrix[y][x] }))
        ),
        width: ({ chart }) =>
          (chart.chartArea ? chart.chartArea.width : 0) / labels.length - 1,
        height: ({ chart }) =>
          (chart.chartArea ? chart.chartArea.height : 0) / labels.length - 1,
        backgroundColor: (ctx: { raw: { v: number } }) => {
          const value = ctx.raw.v;
          const alpha = Math.abs(value);
          return value >= 0
            ? `rgba(75, 192, 192, ${alpha})`
            : `rgba(255, 99, 132, ${alpha})`;
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
      },
      y: {
        type: 'category',
        labels: [...labels],
        offset: true,
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
      },
    },
  };

  return <Chart type="matrix" data={data} options={options} />;
}
