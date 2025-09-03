"use client";
import { useState, useEffect } from "react";
import { useBacktestStore } from "@/lib/store";
import type { TimePoint } from "@/lib/types";
import EquityNmvLoanChart from "./EquityNmvLoanChart";
import MarginChart from "./MarginChart";
import DividendsChart from "./DividendsChart";
import BucketChart from "./BucketChart";
import MetricsCards from "./MetricsCards";
import TickerStatsTable from "./TickerStatsTable";
import RollingReturnChart from "./RollingReturnChart";
import DividendTaxChart from "./DividendTaxChart";

const TAX_RATE = 0.15; // 15% dividend tax assumption

export default function ResultsTabs() {
  const data = useBacktestStore((s) => s.data);
  const [days, setDays] = useState(0);
  useEffect(() => {
    if (data) setDays(data.levered.equity.length);
  }, [data]);
  if (!data) return <div>No results</div>;

  const maxDays = data.levered.equity.length;

  // accumulate reinvested dividends and tax liability
  let taxAcc = 0;
  let divAcc = 0;
  const divTaxAll = data.levered.equity.map((p, i) => {
    if (i > 0) {
      const diff = p.value - data.levered.equity[i - 1].value;
      if (diff > 0) {
        divAcc += diff;
        taxAcc += diff * TAX_RATE;
      }
    }
    return { date: p.date, dividends: divAcc, taxes: taxAcc };
  });

  const dividendsTotal = divAcc;
  const taxesTotal = taxAcc;

  const weeklyDivAll = data.levered.equity.slice(1).map((p, i) => ({
    date: p.date,
    value: Math.max(0, p.value - data.levered.equity[i].value),
  }));

  function slice(arr: TimePoint[]) {
    return arr.slice(-days);
  }
  const levered = slice(data.levered.equity);
  const nmv = slice(data.levered.nmv);
  const loan = slice(data.levered.loan);
  const unlevered = slice(data.unlevered.equity);
  const divTax = divTaxAll.slice(-days);
  const marginRatio = slice(data.levered.marginRatio);
  const marginCalls = data.levered.marginCalls.filter(
    (c) => new Date(c.date) >= new Date(levered[0].date)
  );
  const weeklyDiv = weeklyDivAll.slice(-Math.max(days - 1, 0));

  // rolling 30-day returns
  function rolling(series: TimePoint[], window = 30) {
    const res: TimePoint[] = [];
    for (let i = window; i < series.length; i++) {
      res.push({
        date: series[i].date,
        value: series[i].value / series[i - window].value - 1,
      });
    }
    return res;
  }
  const rollLevered = rolling(data.levered.equity).slice(
    -Math.max(days - 30, 0)
  );
  const rollUnlevered = rolling(data.unlevered.equity).slice(
    -Math.max(days - 30, 0)
  );

  const bucketData = [
    { name: "Unlevered", value: unlevered.at(-1)?.value ?? 0 },
    { name: "Levered", value: levered.at(-1)?.value ?? 0 },
    { name: "Tax Liability", value: taxesTotal },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={30}
          max={maxDays}
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-24 text-sm text-gray-600 text-right">{days}d</span>
      </div>
      <EquityNmvLoanChart
        levered={levered}
        nmv={nmv}
        loan={loan}
        unlevered={unlevered}
      />
      <MarginChart data={marginRatio} calls={marginCalls} />
      <RollingReturnChart levered={rollLevered} unlevered={rollUnlevered} />
      <TickerStatsTable stats={data.tickerStats} />
      <DividendsChart data={weeklyDiv} />
      <DividendTaxChart
        data={divTax}
        dividendsTotal={dividendsTotal}
        taxTotal={taxesTotal}
      />
      <BucketChart data={bucketData} />
      <MetricsCards metrics={data.levered.metrics} />
    </div>
  );
}
