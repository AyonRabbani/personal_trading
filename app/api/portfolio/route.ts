import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';
import { startOfWeek } from 'date-fns';

export async function POST(req: NextRequest) {
  try {
    const { tickers, start, leverage, initial, monthly } = await req.json();
    const symbols: string[] = tickers;
    const startDate = new Date(start);
    const endDate = new Date();

    const charts = await Promise.all(
      symbols.map((s) =>
        yahooFinance.chart(s, {
          period1: startDate,
          period2: endDate,
          interval: '1d',
          events: 'dividends',
          return: 'object',
        })
      )
    );

    const dates = (charts[0].timestamp || []).map((t: number) => new Date(t * 1000));
    const holdings: Record<string, number> = {};
    const n = symbols.length;
    const initCapital = Number(initial) * Number(leverage);

    symbols.forEach((sym, idx) => {
      const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[0] || 0;
      holdings[sym] = price ? (initCapital / n) / price : 0;
    });

    const portfolio: { date: string; value: number }[] = [];
    const weeklyMap = new Map<string, number>();
    const taxes: { date: string; amount: number }[] = [];

    dates.forEach((date, i) => {
      if (i > 0 && date.getDate() === 1) {
        const monthlyCapital = Number(monthly) * Number(leverage);
        symbols.forEach((sym, idx) => {
          const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
          if (price) holdings[sym] += (monthlyCapital / n) / price;
        });
      }

      symbols.forEach((sym, idx) => {
        const events = charts[idx].events?.dividends as Record<number, { amount: number }> | undefined;
        const ts = charts[idx].timestamp?.[i];
        const div = ts && events && events[ts] ? events[ts].amount : 0;
        if (div) {
          const shares = holdings[sym];
          const amount = shares * div;
          const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
          if (price) holdings[sym] += amount / price;
          const weekKey = startOfWeek(date).toISOString().slice(0, 10);
          weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + amount);
          taxes.push({ date: date.toISOString().slice(0, 10), amount: amount * 0.15 });
        }
      });

      const value = symbols.reduce((sum, sym, idx) => {
        const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
        return sum + holdings[sym] * price;
      }, 0);
      portfolio.push({ date: date.toISOString().slice(0, 10), value });
    });

    const weeklyDividends = Array.from(weeklyMap.entries()).map(([week, amount]) => ({ week, amount }));

    return NextResponse.json({ portfolio, weeklyDividends, taxes });
  } catch {
    return NextResponse.json({ error: 'data fetch failed' }, { status: 500 });
  }
}
