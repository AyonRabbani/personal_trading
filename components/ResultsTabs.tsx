"use client";
import { useBacktestStore } from "@/lib/store";
import EquityChart from "./EquityChart";
import MarginChart from "./MarginChart";
import MetricsCards from "./MetricsCards";

export default function ResultsTabs() {
  const data = useBacktestStore((s) => s.data);
  if (!data) return <div>No results</div>;

  return (
    <div className="space-y-4">
      <EquityChart data={data.levered.equity} />
      <MarginChart data={data.levered.marginRatio} />
      <MetricsCards metrics={data.levered.metrics} />
    </div>
  );
}
