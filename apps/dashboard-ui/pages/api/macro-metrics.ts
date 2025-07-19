import { NextApiRequest, NextApiResponse } from 'next';
import {
  registerFredProvider,
  getMacroSeries,
  computeMacroMetrics,
} from '@workspace/data-providers/fred';

// Register a few common macro series using FRED identifiers
registerFredProvider({
  series: {
    // 10-Year Treasury Constant Maturity Rate
    tenY: 'DGS10',
    // 2-Year Treasury Constant Maturity Rate
    twoY: 'DGS2',
    // Consumer Price Index for All Urban Consumers
    cpi: 'CPIAUCSL',
    // Unemployment Rate
    unemployment: 'UNRATE',
    // Real GDP growth rate (percent change from preceding period)
    gdp: 'A191RL1Q225SBEA',
    // VIX volatility index
    vix: 'VIXCLS',
    // Trade Weighted U.S. Dollar Index
    dxy: 'DTWEXBGS',
  },
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const series = await getMacroSeries();
    const metrics = computeMacroMetrics(series);
    res.status(200).json({ series, metrics });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch macro metrics' });
  }
}
