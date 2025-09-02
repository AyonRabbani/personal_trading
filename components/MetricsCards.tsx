"use client";
import { Metrics } from "@/lib/types";

export default function MetricsCards({ metrics }: { metrics: Metrics }) {
  const items: [keyof Metrics, string][] = [
    ["totalReturn", "Total Return"],
    ["cagr", "CAGR"],
    ["volAnn", "Vol (ann)"],
    ["sharpe", "Sharpe"],
    ["sortino", "Sortino"],
    ["maxDD", "Max Drawdown"],
    ["hitRate", "Hit Rate"],
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      {items.map(([key, label]) => (
        <div key={key} className="p-2 border rounded">
          <div className="text-sm text-gray-500">{label}</div>
          <div className="font-semibold">
            {metrics[key].toFixed(2)}
          </div>
        </div>
      ))}
    </div>
  );
}
