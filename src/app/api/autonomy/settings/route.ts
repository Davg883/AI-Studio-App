import { NextRequest, NextResponse } from 'next/server';
import { AutonomyManager } from '@/lib/services/autonomy-manager';
import { DEFAULT_OPERATOR_NAME } from '@/lib/operator-config';

export async function GET() {
  try {
    const settings = await AutonomyManager.getSettings();
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch autonomy settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { updates, updatedBy = DEFAULT_OPERATOR_NAME } = body;
    const settings = await AutonomyManager.updateSettings(updates, updatedBy);
    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update autonomy settings' },
      { status: 500 }
    );
  }
}
