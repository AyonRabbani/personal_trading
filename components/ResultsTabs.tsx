"use client";
import { useBacktestStore } from "@/lib/store";
import EquityChart from "./EquityChart";
import MarginChart from "./MarginChart";
import DividendsChart from "./DividendsChart";
import BucketChart from "./BucketChart";
import MetricsCards from "./MetricsCards";

export default function ResultsTabs() {
  const data = useBacktestStore((s) => s.data);
  if (!data) return <div>No results</div>;

  const weeklyDiv = data.levered.equity.slice(1).map((p, i) => ({
    date: p.date,
    value: Math.max(0, p.value - data.levered.equity[i].value),
  }));

  const bucketData = [
    { name: "Unlevered", value: data.unlevered.equity.at(-1)?.value ?? 0 },
    { name: "Levered", value: data.levered.equity.at(-1)?.value ?? 0 },
  ];

  return (
    <div className="space-y-4">
      <EquityChart data={data.unlevered.equity} />
      <EquityChart data={data.levered.equity} />
      <MarginChart data={data.levered.marginRatio} />
      <DividendsChart data={weeklyDiv} />
      <BucketChart data={bucketData} />
      <MetricsCards metrics={data.levered.metrics} />
    </div>
  );
}
