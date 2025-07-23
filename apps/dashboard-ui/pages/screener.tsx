import useSWR from 'swr';
import Sp500Screener, { ScreenResult } from '@workspace/ui-components/Sp500Screener';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function ScreenerPage() {
  const { data: results, error } = useSWR<ScreenResult[]>(
    '/api/screener',
    fetcher
  );

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">S&amp;P 500 Screener</h1>
      {error && <div>Error loading screener</div>}
      {!results && !error && <div>Loading...</div>}
      {results && <Sp500Screener results={results} />}
    </div>
  );
}
