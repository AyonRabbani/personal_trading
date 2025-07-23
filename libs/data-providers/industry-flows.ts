export interface SubIndustryFlow {
  name: string;
  flow: number; // -1 to 1 representing capital inflow/outflow
}

export interface IndustryFlow {
  name: string;
  flow: number;
  subIndustries: SubIndustryFlow[];
}

const industryMap: Record<string, string[]> = {
  Technology: ['Software', 'Semiconductors', 'Hardware'],
  Finance: ['Banks', 'Insurance', 'Asset Management'],
  Healthcare: ['Pharmaceuticals', 'Biotech', 'Medical Devices'],
  Energy: ['Oil & Gas', 'Renewables'],
  Consumer: ['Retail', 'E-commerce', 'Food & Beverage'],
};

export async function getIndustryFlows(): Promise<IndustryFlow[]> {
  const results: IndustryFlow[] = [];
  for (const [name, subs] of Object.entries(industryMap)) {
    const subIndustries: SubIndustryFlow[] = subs.map((s) => ({
      name: s,
      flow: 1,
    }));
    const flow = 1;
    results.push({ name, flow, subIndustries });
  }
  return results;
}
