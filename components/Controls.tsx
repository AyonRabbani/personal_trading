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
    // Ensure bufferPts never exceeds backend limit to avoid request errors
    const bufferPts = Math.min(0.15, Math.max(0, 1 / leverage - maintReq));
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

  // Run a single backtest on mount with default parameters
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
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-col gap-4 p-4 sm:p-6"
    >
      <textarea
        className="h-24 w-full rounded-md border border-neutral-700 bg-neutral-800 p-2 text-neutral-100"
        value={tickers}
        onChange={(e) => setInputs({ tickers: e.target.value })}
      />
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col text-sm">
          Capital
          <input
            type="number"
            className="rounded border border-neutral-700 bg-neutral-800 p-1 text-neutral-100"
            value={initialCapital}
            onChange={(e) =>
              setInputs({ initialCapital: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-1 flex-col text-sm">
          Monthly
          <input
            type="number"
            className="rounded border border-neutral-700 bg-neutral-800 p-1 text-neutral-100"
            value={monthlyDeposit}
            onChange={(e) =>
              setInputs({ monthlyDeposit: Number(e.target.value) })
            }
          />
        </label>
        <label className="flex flex-1 flex-col text-sm">
          Leverage
          <input
            type="number"
            step={0.1}
            className="rounded border border-neutral-700 bg-neutral-800 p-1 text-neutral-100"
            value={leverage}
            onChange={(e) =>
              setInputs({ leverage: Number(e.target.value) })
            }
          />
        </label>
      </div>
      <div className="flex flex-col">
        <div className="flex flex-col items-center gap-2 sm:flex-row">
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
          <span className="w-16 text-right text-sm text-gray-400">
            {RANGES[rangeIdx]}
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Determines how far back to fetch history.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          type="submit"
          className="w-full rounded bg-blue-600 px-4 py-2 text-white sm:w-auto"
        >
          Run
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="w-full rounded bg-gray-700 px-4 py-2 text-white sm:w-auto"
        >
          Export CSV
        </button>
      </div>
    </form>
  );
}
