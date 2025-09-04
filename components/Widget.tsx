"use client";
import { useState } from "react";
import Controls from "./Controls";
import MetricsPanel from "./MetricsPanel";
import PriceChart from "./PriceChart";
import PortfolioChart from "./PortfolioChart";
import DividendsChart from "./DividendsChart";
import DividendTaxChart from "./DividendTaxChart";
import { useBacktestStore } from "@/lib/store";

export type ModuleKey =
  | "inputs"
  | "price"
  | "metrics"
  | "portfolio"
  | "dividends"
  | "tax";

const options: { value: ModuleKey; label: string }[] = [
  { value: "inputs", label: "Inputs" },
  { value: "price", label: "Price Chart" },
  { value: "metrics", label: "Metrics" },
  { value: "portfolio", label: "Portfolio" },
  { value: "dividends", label: "Dividends" },
  { value: "tax", label: "Tax" },
];

export default function Widget({
  defaultModule,
  className = "",
}: {
  defaultModule: ModuleKey;
  className?: string;
}) {
  const [module, setModule] = useState<ModuleKey>(defaultModule);
  const data = useBacktestStore((s) => s.data);

  function render() {
    switch (module) {
      case "inputs":
        return <Controls />;
      case "price":
        return <PriceChart />;
      case "metrics":
        return <MetricsPanel />;
      case "portfolio":
        return <PortfolioChart />;
      case "dividends":
        return <DividendsChart data={data?.dividends || []} />;
      case "tax":
        return (
          <DividendTaxChart
            data={data?.dividendTax || []}
            dividendsTotal={data?.divTotal || 0}
            taxTotal={data?.taxTotal || 0}
          />
        );
      default:
        return null;
    }
  }

  return (
    <div
      className={`border p-2 bg-black text-green-400 font-mono h-full ${className}`}
    >
      <div className="flex justify-end mb-2">
        <select
          value={module}
          onChange={(e) => setModule(e.target.value as ModuleKey)}
          className="bg-black text-green-400 border"
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="h-[calc(100%-2rem)] overflow-auto">{render()}</div>
    </div>
  );
}
