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
type PriceRow = { date: string; [ticker: string]: number | string };

interface Props {
  margin: MarginSnap[];
  dividends?: Dividend[];
  cashFlows?: CashFlow[];
  prices?: PriceRow[];
  maintenanceRatio?: number;
  interestAPR?: number;
  interestDayCount?: number;
  borrowTargetPct?: number;
  showDualMonthEndRows?: boolean;
}

type Stage = 'D' | 'EOM';

type SimRow = MarginSnap & {
  stage: Stage;
  mv: number;
  equity: number;
  mr: number;
  buffer: number;
  usagePct: number;
  equityRatio: number;
  monthEnd: boolean;

  priceRet?: number;
  pricePnL?: number;
  priceMTD?: number;
  priceYTD?: number;

  navDeltaDaily?: number;
  navDeltaMTD?: number;
  navDeltaYTD?: number;
  navDecayUserDaily?: boolean;
  navDecayUserMTD?: boolean;
  navDecayUserYTD?: boolean;

  ppiIndex?: number;
  ptriIndex?: number;
  triRet?: number;

  priceCAGR90?: number;
  triCAGR90?: number;
  navDecayFlag?: boolean;

  div: number;
  divMTD: number;
  divYTD: number;
  flow: number;
  interestDaily: number;
  interestMTD: number;
  interestYTD: number;

  borrowCapacity: number;
  hadCall: boolean;
  callCashNeeded?: number;
  callSellNeeded?: number;

  rv20d?: number;
  sigmaDollar?: number;
  lossToCallDollar?: number;
  lossToCallPctMV?: number;
  daysToCallAt1Sigma?: number;

  eomLiquidationProceeds?: number;
  eomLoanPaydown?: number;
  eomShortfall?: number;
  eomBorrowToTarget?: number;
  eomTargetLoan?: number;

  romMonthly?: number | null;
  rom30d?: number | null;

  prices?: Record<string, number>;
  _mvRet?: number; // internal helper for rolling variance
};

function getYMD(d: string) {
  const x = new Date(d + 'T00:00:00');
  return { y: x.getUTCFullYear(), m: x.getUTCMonth(), d: x.getUTCDate() };
}
function fmt(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}
function num(n?: number, d = 2) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return n.toLocaleString('en-US', { maximumFractionDigits: d });
}
function pct(n?: number) {
  if (n === undefined || Number.isNaN(n)) return '-';
  return `${(n * 100).toFixed(2)}%`;
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

  const { priceMap, priceTickers } = React.useMemo(() => {
    const pMap = new Map<string, Record<string, number>>();
    let tickers: string[] = [];
    for (const r of prices) {
      const cleaned: Record<string, number> = {};
      const entries = Object.entries(r) as [string, unknown][];
      for (const [k, v] of entries) {
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
    let loan = base[0].loan;
    let cash = base[0].cash;
    let uec = base[0].uec;

    let monthAccDiv = 0;
    let monthStartEquity = uec + cash - loan;
    let monthLoanSum = 0;
    let monthLoanDays = 0;
    let monthInterestAccrued = 0;

    let currentYear = getYMD(base[0].date).y;
    let yearAccDiv = 0;
    let yearInterestAccrued = 0;

    let pricePnL_MTD = 0;
    let pricePnL_YTD = 0;

    let ppi = 100;
    let ptri = 100;

    const rows: SimRow[] = [];
    const lastIdx = base.length - 1;

    for (let i = 0; i < base.length; i++) {
      const snap = base[i];
      const ym = getYMD(snap.date);
      const nextYM = i < lastIdx ? getYMD(base[i + 1].date) : null;
      const isMonthEnd = !nextYM || nextYM.m !== ym.m || nextYM.y !== ym.y;

      if (ym.y !== currentYear) {
        currentYear = ym.y;
        yearAccDiv = 0;
        yearInterestAccrued = 0;
        pricePnL_YTD = 0;
      }

      const uecStart = uec;
      let priceRet = 0;
      if (i > 0) {
        const prev = base[i - 1].uec;
        const curr = base[i].uec;
        priceRet = prev > 0 ? curr / prev - 1 : 0;
        uec = uec * (1 + priceRet);
      } else {
        uec = base[0].uec;
      }
      const pricePnL = uecStart * priceRet;
      pricePnL_MTD += pricePnL;
      pricePnL_YTD += pricePnL;

      ppi = ppi * (1 + priceRet);
      const divToday = dividendMap.get(snap.date) ?? 0;
      const divYield = uecStart > 0 ? divToday / uecStart : 0;
      const triRet = priceRet + Math.max(0, divYield);
      ptri = ptri * (1 + triRet);

      const div = divToday;
      if (div > 0) {
        const pay = Math.min(div, loan);
        loan -= pay;
        const leftover = div - pay;
        if (leftover > 0) cash += leftover;
        monthAccDiv += div;
        yearAccDiv += div;
      }

      const flow = flowMap.get(snap.date) ?? 0;
      if (flow !== 0) {
        if (flow > 0) {
          cash += flow;
        } else {
          const w = -flow;
          if (cash >= w) {
            cash -= w;
          } else {
            const short = w - cash;
            cash = 0;
            loan += short;
          }
        }
      }

      let interestDaily = 0;
      if (loan > 0 && interestAPR > 0) {
        const dailyRate = interestAPR / (interestDayCount || 365);
        interestDaily = loan * dailyRate;
        monthInterestAccrued += interestDaily;
        yearInterestAccrued += interestDaily;
      }

      const mv = Math.max(uec + cash, 0);
      const equity = mv - loan;
      const mr = maintenanceRatio * mv;
      const buffer = equity - mr;
      const usagePct = mv > 0 ? loan / mv : 0;
      const equityRatio = mv > 0 ? equity / mv : 1;
      const hadCall = buffer < 0;
      const callCashNeeded = hadCall ? mr - equity : 0;
      const callSellNeeded = hadCall ? (mr - equity) / maintenanceRatio : 0;
      const lMax = Math.max(0, equity * (1 / maintenanceRatio - 1));
      const borrowCapacity = Math.max(0, lMax - loan);

      const navDeltaDaily = (pricePnL ?? 0) + (div ?? 0);
      const navDeltaMTD = (pricePnL_MTD ?? 0) + (monthAccDiv ?? 0);
      const navDeltaYTD = (pricePnL_YTD ?? 0) + (yearAccDiv ?? 0);
      const navDecayUserDaily = navDeltaDaily < 0;
      const navDecayUserMTD = navDeltaMTD < 0;
      const navDecayUserYTD = navDeltaYTD < 0;

      rows.push({
        stage: 'D',
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
        priceRet,
        pricePnL,
        priceMTD: pricePnL_MTD,
        priceYTD: pricePnL_YTD,
        ppiIndex: ppi,
        ptriIndex: ptri,
        triRet,
        navDeltaDaily,
        navDeltaMTD,
        navDeltaYTD,
        navDecayUserDaily,
        navDecayUserMTD,
        navDecayUserYTD,
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
        prices: priceMap.get(snap.date) || undefined,
      });

      if (isMonthEnd) {
        if (monthInterestAccrued > 0) {
          if (cash >= monthInterestAccrued) {
            cash -= monthInterestAccrued;
          } else {
            const short = monthInterestAccrued - cash;
            cash = 0;
            loan += short;
          }
        }

        const liquidationProceeds = uec;
        cash += liquidationProceeds;
        uec = 0;

        const loanPaydown = Math.min(loan, cash);
        loan -= loanPaydown;
        cash -= loanPaydown;
        const shortfall = loan > 0 ? loan : 0;

        const equityNow = Math.max(0, cash - loan);
        const targetLoan = Math.max(0, borrowTargetPct * equityNow);
        let borrowed = 0;
        if (targetLoan > loan) {
          borrowed = targetLoan - loan;
          loan += borrowed;
          uec += borrowed;
        } else if (targetLoan < loan) {
          const repay = Math.min(loan - targetLoan, cash);
          loan -= repay;
          cash -= repay;
        }

        const mvPost = Math.max(uec + cash, 0);
        const equityPost = mvPost - loan;
        const mrPost = maintenanceRatio * mvPost;
        const bufferPost = equityPost - mrPost;
        const usagePctPost = mvPost > 0 ? loan / mvPost : 0;
        const equityRatioPost = mvPost > 0 ? equityPost / mvPost : 1;

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
            mr: mrPost,
            buffer: bufferPost,
            usagePct: usagePctPost,
            equityRatio: equityRatioPost,
            monthEnd: true,
            priceRet: 0,
            pricePnL: 0,
            priceMTD: 0,
            priceYTD: pricePnL_YTD,
            ppiIndex: ppi,
            ptriIndex: ptri,
            triRet: 0,
            navDeltaDaily: 0,
            navDeltaMTD: 0,
            navDeltaYTD: pricePnL_YTD + yearAccDiv,
            navDecayUserDaily: false,
            navDecayUserMTD: false,
            navDecayUserYTD: (pricePnL_YTD + yearAccDiv) < 0,
            div: 0,
            divMTD: 0,
            divYTD: yearAccDiv,
            flow: 0,
            interestDaily: 0,
            interestMTD: 0,
            interestYTD: yearInterestAccrued,
            borrowCapacity: Math.max(0, Math.max(0, equityPost * (1 / maintenanceRatio - 1)) - loan),
            hadCall: bufferPost < 0,
            callCashNeeded: undefined,
            callSellNeeded: undefined,
            eomLiquidationProceeds: liquidationProceeds,
            eomLoanPaydown: loanPaydown,
            eomShortfall: shortfall || undefined,
            eomBorrowToTarget: borrowed || undefined,
            eomTargetLoan: targetLoan,
            romMonthly: rom,
            rom30d: null,
            prices: priceMap.get(snap.date) || undefined,
          });
        } else {
          rows[rows.length - 1].romMonthly = rom;
        }

        monthAccDiv = 0;
        monthInterestAccrued = 0;
        monthStartEquity = monthEndEquity;
        monthLoanSum = 0;
        monthLoanDays = 0;
        pricePnL_MTD = 0;
      }

      monthLoanSum += loan;
      monthLoanDays += 1;
    }

    const dIdx: number[] = [];
    for (let i = 0; i < rows.length; i++) if (rows[i].stage === 'D') dIdx.push(i);

    for (let i = 0; i < dIdx.length; i++) {
      const idx = dIdx[i];
      if (i >= 30) {
        const i0 = dIdx[i - 30];
        const eq0 = rows[i0].equity;
        const eq1 = rows[idx].equity;
        const pnl30 = eq1 - eq0;
        const avgLoan = rows.slice(i0, idx + 1).reduce((s, r) => s + (r.loan || 0), 0) / 31;
        rows[idx].rom30d = avgLoan !== 0 ? pnl30 / Math.abs(avgLoan) : 0;
      }
    }

    for (let k = 1; k < dIdx.length; k++) {
      const i1 = dIdx[k], i0 = dIdx[k - 1];
      const r = rows[i1];
      const prev = rows[i0];
      const mvRet = prev.mv > 0 ? r.mv / prev.mv - 1 : 0;
      r._mvRet = mvRet;
    }
    const m = maintenanceRatio;
    for (let k = 0; k < dIdx.length; k++) {
      const i1 = dIdx[k];
      const start = Math.max(0, k - 19);
      const slice = dIdx.slice(start, k + 1).map(i => rows[i]._mvRet ?? 0);
      const mean = slice.reduce((s, x) => s + x, 0) / (slice.length || 1);
      const var_ = slice.reduce((s, x) => s + (x - mean) ** 2, 0) / (slice.length > 1 ? (slice.length - 1) : 1);
      const rv20d = Math.sqrt(Math.max(0, var_));
      const r = rows[i1];
      r.rv20d = rv20d;
      r.sigmaDollar = (r.mv || 0) * (rv20d || 0);
      const buffer = r.buffer || 0;
      const lossToCallDollar = buffer > 0 ? buffer / (1 - m) : 0;
      r.lossToCallDollar = lossToCallDollar;
      r.lossToCallPctMV = r.mv > 0 ? lossToCallDollar / r.mv : undefined;
      r.daysToCallAt1Sigma = (r.sigmaDollar || 0) > 0 ? lossToCallDollar / (r.sigmaDollar || 1) : undefined;
    }

    const annFactor = (n: number) => (n > 1 ? 252 / n : 0);
    const dRows = dIdx.map(i => rows[i]);
    for (let k = 0; k < dRows.length; k++) {
      const end = dRows[k];
      const startK = Math.max(0, k - 89);
      const startRow = dRows[startK];
      const n = k - startK;
      if (n > 0 && startRow.ppiIndex && end.ppiIndex && startRow.ptriIndex && end.ptriIndex) {
        const ppiCAGR = Math.pow(end.ppiIndex! / startRow.ppiIndex!, annFactor(n)) - 1;
        const triCAGR = Math.pow(end.ptriIndex! / startRow.ptriIndex!, annFactor(n)) - 1;
        end.priceCAGR90 = ppiCAGR;
        end.triCAGR90 = triCAGR;
        end.navDecayFlag = ppiCAGR < 0 && triCAGR >= 0;
      }
    }

    const dailyByDate = new Map<string, SimRow>();
    for (const r of rows) if (r.stage === 'D') dailyByDate.set(r.date, r);
    for (const r of rows) {
      if (r.stage === 'EOM') {
        const d = dailyByDate.get(r.date);
        if (d) {
          r.rv20d = d.rv20d;
          r.sigmaDollar = d.sigmaDollar;
          r.lossToCallDollar = d.lossToCallDollar;
          r.lossToCallPctMV = d.lossToCallPctMV;
          r.daysToCallAt1Sigma = d.daysToCallAt1Sigma;
          r.rom30d = d.rom30d;
          r.priceCAGR90 = d.priceCAGR90;
          r.triCAGR90 = d.triCAGR90;
          r.navDecayFlag = d.navDecayFlag;
          r.ppiIndex = d.ppiIndex;
          r.ptriIndex = d.ptriIndex;
          r.navDeltaDaily = d.navDeltaDaily;
          r.navDeltaMTD = d.navDeltaMTD;
          r.navDeltaYTD = d.navDeltaYTD;
          r.navDecayUserDaily = d.navDecayUserDaily;
          r.navDecayUserMTD = d.navDecayUserMTD;
          r.navDecayUserYTD = d.navDecayUserYTD;
        }
      }
    }

    return rows;
  }, [
    margin,
    maintenanceRatio, interestAPR, interestDayCount, borrowTargetPct, showDualMonthEndRows,
    dividendMap, flowMap, priceMap
  ]);

  const simForCharts = React.useMemo(() => sim.filter(r => !(r.monthEnd && r.stage === 'D')), [sim]);
  const marginCalls = React.useMemo(
    () => sim.filter(r => r.hadCall).map(r => ({
      date: r.date + (r.stage === 'EOM' ? ' (EOM)' : ''),
      callCashNeeded: r.callCashNeeded ?? 0,
      callSellNeeded: r.callSellNeeded ?? 0,
      buffer: r.buffer,
    })), [sim]
  );
  const latest = simForCharts.at(-1);

  const handleExportCSV = React.useCallback(() => {
    if (!sim.length) return;
    const baseCols = [
      'date','stage','cash','uec','mv','loan','equity','mr','buffer','usagePct','equityRatio',
      'div','divMTD','divYTD','flow','interestDaily','interestMTD','interestYTD',
      'priceRet','pricePnL','priceMTD','priceYTD','ppiIndex','ptriIndex','triRet',
      'navDeltaDaily','navDeltaMTD','navDeltaYTD','navDecayUserDaily','navDecayUserMTD','navDecayUserYTD',
      'rv20d','sigmaDollar','lossToCallDollar','lossToCallPctMV','daysToCallAt1Sigma',
      'rom30d','romMonthly','eomLiquidationProceeds','eomLoanPaydown','eomShortfall','eomBorrowToTarget','eomTargetLoan',
      'priceCAGR90','triCAGR90','navDecayFlag'
    ];
    const priceTickers = sim.reduce<string[]>((acc, r) => {
      const ks = r.prices ? Object.keys(r.prices) : [];
      for (const k of ks) if (!acc.includes(k)) acc.push(k);
      return acc;
    }, []);
      const cols = [...baseCols, ...priceTickers.map(t => `price:${t}`)];
      const rows = sim.map(r => {
        const rec: Record<string, string | number | boolean> = {};
        for (const k of baseCols) {
          const v = (r as Record<string, unknown>)[k];
          rec[k] = (v as string | number | boolean) ?? '';
        }
        for (const t of priceTickers) rec[`price:${t}`] = r.prices?.[t] ?? '';
        return rec;
      });
      const csv = [
        cols.join(','),
        ...rows.map(row =>
          cols.map(k => {
            const v = row[k];
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
  }, [sim]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        <SummaryCard label="Equity" value={fmt(latest?.equity)} />
        <SummaryCard label="Loan" value={fmt(latest?.loan)} />
        <SummaryCard label="Cash" value={fmt(latest?.cash)} />
        <SummaryCard label="MV" value={fmt(latest?.mv)} />
        <SummaryCard label="Margin Usage" value={pct(latest?.usagePct)} />
        <SummaryCard label="Maint. Buffer" value={fmt(latest?.buffer)} danger={!!latest && latest.buffer < 0} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <SummaryCard label="Price CAGR (90d ann.)" value={pct(latest?.priceCAGR90)} danger={(latest?.priceCAGR90 ?? 0) < 0} />
        <SummaryCard label="TRI CAGR (90d ann.)" value={pct(latest?.triCAGR90)} danger={(latest?.triCAGR90 ?? 0) < 0} />
        <SummaryCard label="PPI Index" value={num(latest?.ppiIndex, 2)} />
        <SummaryCard label="TRI Index" value={num(latest?.ptriIndex, 2)} />
      </div>

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

      <div className="flex items-center gap-3">
        <button
          onClick={handleExportCSV}
          className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs hover:bg-slate-700"
        >
          Export CSV
        </button>
        <span className="text-xs text-slate-500">
          EOM rule: sell all → pay loan → borrow {Math.round(borrowTargetPct * 100)}% of equity → buy with borrowed only.
        </span>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Daily Ledger (pre and post month-end)</h3>
        <div className="overflow-x-auto overflow-y-auto max-h-[28rem] rounded border border-slate-200">
          <table className="min-w-[2200px] w-full text-xs">
            <thead className="bg-slate-50 sticky top-0">
              <tr className="text-left">
                <th className="p-2">Date</th>
                <th className="p-2">Stage</th>
                <th className="p-2 text-right">Cash</th>
                <th className="p-2 text-right">UEC</th>
                <th className="p-2 text-right">MV</th>
                <th className="p-2 text-right">Loan</th>
                <th className="p-2 text-right">Equity</th>
                <th className="p-2 text-right">Maint ($)</th>
                <th className="p-2 text-right">Buffer</th>
                <th className="p-2 text-right">Eq. Ratio</th>
                <th className="p-2 text-right">Usage %</th>

                <th className="p-2 text-right">Div</th>
                <th className="p-2 text-right">Div MTD</th>
                <th className="p-2 text-right">Div YTD</th>
                <th className="p-2 text-right">Flow</th>
                <th className="p-2 text-right">Int (day)</th>
                <th className="p-2 text-right">Int MTD</th>

                <th className="p-2 text-right">Price Ret</th>
                <th className="p-2 text-right">Price P&amp;L</th>
                <th className="p-2 text-right">Price MTD</th>
                <th className="p-2 text-right">Price YTD</th>

                <th className="p-2 text-right">PPI</th>
                <th className="p-2 text-right">TRI</th>
                <th className="p-2 text-right">Price CAGR 90d</th>
                <th className="p-2 text-right">TRI CAGR 90d</th>
                <th className="p-2 text-right">NAV Decay? (CAGR)</th>

                <th className="p-2 text-right">NAV Δ (Daily)</th>
                <th className="p-2 text-right">NAV Δ (MTD)</th>
                <th className="p-2 text-right">NAV Δ (YTD)</th>
                <th className="p-2 text-right">NAV Decay? (Daily)</th>
                <th className="p-2 text-right">NAV Decay? (MTD)</th>
                <th className="p-2 text-right">NAV Decay? (YTD)</th>

                <th className="p-2 text-right">Borrow Cap</th>
                <th className="p-2 text-right">ROM 30d</th>

                <th className="p-2 text-right">RV 20d</th>
                <th className="p-2 text-right">σ$</th>
                <th className="p-2 text-right">Loss→Call $</th>
                <th className="p-2 text-right">Loss→Call %MV</th>
                <th className="p-2 text-right">Days→Call @1σ</th>

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

                  <td className="p-2 text-right">{r.priceRet !== undefined ? pct(r.priceRet) : '-'}</td>
                  <td className="p-2 text-right">{r.pricePnL !== undefined ? fmt(r.pricePnL) : '-'}</td>
                  <td className="p-2 text-right">{r.priceMTD !== undefined ? fmt(r.priceMTD) : '-'}</td>
                  <td className="p-2 text-right">{r.priceYTD !== undefined ? fmt(r.priceYTD) : '-'}</td>

                  <td className="p-2 text-right">{r.ppiIndex !== undefined ? num(r.ppiIndex, 2) : '-'}</td>
                  <td className="p-2 text-right">{r.ptriIndex !== undefined ? num(r.ptriIndex, 2) : '-'}</td>
                  <td className={`p-2 text-right ${((r.priceCAGR90 ?? 0) < 0) ? 'text-red-600' : ''}`}>{r.priceCAGR90 !== undefined ? pct(r.priceCAGR90) : '-'}</td>
                  <td className={`p-2 text-right ${((r.triCAGR90 ?? 0) < 0) ? 'text-red-600' : ''}`}>{r.triCAGR90 !== undefined ? pct(r.triCAGR90) : '-'}</td>
                  <td className={`p-2 text-right ${r.navDecayFlag ? 'text-amber-700 font-semibold' : ''}`}>{r.navDecayFlag ? 'Yes' : 'No'}</td>

                  <td className={`p-2 text-right ${((r.navDeltaDaily ?? 0) < 0) ? 'text-amber-700 font-semibold' : ''}`}>{r.navDeltaDaily !== undefined ? fmt(r.navDeltaDaily) : '-'}</td>
                  <td className={`p-2 text-right ${((r.navDeltaMTD ?? 0) < 0) ? 'text-amber-700 font-semibold' : ''}`}>{r.navDeltaMTD !== undefined ? fmt(r.navDeltaMTD) : '-'}</td>
                  <td className={`p-2 text-right ${((r.navDeltaYTD ?? 0) < 0) ? 'text-amber-700 font-semibold' : ''}`}>{r.navDeltaYTD !== undefined ? fmt(r.navDeltaYTD) : '-'}</td>
                  <td className={`p-2 text-right ${r.navDecayUserDaily ? 'text-amber-700 font-semibold' : ''}`}>{r.navDecayUserDaily ? 'Yes' : 'No'}</td>
                  <td className={`p-2 text-right ${r.navDecayUserMTD ? 'text-amber-700 font-semibold' : ''}`}>{r.navDecayUserMTD ? 'Yes' : 'No'}</td>
                  <td className={`p-2 text-right ${r.navDecayUserYTD ? 'text-amber-700 font-semibold' : ''}`}>{r.navDecayUserYTD ? 'Yes' : 'No'}</td>

                  <td className="p-2 text-right">{r.borrowCapacity ? fmt(r.borrowCapacity) : '-'}</td>
                  <td className="p-2 text-right">{r.rom30d !== null && r.rom30d !== undefined ? pct(r.rom30d) : '-'}</td>

                  <td className="p-2 text-right">{r.rv20d !== undefined ? pct(r.rv20d) : '-'}</td>
                  <td className="p-2 text-right">{r.sigmaDollar !== undefined ? fmt(r.sigmaDollar) : '-'}</td>
                  <td className="p-2 text-right">{r.lossToCallDollar !== undefined ? fmt(r.lossToCallDollar) : '-'}</td>
                  <td className="p-2 text-right">{r.lossToCallPctMV !== undefined ? pct(r.lossToCallPctMV) : '-'}</td>
                  <td className="p-2 text-right">{r.daysToCallAt1Sigma !== undefined ? num(r.daysToCallAt1Sigma, 2) : '-'}</td>

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
          Loss→Call $ = Buffer / (1 − {Math.round(maintenanceRatio * 100)}%). Days→Call @1σ ≈ Loss→Call $ / (MV × RV20d). Your NAV-decay rule flags when price loss exceeds dividends over Daily/MTD/YTD.
        </p>
      </div>
    </div>
  );
}

