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

    // First delete order items due to FK restriction, then delete the order
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin delete order error:', error);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}