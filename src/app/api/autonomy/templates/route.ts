import { NextResponse } from 'next/server';
import { PRODUCTIZED_SERVICE_TEMPLATES } from '@/lib/constants/templates';

export async function GET() {
  return NextResponse.json({
    success: true,
    templates: PRODUCTIZED_SERVICE_TEMPLATES,
  });
}
