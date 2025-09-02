"use client";

import { useState } from "react";

interface Props {
  onRun: (tickers: string[]) => void;
}

export default function Controls({ onRun }: Props) {
  const [tickers, setTickers] = useState("YBTC,ULTY");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const list = tickers
          .split(/[\s,]+/)
          .map((t) => t.trim().toUpperCase())
          .filter(Boolean);
        onRun(list);
      }}
      className="flex flex-col gap-2"
    >
      <label className="font-semibold">Tickers</label>
      <textarea
      className="p-2 border rounded"
        value={tickers}
        onChange={(e) => setTickers(e.target.value)}
        rows={3}
      />
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Run
      </button>
    </form>
  );
}
