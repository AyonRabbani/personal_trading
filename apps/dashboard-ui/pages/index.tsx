import { useState, useEffect } from 'react';
import PriceHistoryChart from '@workspace/ui-components/PriceHistoryChart';
import PortfolioVaRChart from '@workspace/ui-components/PortfolioVaRChart';
import { portfolioVaR, Position } from '@workspace/risk/var';

interface PriceHistory {
  symbol: string;
  prices: { t: number; c: number }[];
}

export default function HomePage() {
  const [ticker, setTicker] = useState('');
  const [portfolio, setPortfolio] = useState<PriceHistory[]>([]);
  const [varValue, setVarValue] = useState(0);
  const [returns, setReturns] = useState<number[]>([]);

  const addTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;
    try {
      const res = await fetch(`/api/history?symbol=${ticker.toUpperCase()}`);
      const data = await res.json();
      setPortfolio((p) => [...p, { symbol: ticker.toUpperCase(), prices: data.results || [] }]);
      setTicker('');
    } catch {
      // ignore errors for simplicity
    }
  };

  useEffect(() => {
    if (portfolio.length === 0) {
      setVarValue(0);
      setReturns([]);
      return;
    }
    const minLen = Math.min(...portfolio.map((p) => p.prices.length));
    if (minLen < 2) {
      setVarValue(0);
      setReturns([]);
      return;
    }
    const positions: Position[] = portfolio.map((p) => ({
      quantity: 1,
      prices: p.prices.slice(-minLen).map((x) => x.c),
    }));
    const v = portfolioVaR(positions, 0.95);
    setVarValue(v);
    const n = positions[0].prices.length;
    const values: number[] = [];
    for (let i = 0; i < n; i++) {
      const val = positions.reduce((sum, pos) => sum + pos.prices[i] * pos.quantity, 0);
      values.push(val);
    }
    const rets: number[] = [];
    for (let i = 1; i < values.length; i++) {
      rets.push((values[i] - values[i - 1]) / values[i - 1]);
    }
    setReturns(rets);
  }, [portfolio]);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Portfolio Price History</h1>
      <form onSubmit={addTicker} className="space-x-2">
        <input
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          placeholder="Ticker"
          className="border px-2 py-1"
        />
        <button type="submit" className="bg-blue-600 text-white px-2 py-1">
          Add
        </button>
      </form>
      <div className="grid gap-4 md:grid-cols-2">
        {portfolio.map((item) => (
          <PriceHistoryChart
            key={item.symbol}
            symbol={item.symbol}
            prices={item.prices.map((p) => p.c)}
          />
        ))}
      </div>
      {returns.length > 0 && (
        <PortfolioVaRChart returns={returns} varValue={varValue} />
      )}
    </div>
  );
}
