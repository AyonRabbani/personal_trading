'use client';

import { useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import Filters from '@/components/Filters';
import ResultsTable, { Result } from '@/components/ResultsTable';
import PositionDrawer from '@/components/PositionDrawer';

const queryClient = new QueryClient();

function Screener() {
  const [symbol, setSymbol] = useState('AAPL');
  const [selected, setSelected] = useState<Result | null>(null);

  const { data } = useQuery<{ results: Result[] }>({
    queryKey: ['screen', symbol],
    queryFn: async () => {
      const res = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol }),
      });
      return res.json();
    },
  });

  return (
    <div>
      <Filters symbol={symbol} onSymbolChange={setSymbol} />
      <ResultsTable results={data?.results ?? []} onSelect={setSelected} />
      <PositionDrawer position={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Screener />
    </QueryClientProvider>
  );
}
