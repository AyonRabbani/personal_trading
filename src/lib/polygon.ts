export interface SectorData {
  close: number;
  change: number;
}

export async function getSectorIndex(ticker: string): Promise<SectorData | null> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return null;
  }
  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) {
    throw new Error('Failed to fetch data');
  }
  const data = await res.json();
  if (!data.results || !data.results.length) {
    return null;
  }
  const { c: close, o: open } = data.results[0];
  const change = ((close - open) / open) * 100;
  return { close, change };
}
