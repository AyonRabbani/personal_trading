import { useEffect, useState } from 'react';
import Sp500Screener, { ScreenResult } from '@workspace/ui-components/Sp500Screener';

export default function ScreenerPage() {
  const [results, setResults] = useState<ScreenResult[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/screener');
        const json = await res.json();
        setResults(json);
      } catch {
        setResults([]);
      }
    }
    load();
  }, []);

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">S&amp;P 500 Screener</h1>
      {results.length > 0 ? (
        <Sp500Screener results={results} />
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}
