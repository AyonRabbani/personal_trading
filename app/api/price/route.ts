import { NextResponse } from "next/server";
import { fetchChart } from "@/lib/yahoo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const ticker = searchParams.get("ticker");
  if (!ticker) {
    return NextResponse.json({ error: "ticker required" }, { status: 400 });
  }
  try {
    const chart = await fetchChart([ticker], "2y");
    return NextResponse.json({ prices: chart.prices[ticker] || [] });
  } catch {
    return NextResponse.json({ error: "failed to fetch" }, { status: 500 });
  }
}
