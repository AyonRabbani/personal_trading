"use client";
import { useBacktestStore } from "@/lib/store";
import { TimePoint } from "@/lib/types";

function maxDrawdown30(series: TimePoint[]): number {
  let maxDD = 0;
  for (let i = 0; i < series.length; i++) {
    let peak = series[i].value;
    for (let j = i + 1; j < Math.min(series.length, i + 30); j++) {
      if (series[j].value > peak) peak = series[j].value;
      const dd = (series[j].value - peak) / peak;
      if (dd < maxDD) maxDD = dd;
    }
  }
  return maxDD;
}

export default function MetricsPanel() {
  const data = useBacktestStore((s) => s.data);
  if (!data) return <div>No data</div>;

  const returnOnCapital = data.levered.metrics.totalReturn * 100;
  const unleveredReturn = data.unlevered.metrics.totalReturn * 100;
  const drawdown = maxDrawdown30(data.levered.equity) * 100;
  const sharpe = data.levered.metrics.sharpe;
  const sortino = data.levered.metrics.sortino;
  const marginCalls = data.levered.marginCalls.length;

  const fmt = (v: number) => v.toFixed(2);

  return (
    <div className="grid grid-cols-2 gap-2 text-sm">
      <div className="p-2 border">Return on capital: {fmt(returnOnCapital)}%</div>
      <div className="p-2 border">Unlevered return: {fmt(unleveredReturn)}%</div>
      <div className="p-2 border">30d max drawdown: {fmt(drawdown)}%</div>
      <div className="p-2 border">Sharpe: {fmt(sharpe)}</div>
      <div className="p-2 border">Sortino: {fmt(sortino)}</div>
      <div className="p-2 border">Margin calls: {marginCalls}</div>
    </div>
  );
}
