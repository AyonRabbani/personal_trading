"use client";
import { TimePoint } from "@/lib/types";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  levered: TimePoint[];
  unlevered: TimePoint[];
}

export default function RollingReturnChart({ levered, unlevered }: Props) {
  const data = levered.map((p, i) => ({
    date: p.date,
    levered: p.value,
    unlevered: unlevered[i]?.value,
  }));

  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Rolling 30-Day Return</h3>
        <p className="text-sm text-gray-600">
          Each line plots the 30-day cumulative return for the levered and
          unlevered portfolios.
        </p>
        <p className="text-xs text-gray-500">
          Formula: <code>{"R_t = E_t / E_{t-30} - 1"}</code>
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Rolling 30-Day Return</title>
            <desc>
              Rolling 30-day return computed as equity today divided by equity 30
              days prior minus one.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="levered" stroke="#8884d8" dot={false} />
            <Line type="monotone" dataKey="unlevered" stroke="#000000" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
