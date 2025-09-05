'use client';

import * as React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  AreaChart,
  Area,
} from 'recharts';

type MarginSnap = { date: string; loan: number; cash: number; uec: number };
type Dividend = { date: string; amount: number };
type CashFlow = { date: string; amount: number; note?: string };

interface Props {
  /** Baseline daily snapshots (uec captures market moves you observed historically). */
  margin: MarginSnap[];
  /** Dividends; on receipt they first reduce the loan (excess to cash). */
  dividends?: Dividend[];
  /** Deposits / withdrawals; withdrawal uses cash first then borrows if needed. */
  cashFlows?: CashFlow[];

  /** ——— Knobs (defaults match your spec) ——— */
  maintenanceRatio?: number;    // e.g., 0.25
  reinvestPct?: number;         // % of monthly dividends to redeploy (e.g., 0.75)
  reinvestLeverage?: number;    // X leverage applied to reinvestPct of dividends (e.g., 1.75)
  interestAPR?: number;         // annual margin rate, e.g., 0.08 = 8%
  interestDayCount?: number;    // 365 by default
  borrowTargetPctOfCapacity?: number; // e.g., 0.75 → borrow 75% of available capacity at month-end
}

type SimRow = MarginSnap & {
  mv: number;                 // total market value (uec + cash)
  equity: number;             // mv - loan
  mr: number;                 // maintenance requirement ($)
  buffer: number;             // equity - mr
  usagePct: number;           // loan / mv
  equityRatio: number;        // equity / mv
  monthEnd: boolean;
  romMonthly?: number | null; // return on margin (for that month, set on month-end rows)
  hadCall: boolean;
  callCashNeeded?: number;    // cash deposit needed to clear call (assumes deposit)
  callSellNeeded?: number;    // amount of securities to sell to clear call (assumes sale pays loan)
};

function getYMD(d: string) {
  const x = new Date(d + 'T00:00:00');
  return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() };
}

function fmt(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

function pct(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return `${(n * 100).toFixed(1)}%`;
}

function SummaryCard({ label, value, danger = false }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`p-2 rounded shadow bg-white text-center ${danger ? 'text-red-600' : 'text-slate-700'}`}>
      <div className="text-xs uppercase tracking-wide">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

export default function MarginAnalysis({
  margin,
  dividends = [],
  cashFlows = [],
  maintenanceRatio = 0.25,
  reinvestPct = 0.75,
  reinvestLeverage = 1.75,
  interestAPR = 0.08,
  interestDayCount = 365,
  borrowTargetPctOfCapacity = 0.75,
}: Props) {
  const dividendMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dividends) m.set(d.date, (m.get(d.date) ?? 0) + d.amount);
    return m;
  }, [dividends]);

  const flowMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const f of cashFlows) m.set(f.date, (m.get(f.date) ?? 0) + f.amount);
    return m;
  }, [cashFlows]);

  const sim = React.useMemo<SimRow[]>(() => {
    if (!margin || margin.length === 0) return [];

    const base = [...margin].sort((a, b) => a.date.localeCompare(b.date));

    // Evolving state
    let loan = base[0].loan;
    let cash = base[0].cash;
    let uec  = base[0].uec;

    // Month trackers
    let monthAccDiv = 0;               // gross dividends received this month
    let monthStartEquity = uec + cash - loan;
    let monthLoanSum = 0;              // for average loan
    let monthLoanDays = 0;
    let monthInterestAccrued = 0;      // daily accrual bucket (charged at month-end)

    const rows: SimRow[] = [];
    const lastIdx = base.length - 1;

    for (let i = 0; i < base.length; i++) {
      const snap = base[i];

      // 1) Apply price-only return from baseline uec series
      if (i > 0) {
        const prev = base[i - 1].uec;
        const curr = base[i].uec;
        const ret = prev > 0 ? curr / prev - 1 : 0;
        uec = uec * (1 + ret);
      } else {
        uec = base[0].uec;
      }

      // 2) Dividends today → reduce loan first, excess to cash
      const div = dividendMap.get(snap.date) ?? 0;
      if (div > 0) {
        const pay = Math.min(div, loan);
        loan -= pay;
        const leftover = div - pay;
        if (leftover > 0) cash += leftover;
        monthAccDiv += div;
      }

      // 3) Deposits / Withdrawals today
      const flow = flowMap.get(snap.date) ?? 0;
      if (flow !== 0) {
        if (flow > 0) {
          cash += flow; // deposit
        } else {
          // withdrawal: use cash first, then borrow if needed
          const w = -flow;
          if (cash >= w) {
            cash -= w;
          } else {
            const short = w - cash;
            cash = 0;
            loan += short; // borrow to fund the remaining withdrawal
          }
        }
      }

      // 4) Accrue daily interest (charged at month-end)
      if (loan > 0 && interestAPR > 0) {
        const dailyRate = interestAPR / (interestDayCount || 365);
        monthInterestAccrued += loan * dailyRate;
      }

      // 5) Compute diagnostics
      const mv = Math.max(uec + cash, 0);
      const equity = mv - loan;
      const mr = maintenanceRatio * mv;
      const buffer = equity - mr;
      const usagePct = mv > 0 ? loan / mv : 0;
      const equityRatio = mv > 0 ? equity / mv : 1;
      const hadCall = buffer < 0;

      // Margin call sizing
      const callCashNeeded = hadCall ? mr - equity : 0;
      const callSellNeeded = hadCall ? (mr - equity) / maintenanceRatio : 0;

      // Month boundaries
      const ym = getYMD(snap.date);
      const nextYM = i < lastIdx ? getYMD(base[i + 1].date) : null;
      const isMonthEnd = !nextYM || nextYM.m !== ym.m || nextYM.y !== ym.y;

      // Track averages
      monthLoanSum += loan;
      monthLoanDays += 1;

      // Push pre-month-end state (so calls align with pre-trades)
      rows.push({
        date: snap.date,
        loan,
        cash,
        uec,
        mv,
        equity,
        mr,
        buffer,
        usagePct,
        equityRatio,
        monthEnd: isMonthEnd,
        hadCall,
        callCashNeeded: hadCall ? Math.max(0, callCashNeeded) : undefined,
        callSellNeeded: hadCall ? Math.max(0, callSellNeeded) : undefined,
        romMonthly: null,
      });

      // === Month-end actions ===
      if (isMonthEnd) {
        // A) Settle interest: pay from cash; if short, capitalize to loan
        if (monthInterestAccrued > 0) {
          if (cash >= monthInterestAccrued) {
            cash -= monthInterestAccrued;
          } else {
            const short = monthInterestAccrued - cash;
            cash = 0;
            loan += short; // capitalize unpaid interest
          }
        }

        // B) Reinvest reinvestPct of this month's dividends at reinvestLeverage
        if (monthAccDiv > 0 && reinvestPct > 0 && reinvestLeverage > 0) {
          const equityToDeploy = reinvestPct * monthAccDiv;
          const notional = equityToDeploy * reinvestLeverage;

          if (notional > 0) {
            // Use cash for the equity portion; if cash < equityToDeploy, the rest effectively gets borrowed
            const useCash = Math.max(0, Math.min(cash, equityToDeploy));
            uec  += notional;
            loan += notional - useCash;
            cash -= useCash;
            // Equity unchanged by this trade (correct accounting)
          }
        }

        // C) Borrow up to target (e.g., 75% of available capacity), no delever
        // Capacity based on maintenance: L_max = Equity * (1/m - 1). Equity computed AFTER interest & reinvest.
        {
          const mvNow = Math.max(uec + cash, 0);
          const equityNow = mvNow - loan;
          const lMax = Math.max(0, equityNow * (1 / maintenanceRatio - 1));
          const targetLoan = Math.max(0, borrowTargetPctOfCapacity * lMax);

          if (loan < targetLoan) {
            const delta = targetLoan - loan;
            // Borrow delta, buy same delta notional
            uec  += delta;
            loan += delta;
            // cash unchanged; equity unchanged; usage increases
          }
        }

        // D) Compute ROM for the month (after interest, reinvest, and borrow-to-target)
        {
          const monthEndEquity = (uec + cash) - loan;
          const pnl = monthEndEquity - monthStartEquity;
          const avgLoan = monthLoanDays > 0 ? monthLoanSum / monthLoanDays : 0;
          const rom = avgLoan !== 0 ? pnl / Math.abs(avgLoan) : 0;
          rows[rows.length - 1].romMonthly = rom;

          // reset month trackers
          monthAccDiv = 0;
          monthInterestAccrued = 0;
          monthStartEquity = monthEndEquity;
          monthLoanSum = 0;
          monthLoanDays = 0;
        }
      }
    }

    return rows;
  }, [
    margin,
    dividendMap,
    flowMap,
    maintenanceRatio,
    reinvestPct,
    reinvestLeverage,
    interestAPR,
    interestDayCount,
    borrowTargetPctOfCapacity,
  ]);

  const marginCalls = React.useMemo(
    () =>
      sim.filter((r) => r.hadCall).map((r) => ({
        date: r.date,
        callCashNeeded: r.callCashNeeded ?? 0,
        callSellNeeded: r.callSellNeeded ?? 0,
        buffer: r.buffer,
      })),
    [sim]
  );

  const latest = sim.at(-1);

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <SummaryCard label="Equity" value={fmt(latest?.equity)} />
        <SummaryCard label="Loan" value={fmt(latest?.loan)} />
        <SummaryCard label="Cash" value={fmt(latest?.cash)} />
        <SummaryCard label="Margin Usage" value={pct(latest?.usagePct)} />
        <SummaryCard label="Maint. Buffer" value={fmt(latest?.buffer)} danger={!!latest && latest.buffer < 0} />
      </div>

      {/* Dollar Chart */}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={sim}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis />
            <Tooltip
              formatter={(v: number, n: string) => (n.includes('%') ? pct(v) : fmt(v))}
              labelFormatter={(l) => `Date: ${l}`}
            />
            <ReferenceLine y={0} stroke="#475569" />
            <Line type="monotone" dataKey="loan" name="Margin Loan" stroke="#b91c1c" dot={false} />
            <Line type="monotone" dataKey="cash" name="Cash" stroke="#0ea5e9" dot={false} />
            <Line type="monotone" dataKey="uec" name="Securities MV" stroke="#047857" dot={false} />
            <Line type="monotone" dataKey="equity" name="Equity" stroke="#6366f1" dot={false} />
            <Line type="monotone" dataKey="mr" name="Maintenance ($)" stroke="#f59e0b" strokeDasharray="4 4" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Equity Ratio vs Maintenance */}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={sim}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" hide />
            <YAxis domain={[0, 1]} tickFormatter={(v) => pct(v)} />
            <Tooltip formatter={(v: number) => pct(v)} labelFormatter={(l) => `Date: ${l}`} />
            <ReferenceLine y={maintenanceRatio} stroke="#f59e0b" strokeDasharray="4 4" />
            <Area type="monotone" dataKey="equityRatio" name="Equity Ratio" stroke="#6366f1" fill="#c7d2fe" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {marginCalls.length > 0 && (
        <div>
          <h3 className="font-semibold">Margin Calls</h3>
          <ul className="list-disc pl-5">
            {marginCalls.map((m) => (
              <li key={m.date}>
                {m.date}: deposit {fmt(m.callCashNeeded)} or sell {fmt(m.callSellNeeded)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

