"use client";
import { useBacktestStore } from "@/lib/store";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
} from "recharts";

export default function PortfolioChart() {
  const data = useBacktestStore((s) => s.data);
  if (!data) return <div>No data</div>;
  const equity = data.levered.equity;
  const weeklyDiv = data.levered.equity.slice(1).map((p, i) => ({
    date: p.date,
    value: Math.max(0, p.value - data.levered.equity[i].value),
  }));
  const dots = weeklyDiv.filter((d) => d.value > 0);

  function yFor(date: string) {
    const match = equity.find((e) => e.date === date);
    return match ? match.value : 0;
    }

  return (
    <figure className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={equity} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
            {dots.map((d, i) => (
              <ReferenceDot key={i} x={d.date} y={yFor(d.date)} r={3} fill="#ff0000" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
