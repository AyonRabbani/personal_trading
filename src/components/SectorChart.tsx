"use client";

import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface HistoryPoint {
  date: string;
  close: number;
}

interface Sector {
  name: string;
  ticker: string;
  history: HistoryPoint[];
}

interface Props {
  data: Sector[];
}

const colors = [
  "rgb(255, 99, 132)",
  "rgb(54, 162, 235)",
  "rgb(255, 206, 86)",
  "rgb(75, 192, 192)",
  "rgb(153, 102, 255)",
];

export default function SectorChart({ data }: Props) {
  const labels = data[0]?.history.map((h) => h.date) ?? [];
  const datasets = data.map((s, idx) => ({
    label: s.name,
    data: s.history.map((h) => h.close),
    borderColor: colors[idx % colors.length],
    backgroundColor: colors[idx % colors.length],
  }));

  const chartData = { labels, datasets };

  return <Line data={chartData} />;
}
