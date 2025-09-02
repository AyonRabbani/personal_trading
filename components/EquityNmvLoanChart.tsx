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
  nmv: TimePoint[];
  loan: TimePoint[];
  unlevered: TimePoint[];
}

export default function EquityNmvLoanChart({
  levered,
  nmv,
  loan,
  unlevered,
}: Props) {
  const data = levered.map((p, i) => ({
    date: p.date,
    levered: p.value,
    nmv: nmv[i]?.value,
    loan: loan[i]?.value,
    unlevered: unlevered[i]?.value,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="levered" stroke="#8884d8" dot={false} />
          <Line type="monotone" dataKey="nmv" stroke="#82ca9d" dot={false} />
          <Line type="monotone" dataKey="loan" stroke="#ffc658" dot={false} />
          <Line type="monotone" dataKey="unlevered" stroke="#000000" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
