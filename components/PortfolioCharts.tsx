'use client';

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts';

interface Props {
  portfolio: { date: string; value: number }[];
  weeklyDividends: { week: string; amount: number }[];
  taxes: { date: string; amount: number }[];
}

export default function PortfolioCharts({ portfolio, weeklyDividends, taxes }: Props) {
  return (
    <div className="space-y-8">
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <LineChart data={portfolio}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#047857" />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={weeklyDividends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#1d4ed8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64 w-full">
        <ResponsiveContainer>
          <BarChart data={taxes}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Bar dataKey="amount" fill="#dc2626" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
