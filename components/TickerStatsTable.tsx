"use client";
import { TickerStat } from "@/lib/store";

export default function TickerStatsTable({ stats }: { stats: TickerStat[] }) {
  if (!stats || stats.length === 0) return null;
  return (
    <table className="min-w-full border text-sm">
      <thead>
        <tr className="bg-gray-100">
          <th className="border px-2 py-1 text-left">Ticker</th>
          <th className="border px-2 py-1 text-right">Total Dividend</th>
          <th className="border px-2 py-1 text-right">Daily Return</th>
        </tr>
      </thead>
      <tbody>
        {stats.map((s) => (
          <tr key={s.ticker}>
            <td className="border px-2 py-1">{s.ticker}</td>
            <td className="border px-2 py-1 text-right">
              {s.totalDividend.toFixed(2)}
            </td>
            <td className="border px-2 py-1 text-right">
              {(s.dailyReturn * 100).toFixed(2)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
