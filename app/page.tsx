'use client';

import { useState } from 'react';
import PortfolioCharts from '@/components/PortfolioCharts';
import MarginAnalysis from '@/components/MarginAnalysis';

export default function HomePage() {
  const [tickers, setTickers] = useState('');
  const [start, setStart] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [initial, setInitial] = useState(1000);
  const [monthly, setMonthly] = useState(0);
  interface PortfolioResponse {
    portfolio: { date: string; value: number }[];
    weeklyDividends: { week: string; amount: number }[];
    taxes: { date: string; amount: number }[];
    margin: { date: string; loan: number; cash: number; uec: number }[];
    dividends: { date: string; amount: number }[];
    prices?: { date: string; [ticker: string]: number | string }[];
  }
  const [data, setData] = useState<PortfolioResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tickers: tickers.split(',').map((t) => t.trim().toUpperCase()),
        start,
        leverage,
        initial,
        monthly,
      }),
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4">
      <h1 className="text-2xl font-bold text-center mb-4 text-emerald-700">Dividend Portfolio Dashboard</h1>
      <form onSubmit={handleSubmit} className="max-w-md mx-auto bg-white p-4 rounded shadow space-y-2">
        <div>
          <label className="block text-sm font-medium">Tickers (comma separated)</label>
          <input
            value={tickers}
            onChange={(e) => setTickers(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            placeholder="AAPL,MSFT"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="mt-1 w-full border rounded p-2"
            required
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-sm font-medium">Leverage</label>
            <input
              type="number"
              value={leverage}
              onChange={(e) => setLeverage(Number(e.target.value))}
              className="mt-1 w-full border rounded p-2"
              min={1}
              step={0.1}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Initial Capital</label>
            <input
              type="number"
              value={initial}
              onChange={(e) => setInitial(Number(e.target.value))}
              className="mt-1 w-full border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Monthly Injection</label>
            <input
              type="number"
              value={monthly}
              onChange={(e) => setMonthly(Number(e.target.value))}
              className="mt-1 w-full border rounded p-2"
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded hover:bg-emerald-700">
          Build Portfolio
        </button>
      </form>
      {loading && <p className="text-center mt-4">Loading...</p>}
      {data && (
        <div className="mt-8 space-y-8">
          <PortfolioCharts
            portfolio={data.portfolio}
            weeklyDividends={data.weeklyDividends}
            taxes={data.taxes}
          />
          <MarginAnalysis margin={data.margin} dividends={data.dividends} prices={data.prices} />
        </div>
      )}
    </main>
  );
}
