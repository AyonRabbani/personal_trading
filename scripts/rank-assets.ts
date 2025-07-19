import { registerPolygonProvider, getMarketData } from '../libs/data-providers/polygon';
import { fetchNewsScores } from '../libs/data-providers/news';
import { assetSymbols } from '../libs/assets';

registerPolygonProvider({ symbols: assetSymbols });

interface Metrics {
  symbol: string;
  momentum: number;
  risk: number;
  sentiment: number;
}

function calcStdDev(arr: number[]): number {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
}

async function main() {
  const data = await getMarketData();
  const bySymbol: Record<string, typeof data> = {};
  for (const d of data) {
    (bySymbol[d.symbol] ||= []).push(d);
  }
  const news = await fetchNewsScores(Object.keys(bySymbol));

  const results: Metrics[] = [];
  for (const symbol of Object.keys(bySymbol)) {
    const arr = bySymbol[symbol];
    arr.sort((a, b) => a.timestamp - b.timestamp);
    const first = arr[0];
    const last = arr[arr.length - 1];
    const momentum = (last.close - first.close) / first.close;

    const returns: number[] = [];
    for (let i = 1; i < arr.length; i++) {
      const prev = arr[i - 1].close;
      const curr = arr[i].close;
      returns.push((curr - prev) / prev);
    }
    const risk = calcStdDev(returns);
    const sentiment = news[symbol]?.sentiment ?? 0;

    results.push({ symbol, momentum, risk, sentiment });
  }

  const momentumRank = [...results].sort((a, b) => b.momentum - a.momentum);
  const riskRank = [...results].sort((a, b) => a.risk - b.risk);
  const sentimentRank = [...results].sort((a, b) => b.sentiment - a.sentiment);

  console.log('--- Momentum Ranking ---');
  momentumRank.forEach((r, i) => {
    console.log(`${i + 1}. ${r.symbol}: ${r.momentum.toFixed(4)}`);
  });

  console.log('\n--- Risk (Lower is Better) ---');
  riskRank.forEach((r, i) => {
    console.log(`${i + 1}. ${r.symbol}: ${r.risk.toFixed(4)}`);
  });

  console.log('\n--- Sentiment Ranking ---');
  sentimentRank.forEach((r, i) => {
    console.log(`${i + 1}. ${r.symbol}: ${r.sentiment.toFixed(4)}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
