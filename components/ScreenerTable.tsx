import { useState } from "react";

export interface StockRow {
  ticker: string;
  ret5d: number;
  ret30d: number;
  ret3m: number;
}

const MOCK_DATA: StockRow[] = [
  { ticker: "AAPL", ret5d: 1.2, ret30d: 4.5, ret3m: 9.8 },
  { ticker: "MSFT", ret5d: -0.3, ret30d: 2.1, ret3m: 5.6 },
  { ticker: "TSLA", ret5d: 3.2, ret30d: 10.5, ret3m: 20.1 },
  { ticker: "NVDA", ret5d: 2.5, ret30d: 8.3, ret3m: 15.4 },
];

export default function ScreenerTable({
  onSelect,
}: {
  onSelect: (ticker: string) => void;
}) {
  const [sortKey, setSortKey] = useState<keyof StockRow>("ret5d");

  const sorted = [...MOCK_DATA].sort((a, b) => b[sortKey] - a[sortKey]);

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th className="cursor-pointer" onClick={() => setSortKey("ticker")}>Ticker</th>
          <th className="cursor-pointer" onClick={() => setSortKey("ret5d")}>5D %</th>
          <th className="cursor-pointer" onClick={() => setSortKey("ret30d")}>30D %</th>
          <th className="cursor-pointer" onClick={() => setSortKey("ret3m")}>3M %</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((row) => (
          <tr
            key={row.ticker}
            onClick={() => onSelect(row.ticker)}
            className="hover:bg-gray-100 cursor-pointer"
          >
            <td className="px-2 py-1 font-medium">{row.ticker}</td>
            <td className="px-2 py-1 text-right">{row.ret5d.toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{row.ret30d.toFixed(2)}</td>
            <td className="px-2 py-1 text-right">{row.ret3m.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
