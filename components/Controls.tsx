"use client";
import { useEffect } from "react";
import { useBacktestStore } from "@/lib/store";

const RANGES: ("6mo" | "1y" | "2y")[] = ["6mo", "1y", "2y"];
// Default tickers set in the store ensure initial data loads with widely
// traded symbols, avoiding "No results" errors on first render.

export default function Controls() {
  const { data, inputs, setData, setInputs } = useBacktestStore((s) => ({
    data: s.data,
    inputs: s.inputs,
    setData: s.setData,
    setInputs: s.setInputs,
  }));
  const { tickers, rangeIdx, initialCapital, monthlyDeposit, leverage } = inputs;

  async function runBacktest(selectedRange: "6mo" | "1y" | "2y") {
    // allow users to separate tickers by commas, spaces or newlines
    const symbols = tickers
      .split(/[\s,]+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    if (symbols.length === 0) return;
    const maintReq = 0.25;
    const bufferPts = Math.max(0, 1 / leverage - maintReq);
    const res = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tickers: symbols,
        range: selectedRange,
        initialCapital,
        monthlyDeposit,
        bufferPts,
      }),
    });
    if (!res.ok) {
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

  function handleRangeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const idx = Number(e.target.value);
    setInputs({ rangeIdx: idx });
  }

  useEffect(() => {
    runBacktest(RANGES[rangeIdx]).catch(() => {
      /* ignore errors on parameter change */
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers, initialCapital, monthlyDeposit, leverage, rangeIdx]);

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
        className="border p-2 h-24 bg-black text-green-400"
        value={tickers}
        onChange={(e) => setInputs({ tickers: e.target.value })}
      />
      <div className="flex gap-2">
        <label className="flex flex-col text-sm">
          Capital
          <input
            type="number"
            className="border p-1 bg-black text-green-400"
            value={initialCapital}
            onChange={(e) =>
              setInputs({ initialCapital: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col text-sm">
          Monthly
          <input
            type="number"
            className="border p-1 bg-black text-green-400"
            value={monthlyDeposit}
            onChange={(e) =>
              setInputs({ monthlyDeposit: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-col text-sm">
          Leverage
          <input
            type="number"
            step={0.1}
            className="border p-1 bg-black text-green-400"
            value={leverage}
            onChange={(e) =>
              setInputs({ leverage: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Start date</span>
          <input
            type="range"
            min={0}
            max={RANGES.length - 1}
            step={1}
            value={rangeIdx}
            onChange={handleRangeChange}
            className="flex-1"
          />
          <span className="w-16 text-sm text-gray-400 text-right">
            {RANGES[rangeIdx]}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Determines how far back to fetch history.
        </p>
      </div>
      <div className="flex gap-2">
        <button type="submit" className="bg-green-700 text-black px-4 py-2">
          Run
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="bg-gray-700 text-green-400 px-4 py-2"
        >
          Export CSV
        </button>
      </div>
    </form>
  );
}
