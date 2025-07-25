import { useEffect, useState } from "react";
import { fetchOptionsSnapshot } from "../lib/polygon";

interface Props {
  ticker: string | null;
}

interface OptionRow {
  strike_price: number;
  last_price: number;
  expiration_date: string;
  implied_volatility?: number;
}

export default function OptionsViewer({ ticker }: Props) {
  const [options, setOptions] = useState<OptionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ticker) return;
    setLoading(true);
    fetchOptionsSnapshot(ticker)
      .then((data) => {
        const calls = (data?.results || []).filter(
          (opt: any) => opt.details.option_type === "call"
        );
        setOptions(
          calls.map((c: any) => ({
            strike_price: c.details.strike_price,
            last_price: c.last_quote.p,
            expiration_date: c.details.expiration_date,
            implied_volatility: c.iv,
          }))
        );
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [ticker]);

  if (!ticker) {
    return <div>Select a stock to view options</div>;
  }

  if (loading) return <div>Loading options...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr>
          <th>Strike</th>
          <th>Premium</th>
          <th>Expiry</th>
          <th>IV</th>
        </tr>
      </thead>
      <tbody>
        {options.map((o, i) => (
          <tr key={i}>
            <td className="px-2 py-1 text-right">{o.strike_price}</td>
            <td className="px-2 py-1 text-right">{o.last_price}</td>
            <td className="px-2 py-1">{o.expiration_date}</td>
            <td className="px-2 py-1 text-right">
              {o.implied_volatility ? o.implied_volatility.toFixed(2) : "-"}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
