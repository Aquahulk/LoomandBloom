import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

function isAdmin(req: NextRequest) {
  return req.cookies.get('admin_authenticated')?.value === 'true';
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Check existence to avoid Prisma P2025 when deleting non-existent order
    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) {
      // Idempotent behavior: return 404 to indicate not found, rather than 500
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // First delete order items due to FK restriction, then delete the order (atomic)
    await prisma.$transaction([
      prisma.orderItem.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } })
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}