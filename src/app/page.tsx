import styles from "./page.module.css";
import { getSectorIndex } from "@/lib/polygon";

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
      return { ...s, info };
    })
  );

  return (
    <main className={styles.main}>
      <h1>Sector Index Tracker</h1>
      {!process.env.POLYGON_API_KEY && (
        <p>Please set <code>POLYGON_API_KEY</code> to view data.</p>
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
