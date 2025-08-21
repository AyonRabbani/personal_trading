'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  type TooltipItem,
  type ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

ChartJS.defaults.color = '#00FF00';
ChartJS.defaults.borderColor = '#333';
ChartJS.defaults.font.family = 'monospace';

interface Props {
  labels: string[];
  values: number[]; // momentum as decimal
}

export default function MomentumChart({ labels, values }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Momentum',
        data: values,
        backgroundColor: values.map((v) =>
          v >= 0 ? 'rgba(0, 255, 0, 0.5)' : 'rgba(255, 0, 0, 0.5)'
        ),
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { color: '#00FF00' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${(ctx.parsed.y * 100).toFixed(2)}%`,
        },
      },
    },
    scales: {
      x: { ticks: { color: '#00FF00' }, grid: { color: '#333' } },
      y: {
        ticks: {
          color: '#00FF00',
          callback: (value) => `${(Number(value) * 100).toFixed(0)}%`,
        },
        grid: { color: '#333' },
      },
    },
  };

  return <Bar data={data} options={options} style={{ backgroundColor: '#000' }} />;
}
