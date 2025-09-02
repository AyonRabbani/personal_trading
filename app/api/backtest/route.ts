import { NextResponse } from "next/server";
import { fetchChart } from "@/lib/yahoo";
import { runUnlevered, runLevered } from "@/lib/strategy";

export async function POST(req: Request) {
  const body = await req.json();
  const tickers: string[] = body.tickers || [];
  if (tickers.length === 0) {
    return NextResponse.json({ error: "No tickers provided" }, { status: 400 });
  }

  const range: "6mo" | "1y" | "2y" = body.range ?? "1y";
  const chart = await fetchChart(tickers, range);
  const unlevered = runUnlevered(chart.prices);
  const levered = runLevered(chart.prices, body.leverage ?? 2);

  return NextResponse.json({ unlevered, levered });
}
