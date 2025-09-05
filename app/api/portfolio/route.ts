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
    const targetLev = Math.min(Number(leverage), 1.75);
    const initCapital = Number(initial) * targetLev;

    symbols.forEach((sym, idx) => {
      const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[0] || 0;
      holdings[sym] = price ? (initCapital / n) / price : 0;
    });

    let marginLoan = initCapital - Number(initial);
    let cash = 0;

    const portfolio: { date: string; value: number }[] = [];
    const weeklyMap = new Map<string, number>();
    const taxes: { date: string; amount: number }[] = [];
    const margin: { date: string; loan: number; cash: number; uec: number }[] = [];
    const marginCalls: { date: string }[] = [];

    dates.forEach((date, i) => {
      if (i > 0 && date.getDate() === 1) {
        const totalCash = Number(monthly) + cash;
        const investEquity = totalCash * 0.75;
        const investTotal = investEquity * targetLev;
        const borrow = investTotal - investEquity;
        marginLoan += borrow;
        cash = totalCash - investEquity;
        symbols.forEach((sym, idx) => {
          const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
          if (price) holdings[sym] += (investTotal / n) / price;
        });
      }

      let dailyDividend = 0;
      symbols.forEach((sym, idx) => {
        const events = charts[idx].events?.dividends as Record<number, { amount: number }> | undefined;
        const ts = charts[idx].timestamp?.[i];
        const div = ts && events && events[ts] ? events[ts].amount : 0;
        if (div) {
          const shares = holdings[sym];
          const amount = shares * div;
          marginLoan = Math.max(marginLoan - amount, 0);
          dailyDividend += amount;
          const weekKey = startOfWeek(date).toISOString().slice(0, 10);
          weeklyMap.set(weekKey, (weeklyMap.get(weekKey) || 0) + amount);
          taxes.push({ date: date.toISOString().slice(0, 10), amount: amount * 0.15 });
        }
      });

      if (dailyDividend > 0) {
        const investEquity = dailyDividend * 0.75;
        const investTotal = investEquity * targetLev;
        const borrow = investTotal - investEquity;
        marginLoan += borrow;
        cash += dailyDividend - investEquity;
        symbols.forEach((sym, idx) => {
          const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
          if (price) holdings[sym] += (investTotal / n) / price;
        });
      }

      const value = symbols.reduce((sum, sym, idx) => {
        const price = charts[idx].indicators?.adjclose?.[0]?.adjclose?.[i] || 0;
        return sum + holdings[sym] * price;
      }, 0);
      const equity = value + cash - marginLoan;
      const requirement = value * 0.25;
      if (equity < requirement) {
        marginCalls.push({ date: date.toISOString().slice(0, 10) });
      }
      portfolio.push({ date: date.toISOString().slice(0, 10), value });
      margin.push({ date: date.toISOString().slice(0, 10), loan: marginLoan, cash, uec: value });
    });

    const weeklyDividends = Array.from(weeklyMap.entries()).map(([week, amount]) => ({ week, amount }));

    return NextResponse.json({ portfolio, weeklyDividends, taxes, margin, marginCalls });
  } catch {
    return NextResponse.json({ error: 'data fetch failed' }, { status: 500 });
  }
}
