import { NextResponse } from 'next/server';
import { HiggsfieldAdapter } from '@/lib/providers/higgsfield/higgsfield-adapter';

/** Non-secret runtime flags the UI needs (e.g. whether generation spends real money). */
export async function GET() {
  return NextResponse.json({
    success: true,
    // Same rules the providers use: explicit MOCK_MODE, or missing credentials, means simulated
    mockMode: HiggsfieldAdapter.isMockMode(),
    analyzerMock: process.env.MOCK_MODE === 'true' || !process.env.OPENAI_API_KEY,
  });
}
