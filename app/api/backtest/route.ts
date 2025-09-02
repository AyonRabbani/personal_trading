import { NextResponse } from "next/server";
import { fetchChart } from "../../../lib/yahoo";
import {
  BacktestResponse,
  RunRequest,
  TimePoint,
  SeriesMap,
  DividendMap,
  PriceBar,
  DividendEvent,
} from "../../../lib/types";
import { runLevered, runUnlevered } from "../../../lib/strategy";
import { Parser } from "json2csv";

function alignData(
  pricesMap: SeriesMap,
  divMap: DividendMap,
  tickers: string[]
) {
  const dateLists = tickers.map((t) => pricesMap[t].map((p: PriceBar) => p.date));
  let dates = dateLists[0];
  for (let i = 1; i < dateLists.length; i++) {
    dates = dates.filter((d: string) => dateLists[i].includes(d));
  }
  dates.sort();
  const prices = dates.map((date: string) =>
    tickers.map((t) => {
      const bar = pricesMap[t].find((p: PriceBar) => p.date === date);
      return bar ? bar.close : 0;
    })
  );
  const divs = dates.map((date: string) =>
    tickers.map((t) => {
      const ev = divMap[t].find((p: DividendEvent) => p.date === date);
      return ev ? ev.amount : 0;
    })
  );
  return { dates, prices, divs };
}

function weeklyFromDaily(series: TimePoint[]): TimePoint[] {
  const map: Record<string, number> = {};
  series.forEach((p) => {
    const d = new Date(p.date);
    const day = d.getUTCDay();
    const diff = 5 - day; // days until Friday
    const friday = new Date(d);
    friday.setUTCDate(d.getUTCDate() + diff);
    const key = friday.toISOString().slice(0, 10);
    map[key] = (map[key] || 0) + p.value;
  });
  return Object.keys(map)
    .sort()
    .map((k) => ({ date: k, value: map[k] }));
}

export async function POST(req: Request) {
  const body = (await req.json()) as RunRequest;
  const { tickers, period, interval, ...params } = body;
  const chart = await fetchChart({ tickers, period, interval });
  const { dates, prices, divs } = alignData(chart.prices, chart.dividends, tickers);

  const unlev = runUnlevered(prices, divs, dates, tickers, params);
  const lev = runLevered(prices, divs, dates, tickers, params);
  const weeklyDiv = weeklyFromDaily(lev.dailyDiv);

  const auditRows = dates.map((date, i) => ({
    date,
    equity: lev.equity[i].value,
    loan: lev.loan[i].value,
    nmv: lev.nmv[i].value,
    marginRatio: lev.marginRatio[i].value,
    bucketA: lev.bucketA[i].value,
    bucketB: lev.bucketB[i].value,
    dailyDiv: lev.dailyDiv[i].value,
  }));
  const parser = new Parser();
  const auditCsv = parser.parse(auditRows);

  const resp: BacktestResponse = {
    unlevered: {
      equity: unlev.equity,
      bucketA: unlev.bucketA,
      bucketB: unlev.bucketB,
      metrics: unlev.metrics,
    },
    levered: {
      equity: lev.equity,
      nmv: lev.nmv,
      loan: lev.loan,
      marginRatio: lev.marginRatio,
      weeklyDiv,
      metrics: lev.metrics,
      marginEvents: lev.marginEvents,
    },
    picks: lev.picks,
    auditCsv,
  };

  return NextResponse.json(resp);
}
