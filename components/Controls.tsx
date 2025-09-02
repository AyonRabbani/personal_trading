"use client";
import { useState } from "react";
import { useBacktestStore } from "@/lib/store";

const RANGES: ("6mo" | "1y" | "2y")[] = ["6mo", "1y", "2y"];

export default function Controls() {
  const [tickers, setTickers] = useState("AAPL,MSFT");
  const [rangeIdx, setRangeIdx] = useState(1); // default to 1y
  const setData = useBacktestStore((s) => s.setData);

  async function runBacktest(selectedRange: "6mo" | "1y" | "2y") {
    const symbols = tickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) return;
    const res = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: symbols, range: selectedRange }),
    });
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

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          className="border p-2 flex-1"
          value={tickers}
          onChange={(e) => setTickers(e.target.value)}
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2">
          Run
        </button>
      </div>
      <div className="flex items-center gap-2">
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
    </form>
  );
}
