"use client";
import { useEffect, useState } from "react";
import { useBacktestStore } from "@/lib/store";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PricePoint {
  date: string;
  close: number;
}

export default function PriceChart() {
  const data = useBacktestStore((s) => s.data);
  const tickers = data?.tickerStats.map((t) => t.ticker) || [];
  const [ticker, setTicker] = useState(tickers[0] || "AAPL");
  const [newTicker, setNewTicker] = useState("");
  const [prices, setPrices] = useState<PricePoint[]>([]);

  async function fetchPrices(t: string) {
    const res = await fetch(`/api/price?ticker=${t}`);
    const json = await res.json();
    setPrices(json.prices || []);
  }

  useEffect(() => {
    fetchPrices(ticker).catch(() => {
      /* ignore */
    });
  }, [ticker]);

  function handleAdd() {
    if (!newTicker) return;
    const t = newTicker.toUpperCase();
    setTicker(t);
    fetchPrices(t).catch(() => {
      /* ignore */
    });
    setNewTicker("");
  }

  return (
    <div>
      <div className="flex gap-2 mb-2">
        <select
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          className="bg-black text-green-400 border"
        >
          {tickers.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          value={newTicker}
          onChange={(e) => setNewTicker(e.target.value)}
          placeholder="Add"
          className="border px-1 bg-black text-green-400"
        />
        <button onClick={handleAdd} className="border px-2">
          Add
        </button>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={prices} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="close" stroke="#00ff00" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
