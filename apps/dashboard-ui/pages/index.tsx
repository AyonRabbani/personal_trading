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
const MetricsSummary = dynamic(
  () => import('@workspace/ui-components/MetricsSummary'),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data: signals } = useSWR('/api/agents/momentum', fetcher, {
    refreshInterval: 60000,
  });
  const { data: portfolio } = useSWR('/api/portfolio', fetcher);
  const [capital, setCapital] = useState(10000);

  const metrics = portfolio
    ? [
        { label: 'Total Value', value: `$${portfolio.metrics.totalValue.toFixed(2)}` },
        { label: 'Daily P/L', value: portfolio.metrics.dailyChange.toFixed(2) },
        { label: 'Return', value: `${portfolio.metrics.totalReturn.toFixed(2)}%` },
        { label: 'Cash', value: `$${portfolio.cash.toFixed(2)}` },
      ]
    : [];

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Momentum Signals</h1>
      <SignalList signals={signals || []} availableCapital={capital} />
      {portfolio && (
        <PortfolioOverview
          holdings={portfolio.holdings}
          cash={portfolio.cash}
          metrics={portfolio.metrics}
        />
      )}
      {metrics.length > 0 && <MetricsSummary metrics={metrics} />}
      {portfolio && <RiskDashboard signals={signals || []} holdings={portfolio.holdings} />}
    </div>
  );
}
