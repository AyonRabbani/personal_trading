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
type Dividend   = { date: string; amount: number };
type CashFlow   = { date: string; amount: number; note?: string };

interface Props {
  margin: MarginSnap[];
  dividends?: Dividend[];
  cashFlows?: CashFlow[];

  maintenanceRatio?: number;          // e.g., 0.25
  reinvestPct?: number;               // e.g., 0.75 (of monthly dividends)
  reinvestLeverage?: number;          // e.g., 1.75
  interestAPR?: number;               // e.g., 0.08 = 8% annual
  interestDayCount?: number;          // 365 default
  borrowTargetPctOfCapacity?: number; // e.g., 0.75
}

type SimRow = MarginSnap & {
  mv: number;                 // total market value (uec + cash)
  equity: number;             // mv - loan
  equityEconomic: number;     // equity - accrued interest MTD (economic view)
  mr: number;                 // maintenance requirement ($)
  buffer: number;             // equity - mr
  usagePct: number;           // loan / mv
  equityRatio: number;        // equity / mv
  monthEnd: boolean;

  // Cash/div/interest & flows
  div: number;                // dividend today
  divMTD: number;
  divYTD: number;
  flow: number;               // deposit(+)/withdraw(-) today
  interestDaily: number;      // interest accrued today
  interestMTD: number;        // accrued (unsettled) this month
  interestYTD: number;        // accrued YTD

  // Capacity & calls
  borrowCapacity: number;     // L_max - loan (post-diagnostics)
  hadCall: boolean;
  callCashNeeded?: number;
  callSellNeeded?: number;

  // Performance metrics
  romMonthly?: number | null; // set on month-end rows
  rom30d?: number | null;     // rolling 30-row excess return on margin
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

    // Month/Year trackers
    let monthAccDiv = 0;                 // gross dividends received this month
    let monthStartEquity = uec + cash - loan;
    let monthLoanSum = 0;                // for average loan
    let monthLoanDays = 0;
    let monthInterestAccrued = 0;        // daily accrual bucket (charged at month-end)

    let currentYear = getYMD(base[0].date).y;
    let yearAccDiv = 0;
    let yearInterestAccrued = 0;

    const rows: SimRow[] = [];
    const lastIdx = base.length - 1;

    for (let i = 0; i < base.length; i++) {
      const snap = base[i];

      // Date parts
      const ym = getYMD(snap.date);
      if (ym.y !== currentYear) {
        currentYear = ym.y;
        yearAccDiv = 0;
        yearInterestAccrued = 0;
      }

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
        yearAccDiv  += div;
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
      let interestDaily = 0;
      if (loan > 0 && interestAPR > 0) {
        const dailyRate = interestAPR / (interestDayCount || 365);
        interestDaily = loan * dailyRate;
        monthInterestAccrued += interestDaily;
        yearInterestAccrued  += interestDaily;
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

      // Capacity now
      const lMax = Math.max(0, equity * (1 / maintenanceRatio - 1));
      const borrowCapacity = Math.max(0, lMax - loan);

      // Month boundary?
      const nextYM = i < lastIdx ? getYMD(base[i + 1].date) : null;
      const isMonthEnd = !nextYM || nextYM.m !== ym.m || nextYM.y !== ym.y;

      // Track averages
      monthLoanSum += loan;
      monthLoanDays += 1;

      // Pre-month-end economic equity (subtract this month's accrued interest)
      const equityEconomic = equity - monthInterestAccrued;

      // Build row (pre month-end trades)
      rows.push({
        date: snap.date,
        loan,
        cash,
        uec,
        mv,
        equity,
        equityEconomic,
        mr,
        buffer,
        usagePct,
        equityRatio,
        monthEnd: isMonthEnd,
        div,
        divMTD: monthAccDiv,
        divYTD: yearAccDiv,
        flow,
        interestDaily,
        interestMTD: monthInterestAccrued,
        interestYTD: yearInterestAccrued,
        borrowCapacity,
        hadCall,
        callCashNeeded: hadCall ? Math.max(0, callCashNeeded) : undefined,
        callSellNeeded: hadCall ? Math.max(0, callSellNeeded) : undefined,
        romMonthly: null,
        rom30d: null,
      });

      // Rolling 30-row excess return on margin (equityEconomic PnL / avg loan)
      if (rows.length >= 31) {
        const idx = rows.length - 1;
        const prior = rows[idx - 30];
        const pnl30 = rows[idx].equityEconomic - prior.equityEconomic;
        const slice = rows.slice(idx - 29, idx + 1);
        const avgLoan30 = slice.reduce((s, r) => s + r.loan, 0) / slice.length || 0;
        const rom30 = avgLoan30 !== 0 ? pnl30 / Math.abs(avgLoan30) : 0;
        rows[idx].rom30d = rom30;
      }

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
          }
        }

        // C) Borrow up to target (no delever)
        {
          const mvNow = Math.max(uec + cash, 0);
          const equityNow = mvNow - loan;
          const lMax2 = Math.max(0, equityNow * (1 / maintenanceRatio - 1));
          const targetLoan = Math.max(0, borrowTargetPctOfCapacity * lMax2);

          if (loan < targetLoan) {
            const delta = targetLoan - loan;
            uec  += delta;
            loan += delta;
          }
        }

        // D) Compute ROM for the month (after interest settlement, reinvest, borrow-to-target)
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
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <SummaryCard label="Equity" value={fmt(latest?.equity)} />
        <SummaryCard label="Loan" value={fmt(latest?.loan)} />
        <SummaryCard label="Cash" value={fmt(latest?.cash)} />
        <SummaryCard label="MV" value={fmt(latest?.mv)} />
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

      {/* Margin Calls */}
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

      {/* Daily Ledger Table */}
      <div>
        <h3 className="font-semibold mb-2">Daily Ledger</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-[28rem] rounded border border-slate-200">
          <table className="min-w-[1400px] w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left">
                <th className="p-2">Date</th>
                <th className="p-2 text-right">Cash</th>
                <th className="p-2 text-right">Market Value</th>
                <th className="p-2 text-right">Dividend</th>
                <th className="p-2 text-right">Div MTD</th>
                <th className="p-2 text-right">Div YTD</th>
                <th className="p-2 text-right">Flow</th>
                <th className="p-2 text-right">Loan</th>
                <th className="p-2 text-right">Maint ($)</th>
                <th className="p-2 text-right">Buffer</th>
                <th className="p-2 text-right">Equity</th>
                <th className="p-2 text-right">Equity Ratio</th>
                <th className="p-2 text-right">Usage %</th>
                <th className="p-2 text-right">Interest (day)</th>
                <th className="p-2 text-right">Interest MTD</th>
                <th className="p-2 text-right">Borrow Cap</th>
                <th className="p-2 text-right">Excess ROM (30d)</th>
                <th className="p-2 text-right">ROM (Month)</th>
                <th className="p-2 text-right">Call Cash</th>
                <th className="p-2 text-right">Call Sell</th>
              </tr>
            </thead>
            <tbody>
              {sim.map((r) => (
                <tr key={r.date} className="odd:bg-white even:bg-slate-50/50">
                  <td className="p-2 whitespace-nowrap">{r.date}{r.monthEnd ? ' •' : ''}</td>
                  <td className="p-2 text-right">{fmt(r.cash)}</td>
                  <td className="p-2 text-right">{fmt(r.mv)}</td>
                  <td className="p-2 text-right">{r.div ? fmt(r.div) : '-'}</td>
                  <td className="p-2 text-right">{r.divMTD ? fmt(r.divMTD) : '-'}</td>
                  <td className="p-2 text-right">{r.divYTD ? fmt(r.divYTD) : '-'}</td>
                  <td className="p-2 text-right">{r.flow ? fmt(r.flow) : '-'}</td>
                  <td className="p-2 text-right">{fmt(r.loan)}</td>
                  <td className="p-2 text-right">{fmt(r.mr)}</td>
                  <td className={`p-2 text-right ${r.buffer < 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(r.buffer)}</td>
                  <td className="p-2 text-right">{fmt(r.equity)}</td>
                  <td className="p-2 text-right">{pct(r.equityRatio)}</td>
                  <td className="p-2 text-right">{pct(r.usagePct)}</td>
                  <td className="p-2 text-right">{r.interestDaily ? fmt(r.interestDaily) : '-'}</td>
                  <td className="p-2 text-right">{r.interestMTD ? fmt(r.interestMTD) : '-'}</td>
                  <td className="p-2 text-right">{r.borrowCapacity ? fmt(r.borrowCapacity) : '-'}</td>
                  <td className="p-2 text-right">{r.rom30d !== null && r.rom30d !== undefined ? pct(r.rom30d) : '-'}</td>
                  <td className="p-2 text-right">{r.romMonthly !== null && r.romMonthly !== undefined ? pct(r.romMonthly) : '-'}</td>
                  <td className={`p-2 text-right ${r.hadCall ? 'text-red-600' : ''}`}>{r.callCashNeeded ? fmt(r.callCashNeeded) : '-'}</td>
                  <td className={`p-2 text-right ${r.hadCall ? 'text-red-600' : ''}`}>{r.callSellNeeded ? fmt(r.callSellNeeded) : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          Excess ROM (30d) = 30-row equity P&amp;L (economic) / avg loan over the same window.
          Economic equity subtracts this month&apos;s accrued (unsettled) interest from equity.
        </p>
      </div>
    </div>
  );
}

