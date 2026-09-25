import { NextRequest, NextResponse } from 'next/server';
import { HiggsfieldAdapter } from '@/lib/providers/higgsfield';

/**
 * GET /api/higgsfield/test-connection
 * Returns current configuration status and masked Key ID without leaking secrets.
 */
export async function GET() {
  const masked = HiggsfieldAdapter.getMaskedCredentials();
  return NextResponse.json({
    success: true,
    ...masked,
  });
}

/**
 * POST /api/higgsfield/test-connection
 * Executes the smallest inexpensive documented probe to verify Higgsfield API connectivity,
 * credential validity, and pricing endpoint response after explicit human confirmation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { confirmed = false } = body;

    if (!confirmed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Explicit operator confirmation is required before probing live API endpoints.',
        },
        { status: 400 }
      );
    }

    const result = await HiggsfieldAdapter.testConnection();

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    // Never expose credentials in error responses
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: err?.message || 'Connection test failed',
      },
      { status: 500 }
    );
  }
}
