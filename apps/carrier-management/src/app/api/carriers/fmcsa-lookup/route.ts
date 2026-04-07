import { NextRequest, NextResponse } from 'next/server';
import { lookupByMC } from '@/lib/fmcsa-lookup';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mc = searchParams.get('mc');

  if (!mc) {
    return NextResponse.json({ error: 'mc parameter is required' }, { status: 400 });
  }

  const result = lookupByMC(mc);
  return NextResponse.json(result);
}
