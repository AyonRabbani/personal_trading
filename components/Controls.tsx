"use client";
import { useState, useEffect } from "react";
import { useBacktestStore } from "@/lib/store";

const RANGES: ("6mo" | "1y" | "2y")[] = ["6mo", "1y", "2y"];
// Use widely traded tickers by default so the initial dashboard load
// retrieves real market data instead of failing with "No results".
const DEFAULT_TICKERS = "AAPL,MSFT,GOOGL,AMZN,META";

export default function Controls() {
  const [tickers, setTickers] = useState(DEFAULT_TICKERS);
  const [rangeIdx, setRangeIdx] = useState(1); // default to 1y
  const [initialCapital, setInitialCapital] = useState(6000);
  const [monthlyDeposit, setMonthlyDeposit] = useState(2000);
  const [lookbackDays, setLookbackDays] = useState(30);
  const [buffer, setBuffer] = useState(5); // percent
  const data = useBacktestStore((s) => s.data);
  const setData = useBacktestStore((s) => s.setData);

  async function runBacktest(selectedRange: "6mo" | "1y" | "2y") {
    // allow users to separate tickers by commas, spaces or newlines
    const symbols = tickers
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) return;
    const res = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tickers: symbols,
        range: selectedRange,
        initialCapital,
        monthlyDeposit,
        lookbackDays,
        bufferPts: buffer / 100,
      }),
    });
    if (!res.ok) {
      // surface network or validation errors to the console but avoid
      // clobbering existing results
      console.error("Backtest request failed", await res.text());
      return;
    }
    const json = await res.json();
    setData(json);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await runBacktest(RANGES[rangeIdx]);
  }

  async function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = Number(e.target.value);
    setRangeIdx(idx);
    await runBacktest(RANGES[idx]);
  }

  // run once on mount using the defaults so the dashboard populates immediately
  useEffect(() => {
    runBacktest(RANGES[rangeIdx]).catch(() => {
      /* ignore errors on initial load */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportCsv() {
    if (!data) return;
    const rows = data.unlevered.equity
      .map((p) => `${p.date},${p.value}`)
      .join("\n");
    const blob = new Blob([`date,unlevered_equity\n${rows}`], {
      type: "text/csv",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "audit.csv";
    a.click();
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
      <textarea
        className="border p-2 h-24"
        value={tickers}
        onChange={(e) => setTickers(e.target.value)}
      />
      <div className="flex gap-2">
        <label className="flex flex-col text-sm">
          Initial
          <input
            type="number"
            className="border p-1"
            value={initialCapital}
            onChange={(e) => setInitialCapital(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col text-sm">
          Monthly
          <input
            type="number"
            className="border p-1"
            value={monthlyDeposit}
            onChange={(e) => setMonthlyDeposit(Number(e.target.value))}
          />
        </label>
        <label className="flex flex-col text-sm">
          Lookback
          <input
            type="number"
            className="border p-1"
            value={lookbackDays}
            onChange={(e) => setLookbackDays(Number(e.target.value))}
          />
        </label>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Investment timeframe</span>
          <input
            type="range"
            min={0}
            max={RANGES.length - 1}
            step={1}
            value={rangeIdx}
            onChange={handleRangeChange}
            className="flex-1"
          />
          <span className="w-16 text-sm text-gray-600 text-right">
            {RANGES[rangeIdx]}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Determines the starting point of the investment.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={0}
          max={15}
          step={0.5}
          value={buffer}
          onChange={(e) => setBuffer(Number(e.target.value))}
          className="flex-1"
        />
        <span className="w-24 text-sm text-gray-600 text-right">
          Buffer {buffer}% (Maint 25%)
        </span>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Run
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="bg-gray-200 px-4 py-2"
        >
          Export CSV
        </button>
      </div>
    </form>
  );
}
