export interface TickerFlow {
  close: number;
  volume: number;
  cashFlow: number;
}

export interface DailyBar {
  date: string;
  close: number;
  volume: number;
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

export async function getTickerHistory(
  ticker: string,
  days: number
): Promise<DailyBar[]> {
  const apiKey =
    process.env.POLYGON_API_KEY ?? "Z2zYpeDRaQiuiy5mnPjYEyLjo0DCd8A5";
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  const fromStr = from.toISOString().split("T")[0];
  const toStr = to.toISOString().split("T")[0];
  const res = await fetch(
    `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&limit=500&apiKey=${apiKey}`,
    { next: { revalidate: 0 } }
  );
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }
  const data = await res.json();
  if (!data.results || !data.results.length) {
    return [];
  }
  return data.results.map(
    (r: { t: number; c: number; v: number }) => ({
      date: new Date(r.t).toISOString().split("T")[0],
      close: r.c,
      volume: r.v,
    })
  );
}

