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

ChartJS.defaults.color = '#00FF00';
ChartJS.defaults.borderColor = '#333';
ChartJS.defaults.font.family = 'monospace';

interface Dataset {
  label: string;
  data: number[];
}

interface Props {
  labels: string[];
  datasets: Dataset[];
}

export default function CorrelationTrendChart({ labels, datasets }: Props) {
  const colors = [
    '#00ff00',
    '#ffab00',
    '#00bfff',
    '#ff00ff',
    '#ff3333',
    '#ffff00',
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
      legend: { position: 'top', labels: { color: '#00FF00' } },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) => ctx.parsed.y.toFixed(2),
        },
      },
    },
    scales: {
      x: { ticks: { color: '#00FF00' }, grid: { color: '#333' } },
      y: {
        min: -1,
        max: 1,
        ticks: { color: '#00FF00' },
        grid: { color: '#333' },
      },
    },
  };

  return <Line data={data} options={options} style={{ backgroundColor: '#000' }} />;
}
