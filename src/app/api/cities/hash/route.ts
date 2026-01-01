import { citiesCache } from '@/lib/citiesCache';
import { type NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ hash: await citiesCache.getHash() });
}
