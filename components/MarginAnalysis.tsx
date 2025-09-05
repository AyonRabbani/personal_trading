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

/** Row shape for prices: each item is { date, TICKER1: price, TICKER2: price, ... }  */
type PriceRow = { date: string; [ticker: string]: number | string };

interface Props {
  margin: MarginSnap[];
  dividends?: Dividend[];
  cashFlows?: CashFlow[];

  /** Optional per-day price table. Example: [{date:'2025-01-01', SPY: 480.2, QQQ: 410.3}] */
  prices?: PriceRow[];

  /** Knobs */
  maintenanceRatio?: number;     // e.g., 0.25
  interestAPR?: number;          // e.g., 0.08
  interestDayCount?: number;     // 365 by default
  /** Target to borrow (equity basis) after month-end reset. 0.75 => loan = 75% of equity */
  borrowTargetPct?: number;      // default 0.75

  /** Keep two rows on month-end: pre actions (D) and post actions (EOM). */
  showDualMonthEndRows?: boolean; // default true
}

type Stage = 'D' | 'EOM'; // Daily snapshot vs. Month-end post-actions

type SimRow = MarginSnap & {
  stage: Stage;             // 'D' pre EOM, 'EOM' post-reset & re-lever
  mv: number;               // cash + uec
  equity: number;           // mv - loan
  equityEconomic: number;   // equity - accrued interest MTD
  mr: number;               // maintenance requirement ($)
  buffer: number;           // equity - mr
  usagePct: number;         // loan / mv
  equityRatio: number;      // equity / mv
  monthEnd: boolean;

  // Cash/div/interest & flows
  div: number;              // dividend today
  divMTD: number;
  divYTD: number;
  flow: number;             // deposit(+)/withdraw(-) today
  interestDaily: number;    // interest accrued today
  interestMTD: number;      // accrued (unsettled) this month
  interestYTD: number;      // accrued YTD

  // Capacity & calls
  borrowCapacity: number;   // L_max - loan (for display)
  hadCall: boolean;
  callCashNeeded?: number;
  callSellNeeded?: number;

  // Month-end mechanics audit
  eomLiquidationProceeds?: number; // amount moved from uec -> cash
  eomLoanPaydown?: number;         // loan repayment from cash
  eomShortfall?: number;           // if loan couldn't be fully repaid
  eomBorrowToTarget?: number;      // new borrow to hit target
  eomTargetLoan?: number;

  // Performance metrics
  romMonthly?: number | null;
  rom30d?: number | null;

  // Optional per-day quote map for tickers
  prices?: Record<string, number>;
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
  prices = [],
  maintenanceRatio = 0.25,
  interestAPR = 0.08,
  interestDayCount = 365,
  borrowTargetPct = 0.75,
  showDualMonthEndRows = true,
}: Props) {
  // Map: date -> total dividend
  const dividendMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const d of dividends) m.set(d.date, (m.get(d.date) ?? 0) + d.amount);
    return m;
  }, [dividends]);

  // Map: date -> net cash flow
  const flowMap = React.useMemo(() => {
    const m = new Map<string, number>();
    for (const f of cashFlows) m.set(f.date, (m.get(f.date) ?? 0) + f.amount);
    return m;
  }, [cashFlows]);

  // Map: date -> {ticker: price,...} and list of tickers (dynamic columns)
  const { priceMap, priceTickers } = React.useMemo(() => {
    const pMap = new Map<string, Record<string, number>>();
    let tickers: string[] = [];
    for (const r of prices) {
      const cleaned: Record<string, number> = {};
      const restObj = r as Record<string, unknown>;
      for (const k of Object.keys(restObj)) {
        const v = restObj[k];
        if (k !== 'date' && typeof v === 'number') cleaned[k] = v;
      }
      pMap.set(r.date, cleaned);
      if (tickers.length === 0) tickers = Object.keys(cleaned);
    }
    return { priceMap: pMap, priceTickers: tickers };
  }, [prices]);

  const sim = React.useMemo<SimRow[]>(() => {
    if (!margin || margin.length === 0) return [];

    const base = [...margin].sort((a, b) => a.date.localeCompare(b.date));

    // Evolving state
    let loan = base[0].loan;
    let cash = base[0].cash;
    let uec  = base[0].uec;

    // Month/Year trackers
    let monthAccDiv = 0;
    let monthStartEquity = uec + cash - loan;
    let monthLoanSum = 0;
    let monthLoanDays = 0;
    let monthInterestAccrued = 0;

    let currentYear = getYMD(base[0].date).y;
    let yearAccDiv = 0;
    let yearInterestAccrued = 0;

    const rows: SimRow[] = [];
    const lastIdx = base.length - 1;

    for (let i = 0; i < base.length; i++) {
      const snap = base[i];
      const ym = getYMD(snap.date);
      if (ym.y !== currentYear) {
        currentYear = ym.y;
        yearAccDiv = 0;
        yearInterestAccrued = 0;
      }

      // 1) Apply price-only return from baseline uec series (on whatever uec we currently hold)
      if (i > 0) {
        const prev = base[i - 1].uec;
        const curr = base[i].uec;
        const ret = prev > 0 ? curr / prev - 1 : 0;
        uec = uec * (1 + ret);
      } else {
        uec = base[0].uec;
      }

      // 2) Dividends → reduce loan first, excess to cash
      const div = dividendMap.get(snap.date) ?? 0;
      if (div > 0) {
        const pay = Math.min(div, loan);
        loan -= pay;
        const leftover = div - pay;
        if (leftover > 0) cash += leftover;
        monthAccDiv += div;
        yearAccDiv  += div;
      }

      // 3) Deposits / Withdrawals
      const flow = flowMap.get(snap.date) ?? 0;
      if (flow !== 0) {
        if (flow > 0) {
          cash += flow; // deposit
        } else {
          const w = -flow;
          if (cash >= w) {
            cash -= w;
          } else {
            const short = w - cash;
            cash = 0;
            loan += short; // borrow to fund withdrawal
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

      // 5) Diagnostics (pre month-end)
      const mvPre = Math.max(uec + cash, 0);
      const equityPre = mvPre - loan;
      const mrPre = maintenanceRatio * mvPre;
      const bufferPre = equityPre - mrPre;
      const usagePctPre = mvPre > 0 ? loan / mvPre : 0;
      const equityRatioPre = mvPre > 0 ? equityPre / mvPre : 1;
      const hadCallPre = bufferPre < 0;

      const callCashNeeded = hadCallPre ? mrPre - equityPre : 0;
      const callSellNeeded = hadCallPre ? (mrPre - equityPre) / maintenanceRatio : 0;

      // Capacity (display)
      const lMaxPre = Math.max(0, equityPre * (1 / maintenanceRatio - 1));
      const borrowCapacityPre = Math.max(0, lMaxPre - loan);

      // Month boundary?
      const nextYM = i < lastIdx ? getYMD(base[i + 1].date) : null;
      const isMonthEnd = !nextYM || nextYM.m !== ym.m || nextYM.y !== ym.y;

      // Track averages
      monthLoanSum += loan;
      monthLoanDays += 1;

      // Economic equity subtracts accrued (unsettled) interest
      const equityEconomicPre = equityPre - monthInterestAccrued;

      // --- Push DAILY (pre EOM) row ---
      const pricesToday = priceMap.get(snap.date) || undefined;
      const dailyRow: SimRow = {
        stage: 'D',
        date: snap.date,
        loan,
        cash,
        uec,
        mv: mvPre,
        equity: equityPre,
        equityEconomic: equityEconomicPre,
        mr: mrPre,
        buffer: bufferPre,
        usagePct: usagePctPre,
        equityRatio: equityRatioPre,
        monthEnd: isMonthEnd,
        div,
        divMTD: monthAccDiv,
        divYTD: yearAccDiv,
        flow,
        interestDaily,
        interestMTD: monthInterestAccrued,
        interestYTD: yearInterestAccrued,
        borrowCapacity: borrowCapacityPre,
        hadCall: hadCallPre,
        callCashNeeded: hadCallPre ? Math.max(0, callCashNeeded) : undefined,
        callSellNeeded: hadCallPre ? Math.max(0, callSellNeeded) : undefined,
        romMonthly: null,
        rom30d: null,
        prices: pricesToday,
      };
      rows.push(dailyRow);

      // Rolling 30-row ROM using economic equity
      if (rows.length >= 31) {
        const idx = rows.length - 1;
        const prior = rows[idx - 30];
        const pnl30 = rows[idx].equityEconomic - prior.equityEconomic;
        const slice = rows.slice(idx - 29, idx + 1);
        const avgLoan30 = slice.reduce((s, r) => s + r.loan, 0) / slice.length || 0;
        rows[idx].rom30d = avgLoan30 !== 0 ? pnl30 / Math.abs(avgLoan30) : 0;
      }

      // === Month-end actions: SELL ALL → PAY LOAN → RE-LEVER TO TARGET (equity basis) ===
      if (isMonthEnd) {
        // A) Settle interest first (reduces cash or increases loan)
        if (monthInterestAccrued > 0) {
          if (cash >= monthInterestAccrued) {
            cash -= monthInterestAccrued;
          } else {
            const short = monthInterestAccrued - cash;
            cash = 0;
            loan += short; // capitalize unpaid interest
          }
        }

        // B) Liquidate all securities
        const liquidationProceeds = uec;
        cash += liquidationProceeds;
        uec = 0;

        // C) Pay down loan fully from cash (if possible)
        const loanPaydown = Math.min(loan, cash);
        loan -= loanPaydown;
        cash -= loanPaydown;
        const shortfall = loan > 0 ? loan : 0; // if > 0, still under water

        // D) Re-lever from clean slate (equity = cash - loan)
        const equityNow = Math.max(0, cash - loan);
        const targetLoan = Math.max(0, borrowTargetPct * equityNow);
        let borrowed = 0;
        if (targetLoan > loan) {
          borrowed = targetLoan - loan; // usually = targetLoan if loan==0
          loan += borrowed;
          uec += borrowed;             // buy securities with borrowed funds only
        } else if (targetLoan < loan) {
          // Shouldn't happen after payoff, but keep symmetry to be safe:
          const repay = Math.min(loan - targetLoan, cash);
          loan -= repay;
          cash -= repay;
          // If still above target and no cash, we could sell UEC, but you specified sell-all only at month-end.
        }

        // Post diagnostics
        const mvPost = Math.max(uec + cash, 0);
        const equityPost = mvPost - loan;
        const mrPost = maintenanceRatio * mvPost;
        const bufferPost = equityPost - mrPost;
        const usagePctPost = mvPost > 0 ? loan / mvPost : 0;
        const equityRatioPost = mvPost > 0 ? equityPost / mvPost : 1;

        // Month ROM (computed on post-action snapshot)
        const monthEndEquity = equityPost;
        const pnl = monthEndEquity - monthStartEquity;
        const avgLoan = monthLoanDays > 0 ? monthLoanSum / monthLoanDays : 0;
        const rom = avgLoan !== 0 ? pnl / Math.abs(avgLoan) : 0;

        if (showDualMonthEndRows) {
          rows.push({
            stage: 'EOM',
            date: snap.date,
            loan,
            cash,
            uec,
            mv: mvPost,
            equity: equityPost,
            equityEconomic: equityPost, // after settlement, economic==accounting
            mr: mrPost,
            buffer: bufferPost,
            usagePct: usagePctPost,
            equityRatio: equityRatioPost,
            monthEnd: true,
            div: 0,
            divMTD: 0,
            divYTD: yearAccDiv,
            flow: 0,
            interestDaily: 0,
            interestMTD: 0,
            interestYTD: yearInterestAccrued,
            borrowCapacity: Math.max(0, Math.max(0, equityPost * (1 / maintenanceRatio - 1)) - loan),
            hadCall: bufferPost < 0,
            romMonthly: rom,
            rom30d: null,
            eomLiquidationProceeds: liquidationProceeds,
            eomLoanPaydown: loanPaydown,
            eomShortfall: shortfall || undefined,
            eomBorrowToTarget: borrowed || undefined,
            eomTargetLoan: targetLoan,
            prices: priceMap.get(snap.date) || undefined,
            callCashNeeded: undefined,
            callSellNeeded: undefined,
          });
        } else {
          // If not showing dual rows, attach ROM to the pre row
          rows[rows.length - 1].romMonthly = rom;
        }

        // Reset month trackers
        monthAccDiv = 0;
        monthInterestAccrued = 0;
        monthStartEquity = monthEndEquity;
        monthLoanSum = 0;
        monthLoanDays = 0;
      }
    }

    return rows;
  }, [
    margin,
    dividendMap,
    flowMap,
    priceMap,
    maintenanceRatio,
    interestAPR,
    interestDayCount,
    borrowTargetPct,
    showDualMonthEndRows,
  ]);

  // For charts, show the post-EOM snapshot instead of the pre-EOM daily one.
  const simForCharts = React.useMemo(
    () => sim.filter(r => !(r.monthEnd && r.stage === 'D')),
    [sim]
  );

  const marginCalls = React.useMemo(
    () => sim.filter((r) => r.hadCall).map((r) => ({
      date: r.date + (r.stage === 'EOM' ? ' (EOM)' : ''),
      callCashNeeded: r.callCashNeeded ?? 0,
      callSellNeeded: r.callSellNeeded ?? 0,
      buffer: r.buffer,
    })), [sim]
  );

  const latest = simForCharts.at(-1);

  // === CSV Export ===
  const handleExportCSV = React.useCallback(() => {
    if (!sim.length) return;

    const baseCols = [
      'date','stage','cash','uec','mv','loan','equity','mr','buffer','usagePct','equityRatio',
      'div','divMTD','divYTD','flow','interestDaily','interestMTD','interestYTD',
      'borrowCapacity','rom30d','romMonthly',
      'eomLiquidationProceeds','eomLoanPaydown','eomShortfall','eomBorrowToTarget','eomTargetLoan'
    ];

    const cols = [...baseCols, ...priceTickers.map(t => `price:${t}`)];

    const rows = sim.map(r => {
      const rec: Record<string, string | number> = {
        date: r.date,
        stage: r.stage,
        cash: r.cash ?? '',
        uec: r.uec ?? '',
        mv: r.mv ?? '',
        loan: r.loan ?? '',
        equity: r.equity ?? '',
        mr: r.mr ?? '',
        buffer: r.buffer ?? '',
        usagePct: r.usagePct ?? '',
        equityRatio: r.equityRatio ?? '',
        div: r.div ?? '',
        divMTD: r.divMTD ?? '',
        divYTD: r.divYTD ?? '',
        flow: r.flow ?? '',
        interestDaily: r.interestDaily ?? '',
        interestMTD: r.interestMTD ?? '',
        interestYTD: r.interestYTD ?? '',
        borrowCapacity: r.borrowCapacity ?? '',
        rom30d: r.rom30d ?? '',
        romMonthly: r.romMonthly ?? '',
        eomLiquidationProceeds: r.eomLiquidationProceeds ?? '',
        eomLoanPaydown: r.eomLoanPaydown ?? '',
        eomShortfall: r.eomShortfall ?? '',
        eomBorrowToTarget: r.eomBorrowToTarget ?? '',
        eomTargetLoan: r.eomTargetLoan ?? '',
      };
      for (const t of priceTickers) {
        rec[`price:${t}`] = r.prices?.[t] ?? '';
      }
      return rec;
    });

    const csv = [
      cols.join(','),
      ...rows.map(row =>
        cols.map(k => {
          const v = (row as Record<string, string | number | undefined>)[k];
          if (v === null || v === undefined) return '';
          const s = String(v);
          return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'daily_ledger.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [sim, priceTickers]);

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

      {/* Dollar Chart (post-EOM snapshots) */}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <LineChart data={simForCharts}>
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

      {/* Equity Ratio vs Maintenance (post-EOM snapshots) */}
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <AreaChart data={simForCharts}>
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

      {/* Controls */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs hover:bg-slate-700"
        >
          Export CSV
        </button>
        <span className="text-xs text-slate-500">
          Month-end rule: sell all → pay loan → borrow {Math.round(borrowTargetPct*100)}% of equity → buy with borrowed only.
        </span>
      </div>

      {/* Daily Ledger Table */}
      <div>
        <h3 className="font-semibold mb-2">Daily Ledger (pre and post month-end)</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-[28rem] rounded border border-slate-200">
          <table className="min-w-[1600px] w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Stage</th>
                <th className="p-2 text-right">Cash</th>
                <th className="p-2 text-right">UEC</th>
                <th className="p-2 text-right">Market Value</th>
                <th className="p-2 text-right">Loan</th>
                <th className="p-2 text-right">Equity</th>
                <th className="p-2 text-right">Maint ($)</th>
                <th className="p-2 text-right">Buffer</th>
                <th className="p-2 text-right">Equity Ratio</th>
                <th className="p-2 text-right">Usage %</th>
                <th className="p-2 text-right">Dividend</th>
                <th className="p-2 text-right">Div MTD</th>
                <th className="p-2 text-right">Div YTD</th>
                <th className="p-2 text-right">Flow</th>
                <th className="p-2 text-right">Interest (day)</th>
                <th className="p-2 text-right">Interest MTD</th>
                <th className="p-2 text-right">Borrow Cap</th>
                <th className="p-2 text-right">Excess ROM (30d)</th>
                <th className="p-2 text-right">ROM (Month)</th>
                <th className="p-2 text-right">EOM Proceeds</th>
                <th className="p-2 text-right">EOM Loan Paydown</th>
                <th className="p-2 text-right">EOM Shortfall</th>
                <th className="p-2 text-right">EOM Borrowed</th>
                <th className="p-2 text-right">EOM Target Loan</th>
                {priceTickers.map(t => (
                  <th key={t} className="p-2 text-right">{t}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sim.map((r) => (
                <tr key={`${r.date}-${r.stage}`} className={`${r.stage === 'EOM' ? 'bg-amber-50' : ''} odd:bg-white even:bg-slate-50/50`}>
                  <td className="p-2 whitespace-nowrap">{r.date}</td>
                  <td className="p-2">{r.stage}</td>
                  <td className="p-2 text-right">{fmt(r.cash)}</td>
                  <td className="p-2 text-right">{fmt(r.uec)}</td>
                  <td className="p-2 text-right">{fmt(r.mv)}</td>
                  <td className="p-2 text-right">{fmt(r.loan)}</td>
                  <td className="p-2 text-right">{fmt(r.equity)}</td>
                  <td className="p-2 text-right">{fmt(r.mr)}</td>
                  <td className={`p-2 text-right ${r.buffer < 0 ? 'text-red-600 font-semibold' : ''}`}>{fmt(r.buffer)}</td>
                  <td className="p-2 text-right">{pct(r.equityRatio)}</td>
                  <td className="p-2 text-right">{pct(r.usagePct)}</td>
                  <td className="p-2 text-right">{r.div ? fmt(r.div) : '-'}</td>
                  <td className="p-2 text-right">{r.divMTD ? fmt(r.divMTD) : '-'}</td>
                  <td className="p-2 text-right">{r.divYTD ? fmt(r.divYTD) : '-'}</td>
                  <td className="p-2 text-right">{r.flow ? fmt(r.flow) : '-'}</td>
                  <td className="p-2 text-right">{r.interestDaily ? fmt(r.interestDaily) : '-'}</td>
                  <td className="p-2 text-right">{r.interestMTD ? fmt(r.interestMTD) : '-'}</td>
                  <td className="p-2 text-right">{r.borrowCapacity ? fmt(r.borrowCapacity) : '-'}</td>
                  <td className="p-2 text-right">{r.rom30d !== null && r.rom30d !== undefined ? pct(r.rom30d) : '-'}</td>
                  <td className="p-2 text-right">{r.romMonthly !== null && r.romMonthly !== undefined ? pct(r.romMonthly) : '-'}</td>
                  <td className="p-2 text-right">{r.eomLiquidationProceeds ? fmt(r.eomLiquidationProceeds) : '-'}</td>
                  <td className="p-2 text-right">{r.eomLoanPaydown ? fmt(r.eomLoanPaydown) : '-'}</td>
                  <td className={`p-2 text-right ${r.eomShortfall ? 'text-red-600' : ''}`}>{r.eomShortfall ? fmt(r.eomShortfall) : '-'}</td>
                  <td className="p-2 text-right">{r.eomBorrowToTarget ? fmt(r.eomBorrowToTarget) : '-'}</td>
                  <td className="p-2 text-right">{r.eomTargetLoan ? fmt(r.eomTargetLoan) : '-'}</td>
                  {priceTickers.map(t => (
                    <td key={`${r.date}-${r.stage}-${t}`} className="p-2 text-right">
                      {r.prices && typeof r.prices[t] === 'number' ? (r.prices[t] as number).toLocaleString() : '-'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500 mt-2">
          EOM row shows: <em>sell all</em> → <em>pay loan</em> → <em>borrow {Math.round(borrowTargetPct*100)}% of equity</em> → <em>buy with borrowed only</em>.
        </p>
      </div>
    </div>
  );
}

