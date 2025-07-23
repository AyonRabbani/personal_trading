import { useState } from 'react';

interface PriceHistory {
  symbol: string;
  prices: { t: number; c: number }[];
}

export default function HomePage() {
  const [ticker, setTicker] = useState('');
  const [portfolio, setPortfolio] = useState<PriceHistory[]>([]);

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
      <ul className="space-y-2">
        {portfolio.map((item) => (
          <li key={item.symbol} className="border p-2">
            <strong>{item.symbol}</strong> - {item.prices.length} days loaded
          </li>
        ))}
      </ul>
    </div>
  );
}
