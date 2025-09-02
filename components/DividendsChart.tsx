"use client";
import { TimePoint } from "@/lib/types";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DividendsChart({ data }: { data: TimePoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip />
          <Bar dataKey="value" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
