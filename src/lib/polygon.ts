export interface TickerFlow {
  close: number;
  volume: number;
  cashFlow: number;
}

export async function getTickerFlow(
  ticker: string
): Promise<TickerFlow | null> {
  const apiKey =
    process.env.POLYGON_API_KEY ?? "Z2zYpeDRaQiuiy5mnPjYEyLjo0DCd8A5";
  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  const data = await res.json();
  if (!data.results || !data.results.length) {
    return null;
  }
  const { c: close, v: volume } = data.results[0];
  return { close, volume, cashFlow: close * volume };
}

