import React from 'react';

export interface SubIndustryFlow {
  name: string;
  flow: number;
}

export interface IndustryFlow {
  name: string;
  flow: number;
  subIndustries: SubIndustryFlow[];
}

export interface Props {
  flows: IndustryFlow[];
}

/**
 * Display capital flows by industry and sub industry.
 */
export default function IndustryFlowDashboard({ flows }: Props) {
  return (
    <div className="overflow-x-auto text-sm">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 text-left">Industry</th>
            <th className="px-2 py-1 text-left">Sub Industry</th>
            <th className="px-2 py-1 text-right">Flow</th>
          </tr>
        </thead>
        <tbody>
          {flows.map((ind) => (
            <React.Fragment key={ind.name}>
              <tr className="border-t">
                <td className="font-bold" colSpan={2}>
                  {ind.name}
                </td>
                <td className="text-right">{ind.flow.toFixed(2)}</td>
              </tr>
              {ind.subIndustries.map((sub) => (
                <tr key={ind.name + sub.name} className="border-t">
                  <td></td>
                  <td className="pl-4">{sub.name}</td>
                  <td className="text-right">{sub.flow.toFixed(2)}</td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
