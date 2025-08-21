'use client';

import { useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
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

interface DailyBar {
  date: string;
  close: number;
  volume: number;
}

interface Props {
  tickers: string[];
  histories: DailyBar[][];
}

export default function RollingCorrelationChart({ tickers, histories }: Props) {
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);

  function calcReturns(prices: number[]): number[] {
    const res: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      res.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return res;
  }

  function corr(a: number[], b: number[]): number {
    const n = a.length;
    const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n;
    const meanA = mean(a);
    const meanB = mean(b);
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    return num / Math.sqrt(denA * denB);
  }

  const window = 5;
  const returns = useMemo(
    () => histories.map((h) => calcReturns(h.map((d) => d.close))),
    [histories]
  );

  const labels = histories[0].slice(window).map((d) => d.date);

  const series = useMemo(() => {
    const ra = returns[a];
    const rb = returns[b];
    const res: number[] = [];
    for (let i = window; i < ra.length; i++) {
      const sliceA = ra.slice(i - window, i);
      const sliceB = rb.slice(i - window, i);
      res.push(corr(sliceA, sliceB));
    }
    return res;
  }, [a, b, returns]);

  const data = {
    labels,
    datasets: [
      {
        label: `${tickers[a]} vs ${tickers[b]}`,
        data: series,
        borderColor: '#FF7F50',
        backgroundColor: '#FF7F5033',
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      x: { ticks: { color: '#333333' }, grid: { color: '#FFE4B5' } },
      y: {
        min: -1,
        max: 1,
        ticks: { color: '#333333' },
        grid: { color: '#FFE4B5' },
      },
    },
  };

  return (
    <div style={{ fontFamily: 'Helvetica', color: '#333333' }}>
      <div style={{ marginBottom: '8px' }}>
        <select
          value={a}
          onChange={(e) => setA(Number(e.target.value))}
          style={{ marginRight: '8px' }}
        >
          {tickers.map((t, i) => (
            <option key={t} value={i}>
              {t}
            </option>
          ))}
        </select>
        <select value={b} onChange={(e) => setB(Number(e.target.value))}>
          {tickers.map((t, i) => (
            <option key={t} value={i}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <Line data={data} options={options} style={{ backgroundColor: '#FFF5E1' }} />
    </div>
  );
}

