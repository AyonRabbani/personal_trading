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

  return NextResponse.json({ unlevered, levered, tickerStats });
}
