import { NextResponse } from "next/server";
import { z } from "zod";
import { fetchChart } from "@/lib/yahoo";

// POST /api/chart
// Body: { tickers: string[], range?: string, interval?: string }
// Responds with price and dividend series for the requested tickers.
const bodySchema = z.object({
  tickers: z.array(z.string().min(1)).nonempty(),
  range: z.enum(["6mo", "1y", "2y"]).optional(),
  interval: z.enum(["1d", "1wk"]).optional(),
});

// POST /api/chart
// Body: { tickers: string[], range?: string, interval?: string }
// Responds with price and dividend series for the requested tickers.
export async function POST(req: Request) {
  const json = await req.json();
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.message },
      { status: 400 }
    );
  }

  const { tickers, range = "1y", interval = "1d" } = parsed.data;
  const uniq = [...new Set(tickers.map((t) => t.toUpperCase()))];

  try {
    const data = await fetchChart(uniq, range, interval);
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }
}
