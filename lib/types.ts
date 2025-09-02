export type Ticker = string;

export interface PriceBar {
  date: string;          // ISO (UTC midnight)
  close: number;
}

export interface DividendEvent {
  date: string;          // ex-date
  amount: number;        // per share
}

export interface SeriesMap {
  [ticker: Ticker]: PriceBar[];
}

export interface DividendMap {
  [ticker: Ticker]: DividendEvent[];
}

export interface ChartRequest {
  tickers: Ticker[];
  period: "6mo"|"1y"|"2y"|"5y";
  interval: "1d"|"1wk";
}

export interface ChartResponse {
  prices: SeriesMap;          // daily/weekly closes
  dividends: DividendMap;     // raw ex-div events
}

export interface StrategyParams {
  initialCapital: number;     // e.g., 6000
  monthlyDeposit: number;     // e.g., 2000
  lookbackDays: number;       // e.g., 30
  coreFrac: number;           // e.g., 0.40
  maintReq: number;           // e.g., 0.25
  bufferPts: number;          // e.g., 0.05 → target Eq/NMV=0.30
  donorRotation: boolean;     // enable donor reallocation (25% cap / 5% floor)
}

export interface RunRequest extends ChartRequest, StrategyParams {}

export interface TimePoint {
  date: string;
  value: number;
}

export interface PicksPoint {
  date: string;
  selected: Ticker;
}

export interface BacktestResponse {
  unlevered: {
    equity: TimePoint[];      // equity path (no loan)
    bucketA: TimePoint[];
    bucketB: TimePoint[];
    metrics: Metrics;
  };
  levered: {
    equity: TimePoint[];      // equity path with margin target model
    nmv: TimePoint[];
    loan: TimePoint[];
    marginRatio: TimePoint[]; // equity / nmv
    weeklyDiv: TimePoint[];   // resampled Fri
    metrics: Metrics;
    marginEvents: MarginEvent[];    // breaches & recoveries
    marginDrivers?: MarginDriver[]; // contribution rows on breach days
  };
  picks: PicksPoint[];
  auditCsv: string;           // complete daily audit as CSV
}

export interface Metrics {
  totalReturn: number;
  cagr: number;
  volAnn: number;
  sharpe: number;
  sortino: number;
  maxDD: number;
  hitRate: number;
}

export interface MarginEvent {
  date: string;
  ratio: number;
  type: "buffer_breach" | "maintenance_breach" | "restore";
}

export interface MarginDriver {
  date: string;
  ticker: Ticker;
  pnl: number;                // contribution that day (shares_prev * Δprice)
  weightInBreach: number;     // its share of total day P&L
}

export interface ScreenerRequest {
  tickers: Ticker[];
  period: "6mo"|"1y"|"2y"|"5y";
  interval: "1d"|"1wk";
  lookbackDays: number;       // for 30D windows
}

export interface ScreenerRow {
  ticker: Ticker;
  priceRet30d: number;
  totalRet30d: number;
  rankSum: number;
  trailingDivYield: number;   // 12m sum / last close
  volAnn: number;
  sharpe: number;             // daily mean / std * √252
}

export interface ScreenerResponse {
  rows: ScreenerRow[];
}
