import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();
    const reservations = await repo.getActiveReservations(id);
    return NextResponse.json({ success: true, reservations });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch reservations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();
    const body = await req.json();
    const { action = 'reserve', amountUSD, purpose = 'Production Generation', stepId, reservationId } = body;

    if (action === 'reserve') {
      if (!amountUSD || amountUSD <= 0) {
        return NextResponse.json({ success: false, error: 'Valid amountUSD is required' }, { status: 400 });
      }
      const result = await repo.reserveSpend(id, amountUSD, purpose, stepId);
      return NextResponse.json(result, { status: result.success ? 200 : 409 });
    }

    if (action === 'commit') {
      if (!reservationId) {
        return NextResponse.json({ success: false, error: 'reservationId is required' }, { status: 400 });
      }
      const success = await repo.commitSpend(reservationId, amountUSD || 0);
      return NextResponse.json({ success });
    }

    if (action === 'release') {
      if (!reservationId) {
        return NextResponse.json({ success: false, error: 'reservationId is required' }, { status: 400 });
      }
      const success = await repo.releaseSpend(reservationId);
      return NextResponse.json({ success });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Spend reservation operation failed' },
      { status: 500 }
    );
  }
}
