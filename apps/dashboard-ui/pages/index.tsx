import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { useState } from 'react';

const SignalList = dynamic(() => import('@workspace/ui-components/SignalList'), {
  ssr: false,
});
const PortfolioOverview = dynamic(
  () => import('@workspace/ui-components/PortfolioOverview'),
  { ssr: false }
);
const RiskDashboard = dynamic(
  () => import('@workspace/ui-components/RiskDashboard'),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data } = useSWR('/api/agents/momentum', fetcher, { refreshInterval: 60000 });
  const [capital, setCapital] = useState(10000);

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Momentum Signals</h1>
      <SignalList signals={data || []} availableCapital={capital} />
      <PortfolioOverview />
      <RiskDashboard />
    </div>
  );
}
