export interface Asset {
  symbol: string;
  name: string;
  type: 'equity' | 'crypto' | 'derivative';
}

export const assets: Asset[] = [
  { symbol: 'AAPL', name: 'Apple Inc.', type: 'equity' },
  { symbol: 'MSFT', name: 'Microsoft Corp.', type: 'equity' },
  { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'equity' },
  { symbol: 'GOOG', name: 'Alphabet Inc.', type: 'equity' },
  { symbol: 'TSLA', name: 'Tesla Inc.', type: 'equity' },
  { symbol: 'META', name: 'Meta Platforms Inc.', type: 'equity' },
  { symbol: 'NVDA', name: 'NVIDIA Corp.', type: 'equity' },
  { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'equity' },
  { symbol: 'V', name: 'Visa Inc.', type: 'equity' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'equity' },

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
