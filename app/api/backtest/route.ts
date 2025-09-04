import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchChart } from "@/lib/yahoo";
import { runUnlevered, runLevered } from "@/lib/strategy";

const bodySchema = z.object({
  tickers: z.array(z.string().min(1)).nonempty(),
  range: z.enum(["6mo", "1y", "2y"]).optional(),
  initialCapital: z.number().positive().optional(),
  monthlyDeposit: z.number().nonnegative().optional(),
  lookbackDays: z.number().int().positive().optional(),
  bufferPts: z.number().min(0).max(0.15).optional(),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 }
    );
  }

  const {
    tickers,
    range = "1y",
    initialCapital = 6000,
    monthlyDeposit = 0,
    bufferPts = 0.05,
  } = parsed.data;

  const chart = await fetchChart(tickers, range);
  const unlevered = runUnlevered(chart.prices, initialCapital, monthlyDeposit);
  const levered = runLevered(
    chart.prices,
    initialCapital,
    monthlyDeposit,
    bufferPts
  );

  const tickerStats = tickers.map((t) => {
    const divTotal = (chart.dividends[t] || []).reduce(
      (sum, d) => sum + d.amount,
      0
    );
    const series = chart.prices[t] || [];
    const dailyReturn =
      series.length >= 2
        ? series[series.length - 1].close / series[series.length - 2].close - 1
        : 0;
    return { ticker: t, totalDividend: divTotal, dailyReturn };
  });
  // aggregate dividend cashflows and tax liability
  const TAX_RATE = 0.15;
  const prices = chart.prices;
  const dividendsMap = chart.dividends;
  const shares: Record<string, number> = {};
  const divIdx: Record<string, number> = {};
  const capitalPerTicker = initialCapital / tickers.length;
  for (const t of tickers) {
    const firstPrice = prices[t][0]?.close || 0;
    shares[t] = firstPrice ? capitalPerTicker / firstPrice : 0;
    divIdx[t] = 0;
    dividendsMap[t] = (dividendsMap[t] || []).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  }
  const baseSeries = prices[tickers[0]] || [];
  const dividends: { date: string; value: number }[] = [];
  const dividendTax: { date: string; dividends: number; taxes: number }[] = [];
  let cumDiv = 0;
  let cumTax = 0;
  for (let i = 0; i < baseSeries.length; i++) {
    const date = baseSeries[i].date;
    let dayDiv = 0;
    for (const t of tickers) {
      const divs = dividendsMap[t];
      while (
        divIdx[t] < divs.length &&
        divs[divIdx[t]].date === date
      ) {
        const cash = shares[t] * divs[divIdx[t]].amount;
        dayDiv += cash;
        const price = prices[t][i]?.close || 0;
        if (price > 0) {
          shares[t] += cash / price;
        }
        divIdx[t]++;
      }
    }
    if (dayDiv > 0) {
      cumDiv += dayDiv;
      cumTax += dayDiv * TAX_RATE;
      dividends.push({ date, value: dayDiv });
      dividendTax.push({ date, dividends: cumDiv, taxes: cumTax });
    }
  }

  return NextResponse.json({
    unlevered,
    levered,
    tickerStats,
    prices: chart.prices,
    dividends,
    dividendTax,
    divTotal: cumDiv,
    taxTotal: cumTax,
  });
}
