'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface Props {
  margin: { date: string; loan: number; cash: number }[];
  marginCalls: { date: string }[];
}

export default function MarginAnalysis({ margin, marginCalls }: Props) {
  return (
    <div className="space-y-4">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={margin}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="loan" stroke="#b91c1c" name="Margin Loan" />
            <Line type="monotone" dataKey="cash" stroke="#0ea5e9" name="Cash" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      {marginCalls.length > 0 && (
        <div>
          <h3 className="font-semibold">Margin Calls</h3>
          <ul className="list-disc pl-5">
            {marginCalls.map((m) => (
              <li key={m.date}>{m.date}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
