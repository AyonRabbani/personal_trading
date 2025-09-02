"use client";

import { BacktestResponse } from "../lib/types";
import EquityChart from "./EquityChart";
import MarginChart from "./MarginChart";
import MetricsCards from "./MetricsCards";

interface Props {
  data: BacktestResponse;
  maint: number;
  buffer: number;
}

export default function ResultsTabs({ data, maint, buffer }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <MetricsCards
        unlevered={data.unlevered.metrics}
        levered={data.levered.metrics}
      />
      <EquityChart
        unlevered={data.unlevered.equity}
        levered={data.levered.equity}
        nmv={data.levered.nmv}
        loan={data.levered.loan}
      />
      <MarginChart
        ratio={data.levered.marginRatio}
        maint={maint}
        target={maint + buffer}
      />
    </div>
  );
}
