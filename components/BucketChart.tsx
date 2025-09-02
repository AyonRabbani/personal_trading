"use client";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";

interface BucketDatum {
  name: string;
  value: number;
}

const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042"];

export default function BucketChart({ data }: { data: BucketDatum[] }) {
  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Ending Equity Buckets</h3>
        <p className="text-sm text-gray-600">
          Each slice shows the final equity for the unlevered and levered
          strategies at the end of the backtest.
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <title>Ending Equity Buckets</title>
            <desc>
              Values represent ending equity for each strategy; larger slices
              indicate greater terminal equity.
            </desc>
            <Pie data={data} dataKey="value" nameKey="name" label>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
