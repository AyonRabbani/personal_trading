"use client";

import { Metrics } from "../lib/types";

interface Props {
  unlevered: Metrics;
  levered: Metrics;
}

function formatPct(x: number) {
  return (x * 100).toFixed(2) + "%";
}

export default function MetricsCards({ unlevered, levered }: Props) {
  const rows = [
    { key: "totalReturn", label: "Total Return" },
    { key: "cagr", label: "CAGR" },
    { key: "volAnn", label: "Vol (ann)" },
    { key: "sharpe", label: "Sharpe" },
    { key: "sortino", label: "Sortino" },
    { key: "maxDD", label: "Max DD" },
    { key: "hitRate", label: "Hit Rate" },
  ] as const;
  return (
    <table className="text-sm">
      <thead>
        <tr>
          <th className="text-left p-1"></th>
          <th className="text-left p-1">Unlevered</th>
          <th className="text-left p-1">Levered</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.key}>
            <td className="p-1">{r.label}</td>
            <td className="p-1">{formatPct(unlevered[r.key])}</td>
            <td className="p-1">{formatPct(levered[r.key])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
