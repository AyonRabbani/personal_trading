export const POLYGON_API_KEY = "Z2zYpeDRaQiuiy5mnPjYEyLjo0DCd8A5";
const BASE_URL = "https://api.polygon.io";

export async function fetchAggregates(
  ticker: string,
  from: string,
  to: string
) {
  const url = `${BASE_URL}/v2/aggs/ticker/${ticker}/range/1/day/${from}/${to}?apiKey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch aggregates for ${ticker}`);
  }
  return res.json();
}

export async function fetchLastTrade(ticker: string) {
  const url = `${BASE_URL}/v2/last/trade/${ticker}?apiKey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch last trade for ${ticker}`);
  }
  return res.json();
}

export async function fetchOptionsSnapshot(ticker: string) {
  const url = `${BASE_URL}/v3/snapshot/options/${ticker}?apiKey=${POLYGON_API_KEY}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch options snapshot for ${ticker}`);
  }
  return res.json();
}
