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

export default function EquityChart({ data }: { data: TimePoint[] }) {
  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Equity</h3>
        <p className="text-sm text-gray-600">
          Equity represents net market value minus any outstanding loan on each
          date.
        </p>
        <p className="text-xs text-gray-500">
          Formula: <code>E_t = NMV_t - Loan_t</code>
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Equity</title>
            <desc>
              The line plots equity over time where each point equals net market
              value less loan balance on that date.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#8884d8" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
