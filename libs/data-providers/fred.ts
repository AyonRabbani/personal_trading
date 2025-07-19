// Data provider for macroeconomic series via FRED
// Environment variable: FRED_API_KEY
// If not defined, generates dummy random data so the app can run offline.

export interface MacroSeries {
  name: string;            // Human readable name
  id: string;              // FRED series ID
  data: Array<{ date: string; value: number }>;
}

let series: Record<string, string> = {};

// Register a mapping of metric names to FRED series IDs
export function registerFredProvider(config: { series: Record<string, string> }) {
  series = config.series;
}

// Fetch latest observations for all registered series
export async function getMacroSeries(): Promise<MacroSeries[]> {
  const end = new Date();
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);
  const results: MacroSeries[] = [];

  if (!process.env.FRED_API_KEY) {
    // Generate dummy series
    for (const [name, id] of Object.entries(series)) {
      const data: Array<{ date: string; value: number }> = [];
      let value = 100 + Math.random() * 10;
      for (let d = start.getTime(); d <= end.getTime(); d += 24 * 60 * 60 * 1000) {
        value += (Math.random() - 0.5) * 2;
        data.push({ date: new Date(d).toISOString().split('T')[0], value });
      }
      results.push({ name, id, data });
    }
    return results;
  }

  const apiKey = process.env.FRED_API_KEY;
  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];

  for (const [name, id] of Object.entries(series)) {
    try {
      const res = await fetch(
        `https://api.stlouisfed.org/fred/series/observations?series_id=${id}&api_key=${apiKey}&file_type=json&observation_start=${startStr}&observation_end=${endStr}`
      );
      if (!res.ok) {
        console.error('FRED API error', id);
        continue;
      }
      const json = await res.json();
      const data = (json.observations || []).map((o: any) => ({
        date: o.date,
        value: parseFloat(o.value),
      }));
      results.push({ name, id, data });
    } catch (err) {
      console.error('Failed fetching FRED series', id, err);
    }
  }
  return results;
}

// Calculate a set of common macro metrics from series data
export interface MacroMetrics {
  yieldCurve: number;       // 10Y minus 2Y treasury yield
  realRate: number;         // 10Y yield minus CPI inflation
  unemployment: number;     // latest unemployment rate
  gdpGrowth: number;        // latest GDP growth QoQ
  vix: number;              // latest VIX level
  dxyMomentum: number;      // 30 day change in USD index
}

export function computeMacroMetrics(series: MacroSeries[]): MacroMetrics {
  const s = Object.fromEntries(series.map((m) => [m.id, m]));

  function latest(id: string): number {
    const data = s[id]?.data;
    return data && data.length > 0 ? data[data.length - 1].value : 0;
  }

  function change(id: string, days: number): number {
    const data = s[id]?.data;
    if (!data || data.length === 0) return 0;
    const end = data[data.length - 1].value;
    const startIdx = Math.max(0, data.length - 1 - days);
    const startVal = data[startIdx].value;
    return (end - startVal) / startVal;
  }

  const tenY = latest('DGS10');
  const twoY = latest('DGS2');
  const cpi = latest('CPIAUCSL');

  return {
    yieldCurve: tenY - twoY,
    realRate: tenY - cpi,
    unemployment: latest('UNRATE'),
    gdpGrowth: latest('A191RL1Q225SBEA'),
    vix: latest('VIXCLS'),
    dxyMomentum: change('DTWEXBGS', 30),
  };
}
