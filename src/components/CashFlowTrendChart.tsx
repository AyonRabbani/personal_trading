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
    '#4bc0c0',
    '#ff6384',
    '#36a2eb',
    '#ff9f40',
    '#9966ff',
    '#c9cbcf',
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
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `$${ctx.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => `$${Number(value) / 1e9}B`,
        },
      },
    },
  };

  return <Line data={data} options={options} />;
}
