export interface SectorData {
  close: number;
  change: number;
}

export async function getSectorIndex(ticker: string): Promise<SectorData | null> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return null;
  }
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/prev?adjusted=true&apiKey=${apiKey}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.results || !data.results.length) {
      return null;
    }
    const { c: close, o: open } = data.results[0];
    const change = ((close - open) / open) * 100;
    return { close, change };
  } catch {
    return null;
  }
}

export interface HistoryPoint {
  date: string;
  close: number;
}

export async function getSectorHistory(
  ticker: string
): Promise<HistoryPoint[] | null> {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return null;
  }
  const to = new Date();
  const from = new Date();
  from.setMonth(to.getMonth() - 1);
  const toStr = to.toISOString().split("T")[0];
  const fromStr = from.toISOString().split("T")[0];
  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${fromStr}/${toStr}?adjusted=true&sort=asc&apiKey=${apiKey}`,
      { next: { revalidate: 0 } }
    );
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    if (!data.results) {
      return null;
    }
    interface AggResult {
      t: number;
      c: number;
    }
    return data.results.map((r: AggResult) => ({
      date: new Date(r.t).toISOString().split("T")[0],
      close: r.c,
    }));
  } catch {
    return null;
  }
}
