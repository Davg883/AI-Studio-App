import { NextResponse } from 'next/server';
import { CAPABILITY_CATALOG } from '@/lib/models/capability-catalog';

export async function GET() {
  return NextResponse.json({
    success: true,
    catalog: CAPABILITY_CATALOG,
    roles: ['SEARCH', 'CONTROL', 'SHIP', 'FINISH'],
  });
}
