import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

// Cancel a product order if still pending (used when Razorpay is dismissed or fails)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    if (['PAID', 'SHIPPED', 'DELIVERED'].includes(order.status as any)) {
      return NextResponse.json({ error: 'Order already processed' }, { status: 400 });
    }
    if (order.status === 'CANCELLED') {
      return NextResponse.json({ success: true, order });
    }
    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' as any, updatedAt: new Date() }
    });
    return NextResponse.json({ success: true, order: updated });
  } catch (error) {
    console.error('Cancel order error:', error);
    return NextResponse.json({ error: 'Failed to cancel order' }, { status: 500 });
  }
}