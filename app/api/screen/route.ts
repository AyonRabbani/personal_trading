import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  const body = await req.json();
  // Placeholder: actual screening logic should generate strategies based on Polygon data
  return NextResponse.json({ results: [], received: body });
}
