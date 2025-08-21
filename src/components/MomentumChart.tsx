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

ChartJS.defaults.color = '#333333';
ChartJS.defaults.borderColor = '#FF7F50';
ChartJS.defaults.font.family = 'Helvetica';

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
            v >= 0
              ? 'rgba(46, 139, 87, 0.5)'
              : 'rgba(205, 92, 92, 0.5)'
          ),
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
        legend: { position: 'top', labels: { color: '#333333' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) =>
            `${(ctx.parsed.y * 100).toFixed(2)}%`,
        },
      },
    },
    scales: {
        x: { ticks: { color: '#333333' }, grid: { color: '#FFE4B5' } },
      y: {
          ticks: {
            color: '#333333',
            callback: (value) => `${(Number(value) * 100).toFixed(0)}%`,
          },
          grid: { color: '#FFE4B5' },
      },
    },
  };

    return (
      <Bar
        data={data}
        options={options}
        style={{ backgroundColor: '#FFF5E1', fontFamily: 'Helvetica' }}
      />
    );
  }
