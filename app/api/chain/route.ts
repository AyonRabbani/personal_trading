import { NextRequest, NextResponse } from 'next/server';
import { polygonFetch } from '@/lib/polygon';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get('symbol');
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }
  try {
    const data = await polygonFetch('/v3/reference/options/contracts', {
      underlying_ticker: symbol,
    });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
