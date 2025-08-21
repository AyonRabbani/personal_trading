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

// Autumn/Summer theme defaults
ChartJS.defaults.color = '#333333';
ChartJS.defaults.borderColor = '#FF7F50';
ChartJS.defaults.font.family = 'Helvetica';

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
          backgroundColor: 'rgba(255, 127, 80, 0.5)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
          labels: { color: '#333333' },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => ctx.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      x: {
          ticks: { color: '#333333' },
          grid: { color: '#FFE4B5' },
      },
      y: {
        min: 0,
        max: 1,
          ticks: {
            color: '#333333',
            callback: (value) => Number(value).toFixed(1),
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

