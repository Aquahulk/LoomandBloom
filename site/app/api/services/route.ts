import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET(_req: NextRequest) {
  try {
    const services = await prisma.service.findMany({
      orderBy: { createdAt: 'asc' }
    });
    return NextResponse.json({ success: true, services });
  } catch (error: any) {
    console.error('Error listing services:', error);
    return NextResponse.json({ error: 'Failed to list services' }, { status: 500 });
  }
}