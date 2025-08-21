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
  values: number[];
}

export default function CorrelationChart({ labels, values }: Props) {
  const data = {
    labels,
    datasets: [
      {
        label: 'Correlation with SPY',
        data: values,
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  };

  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'bar'>) => ctx.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      y: {
        min: -1,
        max: 1,
      },
    },
  };

  return <Bar data={data} options={options} />;
}
