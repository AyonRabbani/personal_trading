"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { TimePoint } from "../lib/types";

interface Props {
  unlevered: TimePoint[];
  levered: TimePoint[];
  nmv: TimePoint[];
  loan: TimePoint[];
}

export default function EquityChart({ unlevered, levered, nmv, loan }: Props) {
  const data = levered.map((p, i) => ({
    date: p.date,
    levered: p.value,
    unlevered: unlevered[i]?.value ?? null,
    nmv: nmv[i]?.value ?? null,
    loan: loan[i]?.value ?? null,
  }));
  return (
    <LineChart width={700} height={300} data={data} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
      <XAxis dataKey="date" hide />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="unlevered" stroke="#8884d8" dot={false} />
      <Line type="monotone" dataKey="levered" stroke="#82ca9d" dot={false} />
      <Line type="monotone" dataKey="nmv" stroke="#ffc658" dot={false} />
      <Line type="monotone" dataKey="loan" stroke="#ff7300" dot={false} />
    </LineChart>
  );
}
