import { NextRequest, NextResponse } from 'next/server';
import { polygonFetch } from '@/lib/polygon';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  const lookback = searchParams.get('lookback') ?? '252';
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }
  try {
    const data = await polygonFetch('/v1/indicators/iv', {
      symbol,
      timespan: 'day',
      window: lookback,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
