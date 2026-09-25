import { NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';

export async function POST() {
  try {
    const repo = getRepository();
    await repo.resetToSeeds();
    return NextResponse.json({ success: true, message: 'Studio data reset to default seed state' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reset data' },
      { status: 500 }
    );
  }
}
