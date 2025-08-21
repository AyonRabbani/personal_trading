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

// Bloomberg terminal style defaults
ChartJS.defaults.color = '#00FF00';
ChartJS.defaults.borderColor = '#333';
ChartJS.defaults.font.family = 'monospace';

interface Props {
  labels: string[];
  values: number[];
}

export default function CashFlowChart({ labels, values }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Normalized Cash Flow',
        data: values,
        backgroundColor: 'rgba(0, 255, 0, 0.5)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#00FF00' },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => ctx.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      x: {
        ticks: { color: '#00FF00' },
        grid: { color: '#333' },
      },
      y: {
        min: 0,
        max: 1,
        ticks: {
          color: '#00FF00',
          callback: (value) => Number(value).toFixed(1),
        },
        grid: { color: '#333' },
      },
    },
  };

  return <Bar data={data} options={options} style={{ backgroundColor: '#000' }} />;
}

