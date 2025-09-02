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

export default function MarginChart({ data }: { data: TimePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis domain={[0, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#82ca9d" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
