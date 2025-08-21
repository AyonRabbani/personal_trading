import styles from './page.module.css';
import { getTickerFlow, getTickerHistory } from '@/lib/polygon';
import CashFlowChart from '@/components/CashFlowChart';
import CashFlowTrendChart from '@/components/CashFlowTrendChart';
import CorrelationChart from '@/components/CorrelationChart';

export const revalidate = 0;

const tickers = [
  { name: 'SPDR S&P 500 ETF', ticker: 'SPY' },
  { name: 'Invesco QQQ', ticker: 'QQQ' },
  { name: 'iShares Russell 2000', ticker: 'IWM' },
  { name: 'iShares Emerging Markets', ticker: 'EEM' },
  { name: 'SPDR Gold Shares', ticker: 'GLD' },
  { name: 'Energy Select Sector', ticker: 'XLE' },
  { name: 'Financial Select Sector', ticker: 'XLF' },
  { name: 'Technology Select Sector', ticker: 'XLK' },
  { name: 'Health Care Select Sector', ticker: 'XLV' },
  { name: 'Industrial Select Sector', ticker: 'XLI' },
];

export default async function Home() {
  const flows = await Promise.all(
    tickers.map(async (t) => {
      const data = await getTickerFlow(t.ticker);
      return { ...t, data };
    })
  );

  const labels = flows.map((f) => f.ticker);
  const values = flows.map((f) => f.data?.cashFlow ?? 0);

  const spyHistory = await getTickerHistory('SPY', 30);
  const trendLabels = spyHistory.map((d) => d.date);
  const trendValues = spyHistory.map((d) => d.close * d.volume);

  const histories = await Promise.all(
    tickers.map((t) => getTickerHistory(t.ticker, 30))
  );

  function calcReturns(prices: number[]): number[] {
    const res: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      res.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }
    return res;
  }

  function corr(a: number[], b: number[]): number {
    const n = a.length;
    const mean = (arr: number[]) => arr.reduce((s, v) => s + v, 0) / n;
    const meanA = mean(a);
    const meanB = mean(b);
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    return num / Math.sqrt(denA * denB);
  }

  const spyReturns = calcReturns(histories[0].map((d) => d.close));
  const corrLabels = tickers.slice(1).map((t) => t.ticker);
  const corrValues = histories.slice(1).map((h) => {
    const r = calcReturns(h.map((d) => d.close));
    return corr(spyReturns, r);
  });

  return (
    <main className={styles.main}>
      <h1>Cross-Sectional Cash Flow Tracker</h1>
      {!process.env.POLYGON_API_KEY && (
        <p>
          Using default API key. Set <code>POLYGON_API_KEY</code> to override.
        </p>
      )}
      <p>
        Cash flow represents the dollar value traded for each ETF, calculated
        as the previous day&apos;s closing price multiplied by its volume.
      </p>
      <CashFlowChart labels={labels} values={values} />
      <h2>30-Day Cash Flow Trend (SPY)</h2>
      <CashFlowTrendChart labels={trendLabels} values={trendValues} />
      <h2>Correlation with SPY (30-Day Returns)</h2>
      <CorrelationChart labels={corrLabels} values={corrValues} />
    </main>
  );
}
