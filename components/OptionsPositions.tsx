'use client';

import * as React from 'react';

export interface OptionPosition {
  symbol: string;
  expiration: string; // YYYY-MM-DD
  strike: number;
  premium: number;
  quantity: number;
  type: 'PUT' | 'CALL';
}

function fmt(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function num(n?: number, d = 2) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}

export default function OptionsPositions({ positions = [] }: { positions?: OptionPosition[] }) {
  if (!positions.length) {
    return (
      <div>
        <h3 className="font-semibold mb-2">Option Positions</h3>
        <p className="text-sm text-slate-500">No option positions tracked.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-semibold mb-2">Option Positions</h3>
      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="min-w-full text-xs">
          <thead className="bg-slate-50">
            <tr className="text-left">
              <th className="p-2">Symbol</th>
              <th className="p-2">Type</th>
              <th className="p-2">Expiration</th>
              <th className="p-2 text-right">Strike</th>
              <th className="p-2 text-right">Premium</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2 text-right">Total Premium</th>
              <th className="p-2 text-right">Break-even</th>
              <th className="p-2 text-right">Collateral</th>
            </tr>
          </thead>
          <tbody>
            {positions.map((p, idx) => {
              const total = p.premium * 100 * p.quantity;
              const breakEven = p.type === 'PUT' ? p.strike - p.premium : p.strike + p.premium;
              const collateral = p.strike * 100 * p.quantity;
              return (
                <tr key={idx} className={idx % 2 ? 'bg-slate-50' : 'bg-white'}>
                  <td className="p-2 whitespace-nowrap">{p.symbol}</td>
                  <td className="p-2">{p.type}</td>
                  <td className="p-2 whitespace-nowrap">{p.expiration}</td>
                  <td className="p-2 text-right">{fmt(p.strike)}</td>
                  <td className="p-2 text-right">{fmt(p.premium)}</td>
                  <td className="p-2 text-right">{num(p.quantity, 0)}</td>
                  <td className="p-2 text-right">{fmt(total)}</td>
                  <td className="p-2 text-right">{fmt(breakEven)}</td>
                  <td className="p-2 text-right">{fmt(collateral)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

