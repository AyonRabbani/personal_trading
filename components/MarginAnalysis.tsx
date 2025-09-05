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

interface Props {
  /** Baseline daily snapshots (uec captures market moves you observed historically). */
  margin: MarginSnap[];
  /** Dividend cash events; they first reduce the loan on receipt. */
  dividends?: Dividend[];
  /** Optional knobs (defaults match your spec). */
  maintenanceRatio?: number;
  reinvestPct?: number;       // % of monthly dividends to redeploy
  reinvestLeverage?: number;  // X leverage applied to reinvestPct of dividends
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
  maintenanceRatio = 0.25,
  reinvestPct = 0.75,
  reinvestLeverage = 1.75,
}: Props) {
  const dividendMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dividends) m.set(d.date, (m.get(d.date) ?? 0) + d.amount);
    return m;
  }, [dividends]);

  const sim = React.useMemo<SimRow[]>(() => {
    if (!margin || margin.length === 0) return [];

    // Sort by date ascending to be safe
    const base = [...margin].sort((a, b) => a.date.localeCompare(b.date));

    // State we will evolve
    let loan = base[0].loan;
    let cash = base[0].cash;
    let uec  = base[0].uec;

    // Tracking for month metrics
    let monthAccDiv = 0;               // sum of dividends this month (gross)
    let monthStartEquity = uec + cash - loan;
    let monthLoanSum = 0;              // for avg loan calc
    let monthLoanDays = 0;
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

      // 2) Dividends on this date → immediately reduce the loan (excess to cash)
      const div = dividendMap.get(snap.date) ?? 0;
      if (div > 0) {
        const pay = Math.min(div, loan);
        loan -= pay;
        const leftover = div - pay;
        if (leftover > 0) cash += leftover; // if loan fully repaid, excess cash is real cash
        monthAccDiv += div;
      }

      // 3) Compute MV/Equity/Maintenance & margin call diagnostics
      const mv = Math.max(uec + cash, 0);
      const equity = mv - loan;
      const mr = maintenanceRatio * mv;
      const buffer = equity - mr;
      const usagePct = mv > 0 ? loan / mv : 0;
      const equityRatio = mv > 0 ? equity / mv : 1;
      const hadCall = buffer < 0;

      // Cash deposit needed to satisfy call (assumes deposit so MV unchanged)
      const callCashNeeded = hadCall ? mr - equity : 0;

      // Equivalent securities notional to sell to satisfy (proceeds pay loan; equity stays same, MR shrinks)
      // Need S s.t. equity >= m*(mv - S)  ⇒  S >= (m*mv - equity)/m = (mr - equity)/m
      const callSellNeeded = hadCall ? (mr - equity) / maintenanceRatio : 0;

      // 4) Month-end reinvestment logic (after diagnostics so the marker reflects pre-trade state)
      const ym = getYMD(snap.date);
      const nextYM = i < lastIdx ? getYMD(base[i + 1].date) : null;
      const isMonthEnd = !nextYM || nextYM.m !== ym.m || nextYM.y !== ym.y;

      // Update running loan avg for month
      monthLoanSum += loan;
      monthLoanDays += 1;

      // Collect row BEFORE potential month-end trade (so calls align with pre-trade state)
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

      // Month-end: redeploy reinvestPct of monthly dividends at leverage
      if (isMonthEnd && monthAccDiv > 0) {
        const equityToDeploy = reinvestPct * monthAccDiv;
        const purchaseNotional = equityToDeploy * reinvestLeverage;
        if (purchaseNotional > 0) {
          uec += purchaseNotional;
          loan += purchaseNotional - equityToDeploy;
        }
      }

      // Month-end: compute Return on Margin for the finished month (simple)
      if (isMonthEnd) {
        const monthEndEquity = uec + cash - loan;
        const pnl = monthEndEquity - monthStartEquity;
        const avgLoan = monthLoanDays > 0 ? monthLoanSum / monthLoanDays : 0;
        const rom = avgLoan !== 0 ? pnl / Math.abs(avgLoan) : 0;
        rows[rows.length - 1].romMonthly = rom;

        // reset month trackers for next month
        monthAccDiv = 0;
        monthStartEquity = monthEndEquity;
        monthLoanSum = 0;
        monthLoanDays = 0;
      }
    }

    return rows;
  }, [margin, dividendMap, maintenanceRatio, reinvestPct, reinvestLeverage]);

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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Equity" value={fmt(latest?.equity)} />
        <SummaryCard label="Loan" value={fmt(latest?.loan)} />
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

