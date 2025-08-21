'use client';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  type TooltipItem,
  type ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

ChartJS.defaults.color = '#333333';
ChartJS.defaults.borderColor = '#FF7F50';
ChartJS.defaults.font.family = 'Helvetica';

interface Dataset {
  label: string;
  data: number[];
}

interface Props {
  labels: string[];
  datasets: Dataset[];
}

export default function CashFlowTrendChart({ labels, datasets }: Props) {
  const colors = [
    '#FF7F50',
    '#FFD700',
    '#FFA500',
    '#F08080',
    '#CD5C5C',
    '#98FB98',
    '#20B2AA',
    '#DB7093',
    '#BDB76B',
    '#FF69B4',
  ];

  const data = {
    labels,
    datasets: datasets.map((d, i) => ({
      label: d.label,
      data: d.data,
      borderColor: colors[i % colors.length],
      backgroundColor: `${colors[i % colors.length]}33`,
    })),
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
        legend: {
          position: 'top',
          labels: { color: '#333333' },
        },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `$${ctx.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
        x: { ticks: { color: '#333333' }, grid: { color: '#FFE4B5' } },
      y: {
          ticks: {
            color: '#333333',
            callback: (value) => `$${Number(value) / 1e9}B`,
          },
          grid: { color: '#FFE4B5' },
      },
    },
  };

    return (
      <Line
        data={data}
        options={options}
        style={{ backgroundColor: '#FFF5E1', fontFamily: 'Helvetica' }}
      />
    );
  }
