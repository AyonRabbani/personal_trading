import { registerPolygonProvider, getMarketData } from '../libs/data-providers/polygon';
import { fetchNewsScores } from '../libs/data-providers/news';
import { assetSymbols } from '../libs/assets';

registerPolygonProvider({ symbols: assetSymbols });

async function main() {
  const data = await getMarketData();
  const bySymbol: Record<string, typeof data> = {};
  for (const d of data) {
    (bySymbol[d.symbol] ||= []).push(d);
  }
  const news = await fetchNewsScores(Object.keys(bySymbol));

  const results: { symbol: string; score: number }[] = [];
  for (const symbol of Object.keys(bySymbol)) {
    const arr = bySymbol[symbol];
    arr.sort((a, b) => a.timestamp - b.timestamp);
    const first = arr[0];
    const last = arr[arr.length - 1];
    const momentum = (last.close - first.close) / first.close;
    const sentiment = news[symbol]?.sentiment ?? 0;
    const health = news[symbol]?.macro ?? 0;
    const score = momentum * 0.6 + sentiment * 0.3 + health * 0.1;
    results.push({ symbol, score });
  }
  results.sort((a, b) => b.score - a.score);
  for (const r of results) {
    console.log(`${r.symbol}: ${r.score.toFixed(4)}`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
