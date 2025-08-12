import React from 'react';

interface FiltersProps {
  symbol: string;
  onSymbolChange?: (value: string) => void;
}

export default function Filters({ symbol, onSymbolChange }: FiltersProps) {
  return (
    <div className="p-4 border-b flex gap-2">
      <input
        type="text"
        value={symbol}
        onChange={(e) => onSymbolChange?.(e.target.value.toUpperCase())}
        placeholder="Ticker"
        className="px-2 py-1 border rounded"
      />
    </div>
  );
}
