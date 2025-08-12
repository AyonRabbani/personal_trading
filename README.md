# Defined-Risk Options Premium Screener

A Next.js 14 app that ranks bull put spreads, bear call spreads, and iron condors using Polygon.io data. The home screen lets you enter a ticker and view ranked defined-risk trades with payoff details.

## Setup

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Create `.env.local` from the provided example and add your Polygon API key:
   ```bash
   cp env.example .env.local
   # edit .env.local and set POLYGON_API_KEY
   ```

## Development

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm start
```

## Testing

```bash
pnpm test
```

## Limitations

- Probability of profit is approximated from option delta.
- IV Rank falls back to available history if a full year is unavailable.
