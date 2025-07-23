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
const AssetMetricsTable = dynamic(
  () => import('@workspace/ui-components/AssetMetricsTable'),
  { ssr: false }
);
const MacroMetrics = dynamic(
  () => import('@workspace/ui-components/MacroMetrics'),
  { ssr: false }
);
const IndustryFlowDashboard = dynamic(
  () => import('@workspace/ui-components/IndustryFlowDashboard'),
  { ssr: false }
);
const PortfolioVaRChart = dynamic(
  () => import('@workspace/ui-components/PortfolioVaRChart'),
  { ssr: false }
);
const OptionProjectionChart = dynamic(
  () => import('@workspace/ui-components/OptionProjectionChart'),
  { ssr: false }
);
const CashParkingTable = dynamic(
  () => import('@workspace/ui-components/CashParkingTable'),
  { ssr: false }
);
const PortfolioForm = dynamic(
  () => import('@workspace/ui-components/PortfolioForm'),
  { ssr: false }
);

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function HomePage() {
  const { data: signals } = useSWR('/api/agents/momentum', fetcher, {
    refreshInterval: 60000,
  });
  const { data: parking } = useSWR('/api/cash-parking', fetcher, {
    refreshInterval: 60000,
  });
  const { data: portfolio } = useSWR('/api/portfolio', fetcher);
  const { data: assetMetrics } = useSWR('/api/asset-metrics', fetcher);
  const { data: macro } = useSWR('/api/macro-metrics', fetcher);
  const { data: flows } = useSWR('/api/industry-flows', fetcher);
  const { data: risk } = useSWR('/api/portfolio-risk', fetcher);
  const [capital, setCapital] = useState(10000);
  const [tab, setTab] = useState<'parking' | 'overview' | 'risk'>('parking');

  const metrics = portfolio
    ? [
        { label: 'Total Value', value: `$${portfolio.metrics.totalValue.toFixed(2)}` },
        { label: 'Daily P/L', value: portfolio.metrics.dailyChange.toFixed(2) },
        { label: 'Return', value: `${portfolio.metrics.totalReturn.toFixed(2)}%` },
        { label: 'Cash', value: `$${portfolio.cash.toFixed(2)}` },
      ]
    : [];

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-4xl p-4 space-y-6">
      <div className="border-b mb-4 flex space-x-4 justify-center">
        <button
          className={`pb-1 ${tab === 'parking' ? 'border-b-2 font-semibold' : 'text-gray-500'}`}
          onClick={() => setTab('parking')}
        >
          Cash Parking
        </button>
        <button
          className={`pb-1 ${tab === 'overview' ? 'border-b-2 font-semibold' : 'text-gray-500'}`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={`pb-1 ${tab === 'risk' ? 'border-b-2 font-semibold' : 'text-gray-500'}`}
          onClick={() => setTab('risk')}
        >
          Risk
        </button>
      </div>

      {tab === 'parking' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">30 Day Cash Parking</h1>
          {parking && <CashParkingTable data={parking} />}
        </div>
      )}

      {tab === 'overview' && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold text-center">Manage Portfolio</h1>
          <PortfolioForm />
          <h2 className="text-2xl font-bold">Momentum Signals</h2>
          <SignalList signals={signals || []} availableCapital={capital} />
          {portfolio && (
            <PortfolioOverview
              holdings={portfolio.holdings}
              cash={portfolio.cash}
              metrics={portfolio.metrics}
            />
          )}
          {metrics.length > 0 && <MetricsSummary metrics={metrics} />}
          {macro && <MacroMetrics metrics={macro.metrics} />}
          {flows && <IndustryFlowDashboard flows={flows} />}
          {assetMetrics && <AssetMetricsTable metrics={assetMetrics} />}
        </div>
      )}

      {tab === 'risk' && (
        <div className="space-y-4">
          {portfolio && <RiskDashboard signals={signals || []} holdings={portfolio.holdings} />}
          {risk && (
            <PortfolioVaRChart returns={risk.returns} varValue={risk.var} />
          )}
          {risk &&
            risk.projections.map((p: { symbol: string; path: number[] }) => (
              <OptionProjectionChart key={p.symbol} symbol={p.symbol} prices={p.path} />
            ))}
        </div>
      )}
      </div>
    </div>
  );
}
