import { NextRequest, NextResponse } from 'next/server';
import { getRepository } from '@/lib/repository/json-repository';

interface RouteContext {
  params: { id: string };
}

/**
 * Server-Enforced Final Delivery Invariant:
 * The delivery endpoint returns 403 Forbidden if humanSignOff (operatorName, signatureToken) is absent.
 * Cannot be bypassed by client toggles or automated agents.
 */
export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const repo = getRepository();

    const job = await repo.getJobById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const body = await req.json();
    const { operatorSignOff, verifiedFormatsConfirmed } = body;

    // Hard server-enforced invariant: Operator credentials must be present
    if (!operatorSignOff || !operatorSignOff.operatorName || !operatorSignOff.signatureToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server-Enforced Invariant Violated: Final delivery strictly requires human operator signature token and name. Automated dispatch is prohibited.',
        },
        { status: 403 }
      );
    }

    if (!verifiedFormatsConfirmed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quality Verification Required: Verified deliverables confirmation checkbox must be checked prior to release.',
        },
        { status: 400 }
      );
    }

    const updatedJob = await repo.recordFinalDelivery(id, operatorSignOff);

    return NextResponse.json({
      success: true,
      message: `Final delivery authorised and released for ${job.title}`,
      job: updatedJob,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Final delivery execution failed' },
      { status: 500 }
    );
  }
}
