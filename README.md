This project previously contained a full trading dashboard but all of that UI has
been deprecated. The application now consists of a single page to build a simple
portfolio by entering ticker symbols. As each symbol is added, the server fetches
ten years of daily price history from the Polygon.io API.

## Getting Started

Run the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Data Providers

By default the application fetches market data from [Polygon.io](https://polygon.io). If the `POLYGON_API_KEY` environment variable is not defined, a set of random prices will be generated instead. This allows the dashboard to run with dummy data when real data sources are not available.

Macroeconomic data is retrieved from [FRED](https://fred.stlouisfed.org). Set `FRED_API_KEY` to enable live queries. Without it, synthetic series are generated so the macro dashboard still functions offline.

## Macro Metrics

The dashboard computes a small set of macro indicators from FRED data:

- **Yield Curve (10y-2y)** – difference between 10 and 2 year Treasury yields.
- **Real Rate (10y-CPI)** – 10 year yield adjusted for inflation.
- **Unemployment** – latest U.S. unemployment rate.
- **GDP QoQ** – quarterly growth rate of real GDP.
- **VIX Level** – current market volatility index.
- **USD 30d Momentum** – 30 day percentage change in the trade weighted dollar index.

These metrics are exposed via `/api/macro-metrics` and shown on the main dashboard.
