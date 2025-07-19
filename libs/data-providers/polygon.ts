/**
 * Polygon.io data provider
 *
 * Environment variables:
 *  - POLYGON_API_KEY: API key for Polygon REST endpoints.
 *
 * To add new data providers, create additional modules inside libs/data-providers
 * that implement similar register and fetch functions.
 */

export interface MarketData {
  symbol: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

let symbols: string[] = [];

/**
 * Register symbols to fetch from Polygon.
 */
export function registerPolygonProvider(config: { symbols: string[] }): void {
  symbols = config.symbols;
}

/**
 * Fetch latest trade and 30-day historical aggregates from Polygon REST API.
 * Normalizes results into MarketData objects. Rate limits are handled via a
 * simple delay between requests.
 */
export async function getMarketData(): Promise<MarketData[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
  const results: MarketData[] = [];

  // If no API key is provided, fall back to generating random data so the UI can
  // run without external dependencies.
  if (!process.env.POLYGON_API_KEY) {
    for (const sym of symbols) {
      let price = 100 + Math.random() * 50;
      for (let d = start.getTime(); d <= end.getTime(); d += 24 * 60 * 60 * 1000) {
        const open = price;
        const close = open + (Math.random() - 0.5) * 2;
        const high = Math.max(open, close) + Math.random();
        const low = Math.min(open, close) - Math.random();
        const volume = Math.floor(Math.random() * 1000 + 500);
        results.push({ symbol: sym, timestamp: d, open, high, low, close, volume });
        price = close;
      }
    }
    return results;
  }

  const apiKey = process.env.POLYGON_API_KEY;
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  for (const sym of symbols) {
    try {
      const [lastRes, aggRes] = await Promise.all([
        fetch(`https://api.polygon.io/v2/last/trade/${sym}?apiKey=${apiKey}`),
        fetch(
          `https://api.polygon.io/v2/aggs/ticker/${sym}/range/1/day/${startStr}/${endStr}?apiKey=${apiKey}`
        ),
      ]);

      if (!lastRes.ok || !aggRes.ok) {
        console.error('Polygon API error', sym);
        continue;
      }

      const lastJson = await lastRes.json();
      const aggJson = await aggRes.json();
      if (Array.isArray(aggJson.results)) {
        for (const bar of aggJson.results) {
          results.push({
            symbol: sym,
            timestamp: bar.t,
            open: bar.o,
            high: bar.h,
            low: bar.l,
            close: bar.c,
            volume: bar.v,
          });
        }
      }
      if (lastJson?.results) {
        results.push({
          symbol: sym,
          timestamp: lastJson.results.t,
          open: lastJson.results.p,
          high: lastJson.results.p,
          low: lastJson.results.p,
          close: lastJson.results.p,
          volume: lastJson.results.s,
        });
      }

      // crude rate limit to avoid hitting Polygon free tier limits
      await new Promise((r) => setTimeout(r, 250));
    } catch (err) {
      console.error('Failed fetching data for', sym, err);
    }
  }
  return results;
}
