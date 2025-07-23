export interface Asset {
  symbol: string;
  name: string;
  type: 'equity' | 'crypto' | 'derivative';
  /** Optional industry classification used for equity screening */
  industry?: string;
}

export const assets: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'equity', industry: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'equity', industry: 'Technology' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'equity', industry: 'Consumer' },
  { symbol: 'GOOG', name: 'Alphabet Inc.', type: 'equity', industry: 'Technology' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'equity', industry: 'Consumer' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'equity', industry: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'equity', industry: 'Technology' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'equity', industry: 'Finance' },
  { symbol: 'V', name: 'Visa Inc.', type: 'equity', industry: 'Finance' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'equity', industry: 'Healthcare' },

  { symbol: 'BTCUSD', name: 'Bitcoin', type: 'crypto' },
  { symbol: 'ETHUSD', name: 'Ethereum', type: 'crypto' },
  { symbol: 'SOLUSD', name: 'Solana', type: 'crypto' },
  { symbol: 'DOGEUSD', name: 'Dogecoin', type: 'crypto' },
  { symbol: 'XRPUSD', name: 'Ripple', type: 'crypto' },
  { symbol: 'LTCUSD', name: 'Litecoin', type: 'crypto' },

  { symbol: 'ES_F', name: 'S&P 500 Futures', type: 'derivative' },
  { symbol: 'NQ_F', name: 'Nasdaq 100 Futures', type: 'derivative' },
  { symbol: 'CL_F', name: 'Crude Oil Futures', type: 'derivative' },
  { symbol: 'GC_F', name: 'Gold Futures', type: 'derivative' }
];

export const assetSymbols = assets.map((a) => a.symbol);
export const equitySymbols = assets
  .filter((a) => a.type === 'equity')
  .map((a) => a.symbol);

export interface Sp500Entry {
  symbol: string;
  name: string;
  industry: string;
}

import sp500Data from './sp500.json';
export const sp500: Sp500Entry[] = sp500Data as Sp500Entry[];
export const sp500Symbols = sp500.map((s) => s.symbol);
