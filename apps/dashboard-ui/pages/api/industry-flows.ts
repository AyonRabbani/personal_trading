import { NextApiRequest, NextApiResponse } from 'next';
import { getIndustryFlows } from '@workspace/data-providers/industry-flows';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const flows = await getIndustryFlows();
    res.status(200).json(flows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch industry flows' });
  }
}
