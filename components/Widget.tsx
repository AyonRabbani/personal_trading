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
  const divTaxData = (() => {
    if (!data) return { div: [], taxPairs: [], divTotal: 0, taxTotal: 0 };
    const TAX_RATE = 0.15;
    let taxAcc = 0;
    let divAcc = 0;
    const pairs = data.levered.equity.map((p, i) => {
      if (i > 0) {
        const diff = p.value - data.levered.equity[i - 1].value;
        if (diff > 0) {
          divAcc += diff;
          taxAcc += diff * TAX_RATE;
        }
      }
      return { date: p.date, dividends: divAcc, taxes: taxAcc };
    });
    const weeklyDiv = data.levered.equity.slice(1).map((p, i) => ({
      date: p.date,
      value: Math.max(0, p.value - data.levered.equity[i].value),
    }));
    return { div: weeklyDiv, taxPairs: pairs, divTotal: divAcc, taxTotal: taxAcc };
  })();

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
        return <DividendsChart data={divTaxData.div} />;
      case "tax":
        return (
          <DividendTaxChart
            data={divTaxData.taxPairs}
            dividendsTotal={divTaxData.divTotal}
            taxTotal={divTaxData.taxTotal}
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
