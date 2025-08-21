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

interface Props {
  labels: string[];
  values: number[];
}

export default function CashFlowTrendChart({ labels, values }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Daily Cash Flow',
        data: values,
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
      },
    ],
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
