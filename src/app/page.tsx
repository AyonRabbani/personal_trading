import styles from './page.module.css';
import { getTickerFlow } from '@/lib/polygon';
import CashFlowChart from '@/components/CashFlowChart';

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

  return (
    <main className={styles.main}>
      <h1>Cross-Sectional Cash Flow Tracker</h1>
      {!process.env.POLYGON_API_KEY && (
        <p>
          Using default API key. Set <code>POLYGON_API_KEY</code> to override.
        </p>
      )}
      <CashFlowChart labels={labels} values={values} />
    </main>
  );
}
