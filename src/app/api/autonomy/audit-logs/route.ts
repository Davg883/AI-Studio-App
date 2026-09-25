import { NextRequest, NextResponse } from 'next/server';
import { AuditLogger } from '@/lib/services/audit-logger';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const eventType = searchParams.get('eventType');

    let logs = await AuditLogger.getAllLogs();

    if (jobId) {
      logs = logs.filter(l => l.jobId === jobId);
    }
    if (eventType) {
      logs = logs.filter(l => l.eventType === eventType);
    }

    return NextResponse.json({ success: true, logs });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
}
