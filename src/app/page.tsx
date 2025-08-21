import styles from './page.module.css';
import { getTickerFlow, getTickerHistory, type DailyBar } from '@/lib/polygon';
import CashFlowChart from '@/components/CashFlowChart';
import CashFlowTrendChart from '@/components/CashFlowTrendChart';
import CorrelationChart from '@/components/CorrelationChart';
import MomentumChart from '@/components/MomentumChart';
import CorrelationTrendChart from '@/components/CorrelationTrendChart';

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
  const maxFlow = Math.max(...values);
  const normValues = values.map((v) => (maxFlow ? v / maxFlow : 0));

  const histories = await Promise.all(
    tickers.map((t) => getTickerHistory(t.ticker, 30))
  );

  const trendLabels = histories[0].map((d) => d.date);
  const trendDatasets = histories.map((h, i) => ({
    label: tickers[i].ticker,
    data: h.map((d) => d.close * d.volume),
  }));

  const momentumValues = histories.map((h) =>
    h.length ? (h[h.length - 1].close - h[0].close) / h[0].close : 0
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

  const returns = histories.map((h) => calcReturns(h.map((d) => d.close)));
  // Build full correlation matrix across all ETFs
  const corrMatrix: number[][] = returns.map(() =>
    Array(returns.length).fill(0)
  );
  for (let i = 0; i < returns.length; i++) {
    for (let j = 0; j < returns.length; j++) {
      corrMatrix[i][j] = corr(returns[i], returns[j]);
    }
  }

  function corrWindow(a: DailyBar[], b: DailyBar[], days: number) {
    const ra = calcReturns(a.slice(-days - 1).map((d) => d.close));
    const rb = calcReturns(b.slice(-days - 1).map((d) => d.close));
    return corr(ra, rb);
  }

  const windows = [30, 15, 5];
  const windowLabels = windows.map((w) => `${w}d`);
  const corrTrendDatasets = histories.slice(1).map((h, i) => ({
    label: tickers[i + 1].ticker,
    data: windows.map((w) => corrWindow(histories[0], h, w)),
  }));

  return (
    <main className={styles.main}>
      <h1>Cross-Sectional Cash Flow Tracker</h1>
      <p>
        Normalized cash flow for ticker <code>i</code> is
        <code>CF_i = (close_i × volume_i)</code> scaled by the maximum across
        tickers so the displayed value is <code>CF_i / max_j CF_j</code>.
      </p>
      <CashFlowChart labels={labels} values={normValues} />
      <h2>Momentum (30-Day)</h2>
      <p>
        Momentum measures the percentage change over 30 days:
        <code>
          (P<sub>t</sub> - P<sub>t-30</sub>) / P<sub>t-30</sub>
        </code>
        .
      </p>
      <MomentumChart labels={labels} values={momentumValues} />
      <h2>Cross-Sectional Correlation</h2>
      <p>
        Daily returns are computed as
        <code>
          r<sub>t</sub> = (P<sub>t</sub> - P<sub>t-1</sub>) / P<sub>t-1</sub>
        </code>
        ; the matrix shows the Pearson correlation between each pair of ETFs.
      </p>
      <CorrelationChart labels={labels} matrix={corrMatrix} />
      <h2>30-Day Cash Flow Trend</h2>
      <p>
        Each line depicts <code>P_t × V_t</code> for the past 30 trading days,
        illustrating how cash flow evolves through time.
      </p>
      <CashFlowTrendChart labels={trendLabels} datasets={trendDatasets} />
      <h2>Correlation Trends vs SPY</h2>
      <p>
        Rolling correlations with SPY over windows of 30, 15 and 5 days provide
        a sense of short- and medium-term co-movement.
      </p>
      <CorrelationTrendChart labels={windowLabels} datasets={corrTrendDatasets} />
    </main>
  );
}
