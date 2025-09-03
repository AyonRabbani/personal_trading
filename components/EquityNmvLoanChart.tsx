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
  afterTax: TimePoint[];
}

export default function EquityNmvLoanChart({
  levered,
  nmv,
  loan,
  unlevered,
  afterTax,
}: Props) {
  const data = levered.map((p, i) => ({
    date: p.date,
    levered: p.value,
    nmv: nmv[i]?.value,
    loan: loan[i]?.value,
    unlevered: unlevered[i]?.value,
    afterTax: afterTax[i]?.value,
  }));

  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Equity, Net Market Value and Loan</h3>
        <p className="text-sm text-gray-600">
          Levered equity equals net market value minus the margin loan. The lines
          compare levered and unlevered equity alongside net market value and
          loan balances over time. An after-tax line assumes a 15% tax on
          dividend-like gains.
        </p>
        <p className="text-xs text-gray-500">
          Formula: <code>E_t = NMV_t - Loan_t</code>,
          <code>{"E_after_t = E_t - tau * sum_{i<=t} d_i"}</code>
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Equity, Net Market Value and Loan</title>
            <desc>
              Levered equity is calculated as net market value minus the margin
              loan; unlevered equity shows the path without borrowing.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="levered" stroke="#8884d8" dot={false} />
            <Line type="monotone" dataKey="nmv" stroke="#82ca9d" dot={false} />
            <Line type="monotone" dataKey="loan" stroke="#ffc658" dot={false} />
            <Line type="monotone" dataKey="unlevered" stroke="#000000" dot={false} />
            <Line type="monotone" dataKey="afterTax" stroke="#ff0000" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
