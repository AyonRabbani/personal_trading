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
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Weekly Dividends</h3>
        <p className="text-sm text-gray-600">
          Bars show positive week‑over‑week changes in levered equity, which we
          treat as dividend income.
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Weekly Dividends</title>
            <desc>
              Each bar equals max(0, equity_this_week minus equity_last_week) for
              the levered portfolio.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#ffc658" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
