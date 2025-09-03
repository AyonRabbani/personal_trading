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
  ReferenceDot,
} from "recharts";

export default function MarginChart({
  data,
  calls = [],
}: {
  data: TimePoint[];
  calls?: TimePoint[];
}) {
  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Margin Ratio</h3>
        <p className="text-sm text-gray-600">
          Margin ratio is calculated daily as equity divided by net market value
          for the levered portfolio.
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Margin Ratio</title>
            <desc>
              Each point shows equity divided by net market value for the levered
              account on that date.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 1]} />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#82ca9d" dot={false} />
            {calls.map((c) => (
              <ReferenceDot key={c.date} x={c.date} y={c.value} r={4} fill="red" />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
