import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Auto-cancel stale pending Orders and ServiceBookings older than the threshold (default 10 minutes)
export async function POST(req: NextRequest) {
  try {
    const { minutes } = await req.json().catch(() => ({ minutes: 10 }));
    const thresholdMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 10;
    const cutoff = new Date(Date.now() - thresholdMinutes * 60_000);

    const [ordersResult, bookingsResult] = await Promise.all([
      prisma.order.updateMany({
        where: { status: 'PENDING' as any, createdAt: { lt: cutoff } },
        data: { status: 'CANCELLED' as any, updatedAt: new Date() },
      }),
      prisma.serviceBooking.updateMany({
        where: { status: 'PENDING' as any, createdAt: { lt: cutoff } },
        data: { status: 'CANCELLED' as any },
      }),
    ]);

    return NextResponse.json({
      success: true,
      cancelled: {
        orders: ordersResult.count,
        serviceBookings: bookingsResult.count,
      },
      cutoff,
    });
  } catch (error) {
    console.error('Auto-cancel cleanup error:', error);
    return NextResponse.json({ error: 'Failed to run cleanup' }, { status: 500 });
  }
}