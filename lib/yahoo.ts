import yahooFinance from "yahoo-finance2";
import {
  ChartRequest,
  ChartResponse,
  PriceBar,
  DividendEvent,
  SeriesMap,
  DividendMap,
} from "./types";

// Fetch price and dividend history for a set of tickers from Yahoo Finance
export async function fetchChart(req: ChartRequest): Promise<ChartResponse> {
  const prices: SeriesMap = {};
  const dividends: DividendMap = {};

  for (const ticker of req.tickers) {
    try {
      const result = await yahooFinance.chart(ticker, {
        period: req.period,
        interval: req.interval,
        events: "div",
      });
      const series: PriceBar[] = [];
      const divSeries: DividendEvent[] = [];
      const r = result?.chart?.result?.[0];
      if (r) {
        const ts = r.timestamp || [];
        const closes = r.indicators?.quote?.[0]?.close || [];
        ts.forEach((t, i) => {
          const c = closes[i];
          if (c != null) {
            series.push({
              date: new Date(t * 1000).toISOString().slice(0, 10),
              close: c,
            });
          }
        });
        const divs = r.events?.dividends || {};
        Object.values(divs).forEach((ev: { date: number; amount: number }) => {
          divSeries.push({
            date: new Date(ev.date * 1000).toISOString().slice(0, 10),
            amount: ev.amount,
          });
        });
      }
      prices[ticker] = series;
      dividends[ticker] = divSeries;
    } catch {
      prices[ticker] = [];
      dividends[ticker] = [];
    }
  }

  return { prices, dividends };
}
