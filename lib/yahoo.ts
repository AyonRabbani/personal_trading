// wrapper around yahoo-finance2 to retrieve price and dividend history
import yahooFinance from "yahoo-finance2";
import { ChartResponse, SeriesMap, DividendMap, Ticker } from "./types";

// Fetch historical chart data for the provided tickers. This function
// normalises the response into simple arrays that are easier for the
// rest of the app to consume. The range/interval arguments are kept
// simple to avoid over‑engineering for this demo.
export async function fetchChart(
  tickers: Ticker[],
  range: "6mo" | "1y" | "2y" | "5y" = "1y",
  interval: "1d" | "1wk" = "1d"
): Promise<ChartResponse> {
  const prices: SeriesMap = {};
  const dividends: DividendMap = {};

  for (const t of tickers) {
    const res = await yahooFinance.chart(t, { range, interval });

    // map price quotes
    prices[t] = res.quotes.map((q) => ({
      date: q.date.toISOString().slice(0, 10),
      close: q.close ?? 0,
    }));

    // map dividend events if any
    const divs = res.events?.dividends || {};
    dividends[t] = Object.values(divs).map((d) => ({
      date: new Date(d.date).toISOString().slice(0, 10),
      amount: d.amount,
    }));
  }

  return { prices, dividends };
}

