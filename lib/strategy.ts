import { SeriesMap, TimePoint, Metrics, DividendMap } from "./types";
import { computeMetrics } from "./math";

interface RunResult {
  equity: TimePoint[];
  metrics: Metrics;
}

interface LeveredResult extends RunResult {
  nmv: TimePoint[];
  loan: TimePoint[];
  marginRatio: TimePoint[];
  marginCalls: TimePoint[];
  dividends: TimePoint[];
  dividendTax: { date: string; dividends: number; taxes: number }[];
  divTotal: number;
  taxTotal: number;
}

interface PortfolioSeries {
  dates: string[];
  priceReturns: number[];
  divYields: number[];
}

function calcPortfolioSeries(
  prices: SeriesMap,
  dividends: DividendMap
): PortfolioSeries {
  const tickers = Object.keys(prices);
  if (tickers.length === 0)
    return { dates: [], priceReturns: [], divYields: [] };

  const length = prices[tickers[0]].length;
  const priceReturns: number[] = [];
  const divYields: number[] = [];
  const dates: string[] = [];

  // Precompute dividend lookup by ticker/date for efficiency
  const divLookup: Record<string, Record<string, number>> = {};
  for (const t of tickers) {
    divLookup[t] = {};
    for (const d of dividends[t] || []) {
      divLookup[t][d.date] = d.amount;
    }
  }

  for (let i = 1; i < length; i++) {
    let prSum = 0;
    let dySum = 0;
    for (const t of tickers) {
      const series = prices[t];
      const today = series[i];
      const yesterday = series[i - 1];
      const r = today.close / yesterday.close - 1;
      prSum += r;

      const divAmt = divLookup[t][today.date];
      if (divAmt) {
        dySum += divAmt / today.close;
      }
    }
    priceReturns.push(prSum / tickers.length);
    divYields.push(dySum / tickers.length);
    dates.push(prices[tickers[0]][i].date);
  }

  return { dates, priceReturns, divYields };
}

// core engine (levered and unlevered runs)
export function runUnlevered(
  prices: SeriesMap,
  dividends: DividendMap,
  initialCapital = 6000,
  monthlyDeposit = 0,
  taxRate = 0.15
): RunResult {
  const { dates, priceReturns, divYields } = calcPortfolioSeries(
    prices,
    dividends
  );
  let equity = initialCapital;
  const equityCurve: TimePoint[] = [];
  let lastMonth = dates[0] ? new Date(dates[0]).getMonth() : -1;
  const returns: number[] = [];
  for (let i = 0; i < priceReturns.length; i++) {
    const date = dates[i];
    const month = new Date(date).getMonth();
    if (month !== lastMonth) {
      equity += monthlyDeposit;
      lastMonth = month;
    }
    // apply price return first
    equity *= 1 + priceReturns[i];
    // dividend cashflow on unlevered equity
    const divCash = equity * divYields[i];
    const tax = divCash * taxRate;
    equity += divCash - tax;
    equityCurve.push({ date, value: equity });
    returns.push(priceReturns[i] + divYields[i]);
  }
  return { equity: equityCurve, metrics: computeMetrics(returns) };
}

export function runLevered(
  prices: SeriesMap,
  dividends: DividendMap,
  initialCapital = 6000,
  monthlyDeposit = 0,
  bufferPts = 0.05,
  taxRate = 0.15
): LeveredResult {
  const { dates, priceReturns, divYields } = calcPortfolioSeries(
    prices,
    dividends
  );
  const maintReq = 0.25;
  const target = maintReq + bufferPts; // desired equity / nmv target
  const leverage = 1 / target;
  let equity = initialCapital;
  let loan = equity * (leverage - 1);
  let nmv = equity + loan;
  let lastMonth = dates[0] ? new Date(dates[0]).getMonth() : -1;

  const equityCurve: TimePoint[] = [];
  const nmvCurve: TimePoint[] = [];
  const loanCurve: TimePoint[] = [];
  const marginCurve: TimePoint[] = [];
  const marginCalls: TimePoint[] = [];
  const dividendsCurve: TimePoint[] = [];
  const dividendTaxCurve: { date: string; dividends: number; taxes: number }[] = [];
  let cumDiv = 0;
  let cumTax = 0;
  const returns: number[] = [];

  for (let i = 0; i < priceReturns.length; i++) {
    const date = dates[i];
    const month = new Date(date).getMonth();
    if (month !== lastMonth) {
      equity += monthlyDeposit;
      loan = equity * (leverage - 1); // scale loan with portfolio
      nmv = equity + loan;
      lastMonth = month;
    }

    // apply price return on assets
    equity += priceReturns[i] * nmv;

    // dividends from assets
    const divCash = nmv * divYields[i];
    const tax = divCash * taxRate;
    equity += divCash - tax;
    cumDiv += divCash;
    cumTax += tax;
    if (divCash !== 0) {
      dividendsCurve.push({ date, value: divCash });
      dividendTaxCurve.push({ date, dividends: cumDiv, taxes: cumTax });
    }

    nmv = equity + loan;
    const ratio = equity / nmv;

    equityCurve.push({ date, value: equity });
    nmvCurve.push({ date, value: nmv });
    loanCurve.push({ date, value: loan });
    marginCurve.push({ date, value: ratio });

    returns.push((priceReturns[i] + divYields[i]) * leverage);

    if (ratio <= maintReq) {
      marginCalls.push({ date, value: ratio });
    } else {
      // rebalance to target leverage after market move
      loan = equity * (leverage - 1);
      nmv = equity + loan;
    }
  }

  return {
    equity: equityCurve,
    nmv: nmvCurve,
    loan: loanCurve,
    marginRatio: marginCurve,
    marginCalls,
    dividends: dividendsCurve,
    dividendTax: dividendTaxCurve,
    divTotal: cumDiv,
    taxTotal: cumTax,
    metrics: computeMetrics(returns),
  };
}
