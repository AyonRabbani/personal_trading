"use client";

import { LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip } from "recharts";
import { TimePoint } from "../lib/types";

interface Props {
  ratio: TimePoint[];
  maint: number;
  target: number;
}

export default function MarginChart({ ratio, maint, target }: Props) {
  return (
    <LineChart width={700} height={300} data={ratio} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
      <XAxis dataKey="date" hide />
      <YAxis domain={[0, 1]} />
      <Tooltip />
      <ReferenceLine y={maint} stroke="red" />
      <ReferenceLine y={target} stroke="orange" />
      <Line type="monotone" dataKey="value" stroke="#82ca9d" dot={false} />
    </LineChart>
  );
}
