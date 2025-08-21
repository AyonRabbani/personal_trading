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
          v >= 0 ? 'rgba(75, 192, 192, 0.5)' : 'rgba(255, 99, 132, 0.5)'
        ),
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${(ctx.parsed.y * 100).toFixed(2)}%`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `${(Number(value) * 100).toFixed(0)}%`,
        },
      },
    },
  };

  return <Bar data={data} options={options} />;
}
