"use client";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface Datum {
  date: string;
  dividends: number;
  taxes: number;
}

interface Props {
  data: Datum[];
  dividendsTotal: number;
  taxTotal: number;
}

export default function DividendTaxChart({
  data,
  dividendsTotal,
  taxTotal,
}: Props) {
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

  return (
    <figure className="w-full">
      <figcaption className="mb-2">
        <h3 className="text-lg font-semibold">Reinvested Dividends vs Tax Liability</h3>
        <p className="text-sm text-gray-600">
          Cumulative dividends are reinvested, generating a 15% tax liability owed
          later. This chart compares total reinvested dividends with accrued taxes
          payable.
        </p>
        <p className="text-xs text-gray-500">
          Totals — Dividends: {fmt.format(dividendsTotal)}; Taxes: {fmt.format(taxTotal)}
        </p>
      </figcaption>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
            <title>Reinvested Dividends vs Tax Liability</title>
            <desc>
              Shows cumulative reinvested dividends alongside their corresponding
              tax liability.
            </desc>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="dividends"
              stroke="#82ca9d"
              dot={false}
              name="Dividends Reinvested"
            />
            <Line
              type="monotone"
              dataKey="taxes"
              stroke="#ff0000"
              dot={false}
              name="Taxes Payable"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
