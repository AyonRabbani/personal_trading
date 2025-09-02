"use client";

import { useState } from "react";
import Controls from "../components/Controls";
import ResultsTabs from "../components/ResultsTabs";
import { BacktestResponse } from "../lib/types";

export default function Page() {
  const [data, setData] = useState<BacktestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const params = {
    period: "1y" as const,
    interval: "1d" as const,
    initialCapital: 6000,
    monthlyDeposit: 2000,
    lookbackDays: 30,
    coreFrac: 0.4,
    maintReq: 0.25,
    bufferPts: 0.05,
    donorRotation: false,
  };

  async function run(tickers: string[]) {
    setLoading(true);
    try {
      const res = await fetch("/api/backtest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, tickers }),
      });
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <Controls onRun={run} />
      {loading && <div>Running...</div>}
      {data && (
        <ResultsTabs data={data} maint={params.maintReq} buffer={params.bufferPts} />
      )}
    </div>
  );
}
