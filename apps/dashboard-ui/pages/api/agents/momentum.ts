import { NextApiRequest, NextApiResponse } from 'next';
import { registerPolygonProvider, getMarketData } from '@workspace/data-providers/polygon';
import { MomentumAgent } from '@workspace/agents/momentum';

// Symbols the agent should monitor.
registerPolygonProvider({ symbols: ['AAPL', 'BTCUSD', 'ETHUSD'] });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getMarketData();
    const agent = new MomentumAgent();
    await agent.onEvent(data);
    const signals = await agent.getSignals();
    res.status(200).json(signals);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate signals' });
  }
}
