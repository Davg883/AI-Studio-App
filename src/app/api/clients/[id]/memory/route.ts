import { NextRequest, NextResponse } from 'next/server';
import { ClientMemoryService } from '@/lib/services/client-memory-service';

interface RouteContext {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const memory = await ClientMemoryService.getClientMemory(id);
    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch client memory' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const { id } = params;
    const body = await req.json();
    const { memory } = body;

    memory.clientId = id;
    memory.updatedAt = new Date().toISOString();
    await ClientMemoryService.saveClientMemory(memory);

    return NextResponse.json({ success: true, memory });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to save client memory' },
      { status: 500 }
    );
  }
}
