"use client";
import { useState } from "react";
import { useBacktestStore } from "@/lib/store";

export default function Controls() {
  const [tickers, setTickers] = useState("YBTC,ULTY");
  const setData = useBacktestStore((s) => s.setData);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const symbols = tickers
      .split(",")
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    const res = await fetch("/api/backtest", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tickers: symbols }),
    });
    const json = await res.json();
    setData(json);
  }

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        className="border p-2 flex-1"
        value={tickers}
        onChange={(e) => setTickers(e.target.value)}
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2">
        Run
      </button>
    </form>
  );
}
