"use client";
import { useMemo } from "react";
import { useBacktestStore } from "@/lib/store";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function PriceChart() {
  const data = useBacktestStore((s) => s.data);
  const chartData = useMemo(() => {
    const prices = data?.prices;
    if (!prices) return [];
    const tickers = Object.keys(prices);
    if (tickers.length === 0) return [];
    const length = prices[tickers[0]].length;
    const arr: Record<string, number | string>[] = [];
    for (let i = 0; i < length; i++) {
      const date = prices[tickers[0]][i].date;
      const point: Record<string, number | string> = { date };
      for (const t of tickers) {
        point[t] = prices[t][i]?.close ?? null;
      }
      arr.push(point);
    }
    return arr;
  }, [data]);

  if (!data) return <div>No data</div>;
  const prices = data.prices;
  const tickers = Object.keys(prices);

  const colors = [
    "#00ff00",
    "#ff0000",
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff00ff",
  ];

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip />
          <Legend />
          {tickers.map((t, i) => (
            <Line key={t} type="monotone" dataKey={t} stroke={colors[i % colors.length]} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
