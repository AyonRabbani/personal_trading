import { useState, useEffect } from 'react';
import PriceHistoryChart from '@workspace/ui-components/PriceHistoryChart';
import PortfolioVaRChart from '@workspace/ui-components/PortfolioVaRChart';
import PortfolioMetricChart from '@workspace/ui-components/PortfolioMetricChart';
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
  const [values, setValues] = useState<number[]>([]);
  const [momentum, setMomentum] = useState<number[]>([]);
  const [volatility, setVolatility] = useState<number[]>([]);

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
      setValues([]);
      setMomentum([]);
      setVolatility([]);
      return;
    }
    const days = Math.min(30, minLen);
    const positions: Position[] = portfolio.map((p) => ({
      quantity: 1,
      prices: p.prices.slice(-days).map((x) => x.c),
    }));
    const v = portfolioVaR(positions, 0.95);
    setVarValue(v);
    const n = positions[0].prices.length;
    const vals: number[] = [];
    for (let i = 0; i < n; i++) {
      const val = positions.reduce((sum, pos) => sum + pos.prices[i] * pos.quantity, 0);
      vals.push(val);
    }
    setValues(vals);

    const rets: number[] = [];
    for (let i = 1; i < vals.length; i++) {
      rets.push((vals[i] - vals[i - 1]) / vals[i - 1]);
    }
    setReturns(rets);

    const mom: number[] = vals.map((v) => (v - vals[0]) / vals[0]);
    setMomentum(mom);

    const vol: number[] = [0];
    for (let i = 1; i < rets.length + 1; i++) {
      const slice = rets.slice(0, i);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / slice.length;
      vol.push(Math.sqrt(variance));
    }
    setVolatility(vol);
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
        <>
          <PortfolioVaRChart returns={returns} varValue={varValue} />
          <div className="grid gap-4 md:grid-cols-3">
            <PortfolioMetricChart title="Portfolio Value" values={values} />
            <PortfolioMetricChart title="Momentum" values={momentum} />
            <PortfolioMetricChart title="Volatility" values={volatility} />
          </div>
          <div className="text-sm text-gray-600">
            Momentum is the percentage change in total value from the purchase date.
            Volatility is the standard deviation of daily portfolio returns since purchase.
          </div>
        </>
      )}
    </div>
  );
}
