import styles from "./page.module.css";
import { getSectorIndex, getSectorHistory, HistoryPoint } from "@/lib/polygon";
import SectorChart from "@/components/SectorChart";

export const revalidate = 0;

const sectors = [
  { name: "Energy", ticker: "XLE" },
  { name: "Financials", ticker: "XLF" },
  { name: "Technology", ticker: "XLK" },
  { name: "Healthcare", ticker: "XLV" },
  { name: "Industrials", ticker: "XLI" },
];

export default async function Home() {
  const data = await Promise.all(
    sectors.map(async (s) => {
      const info = await getSectorIndex(s.ticker);
      const history = await getSectorHistory(s.ticker);
      return { ...s, info, history };
    })
  );

  const chartData = data.filter((d) => Array.isArray(d.history)) as {
    name: string;
    ticker: string;
    history: HistoryPoint[];
  }[];

  return (
    <main className={styles.main}>
      <h1>Sector Index Tracker</h1>
      {!process.env.POLYGON_API_KEY && (
        <p>Please set <code>POLYGON_API_KEY</code> to view data.</p>
      )}
      {process.env.POLYGON_API_KEY && chartData.length > 0 && (
        <SectorChart data={chartData} />
      )}
      <ul>
        {data.map(({ name, ticker, info }) => (
          <li key={ticker}>
            {name} ({ticker}):
            {info
              ? ` ${info.close.toFixed(2)} (${info.change.toFixed(2)}%)`
              : " N/A"}
          </li>
        ))}
      </ul>
    </main>
  );
}
